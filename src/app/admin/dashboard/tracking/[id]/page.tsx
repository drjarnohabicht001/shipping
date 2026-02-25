'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/Components/Button';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
import FirestoreTrackingService from '@/services/firestoreTrackingService';
import { auditService } from '@/services/auditService';
import { FirestoreTrackingItem, TrackingStatus } from '@/lib/firestore-schema';
import UpdateTrackingModal from '@/Components/tracking/UpdateTrackingModal';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Clock, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Edit, 
  Save, 
  X,
  Calendar,
  User,
  FileText,
  Download
} from 'lucide-react';

const trackingService = FirestoreTrackingService.getInstance();

const TrackingDetails = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [tracking, setTracking] = useState<FirestoreTrackingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const trackingId = params.id as string;

  useEffect(() => {
    if (trackingId) {
      loadTrackingDetails();
    }
  }, [trackingId]);

  const loadTrackingDetails = async () => {
    setLoading(true);
    try {
      const trackingData = await trackingService.getTrackingByTrackingId(trackingId);
      setTracking(trackingData);
    } catch (error) {
      console.error('Failed to load tracking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (data: {
    trackingId: string;
    status: TrackingStatus;
    location?: {
      city: string;
      state?: string;
      country: string;
      facility?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    description: string;
    notes?: string;
    isPublic?: boolean;
    estimatedDeliveryDate?: Date;
  }) => {
    if (!tracking || !user) return;
    
    try {
      const userId = user?.uid || user?.id || 'system';
      const updateRequest = {
        ...data,
        updatedBy: userId
      };
      
      await trackingService.updateTrackingStatus(updateRequest);

      // Log the action
      try {
        await auditService.logAction(
          userId,
          user.name || 'Admin',
          'UPDATE_STATUS',
          'tracking_number',
          {
            trackingNumber: tracking.trackingId,
            oldStatus: tracking.status,
            newStatus: data.status,
            location: data.location,
            notes: data.notes
          },
          {
            resourceId: tracking.trackingId,
            severity: 'medium'
          }
        );
      } catch (auditError) {
        console.warn('Failed to log audit action:', auditError);
      }

      // Reload data
      await loadTrackingDetails();
      setShowUpdateModal(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      let date: Date;
      
      // Handle Firestore Timestamp
      if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } 
      // Handle Firestore Timestamp with seconds/nanoseconds
      else if (timestamp && typeof timestamp.seconds === 'number') {
        date = new Date(timestamp.seconds * 1000);
      }
      // Handle Date object
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Handle string or number
      else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      }
      // Fallback
      else {
        return 'N/A';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'N/A';
    }
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      let date: Date;
      
      // Handle Firestore Timestamp
      if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } 
      // Handle Firestore Timestamp with seconds/nanoseconds
      else if (timestamp && typeof timestamp.seconds === 'number') {
        date = new Date(timestamp.seconds * 1000);
      }
      // Handle Date object
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Handle string or number
      else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      }
      // Fallback
      else {
        return 'N/A';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'N/A';
    }
  };

  const getStatusIcon = (status: TrackingStatus) => {
    switch (status) {
      case TrackingStatus.PENDING: return <Clock className="h-5 w-5 text-yellow-500" />;
      case TrackingStatus.PICKED_UP: return <Package className="h-5 w-5 text-blue-500" />;
      case TrackingStatus.IN_TRANSIT: return <Truck className="h-5 w-5 text-purple-500" />;
      case TrackingStatus.OUT_FOR_DELIVERY: return <MapPin className="h-5 w-5 text-orange-500" />;
      case TrackingStatus.DELIVERED: return <CheckCircle className="h-5 w-5 text-green-500" />;
      case TrackingStatus.EXCEPTION: return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TrackingStatus) => {
    switch (status) {
      case TrackingStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case TrackingStatus.PICKED_UP: return 'bg-blue-100 text-blue-800';
      case TrackingStatus.IN_TRANSIT: return 'bg-purple-100 text-purple-800';
      case TrackingStatus.OUT_FOR_DELIVERY: return 'bg-orange-100 text-orange-800';
      case TrackingStatus.DELIVERED: return 'bg-green-100 text-green-800';
      case TrackingStatus.EXCEPTION: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportHistory = async () => {
    if (!tracking) return;
    
    const csvContent = [
      ['Timestamp', 'Status', 'Location', 'Description', 'Notes', 'Updated By'],
      ...tracking.statusHistory.map(h => {
        const timestamp = h.timestamp && typeof h.timestamp.toDate === 'function' 
          ? h.timestamp.toDate().toISOString() 
          : new Date(h.timestamp as any).toISOString();
        const location = h.location 
          ? `${h.location.city}, ${h.location.country}${h.location.facility ? ` - ${h.location.facility}` : ''}`
          : '';
        return [
          timestamp,
          h.status,
          location,
          h.description || '',
          h.notes || '',
          h.updatedBy || 'System'
        ];
      })
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracking-history-${tracking.trackingId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-500">Loading tracking details...</span>
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tracking Not Found</h3>
          <p className="text-gray-500 mb-4">The requested tracking number could not be found.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tracking.trackingId}</h1>
            <p className="text-gray-600">Tracking Details & History</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportHistory} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
          {hasPermission('tracking', 'write') && (
            <Button 
              onClick={() => setShowUpdateModal(true)} 
              size="sm"
            >
              <Edit className="h-4 w-4 mr-2" />
              Update Status
            </Button>
          )}
        </div>
      </div>

      {/* Tracking Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
            <div className="flex items-center gap-2">
              {getStatusIcon(tracking.status)}
              <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getStatusColor(tracking.status)}`}>
                {tracking.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            <p className="text-sm text-gray-900 capitalize">{tracking.serviceType}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getPriorityColor(tracking.priority)}`}>
              {tracking.priority.toUpperCase()}
            </span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
            <p className="text-sm text-gray-900">{formatDate(tracking.createdAt)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
            <div className="text-sm text-gray-900">
              <p className="font-medium">{tracking.sender.name}</p>
              <p>{tracking.sender.address.street}</p>
              <p>{tracking.sender.address.city}, {tracking.sender.address.state} {tracking.sender.address.postalCode}</p>
              <p>{tracking.sender.address.country}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
            <div className="text-sm text-gray-900">
              <p className="font-medium">{tracking.recipient.name}</p>
              <p>{tracking.recipient.address.street}</p>
              <p>{tracking.recipient.address.city}, {tracking.recipient.address.state} {tracking.recipient.address.postalCode}</p>
              <p>{tracking.recipient.address.country}</p>
            </div>
          </div>
        </div>
        
        {tracking.currentLocation && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#FF5A24]" />
              Current Location
            </label>
            <div className="text-sm text-gray-900">
              <p className="font-medium">{tracking.currentLocation.city}{tracking.currentLocation.state ? `, ${tracking.currentLocation.state}` : ''}, {tracking.currentLocation.country}</p>
              {tracking.currentLocation.facility && (
                <p className="text-gray-600">{tracking.currentLocation.facility}</p>
              )}
            </div>
          </div>
        )}
        
        {tracking.estimatedDeliveryDate && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery</label>
            <p className="text-sm text-gray-900">{formatDate(tracking.estimatedDeliveryDate)}</p>
          </div>
        )}
      </div>

      {/* Tracking History */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tracking History</h3>
          <p className="text-sm text-gray-600">Complete timeline of status updates</p>
        </div>
        
        <div className="p-6">
          {!tracking.statusHistory || tracking.statusHistory.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No History Available</h3>
              <p className="text-gray-500">No status updates have been recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tracking.statusHistory
                .sort((a, b) => {
                  const timeA = a.timestamp && typeof a.timestamp.toDate === 'function' 
                    ? a.timestamp.toDate().getTime() 
                    : new Date(a.timestamp as any).getTime();
                  const timeB = b.timestamp && typeof b.timestamp.toDate === 'function' 
                    ? b.timestamp.toDate().getTime() 
                    : new Date(b.timestamp as any).getTime();
                  return timeB - timeA;
                })
                .map((entry, index) => (
                <div key={entry.id} className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {getStatusIcon(entry.status)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                          {entry.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {entry.location && (
                          <span className="text-sm text-gray-600 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {entry.location.city}, {entry.location.country}
                            {entry.location.facility && ` - ${entry.location.facility}`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDateTime(entry.timestamp)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                    
                    {entry.notes && (
                      <p className="text-sm text-gray-500 mt-1 italic">Note: {entry.notes}</p>
                    )}
                    
                    {entry.updatedBy && (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <User className="h-3 w-3 mr-1" />
                        Updated by {entry.updatedBy}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Update Modal */}
      <UpdateTrackingModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        tracking={tracking}
        onSubmit={handleStatusUpdate}
      />
    </div>
  );
};

export default TrackingDetails;