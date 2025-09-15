'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/Components/Button';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
import { trackingService } from '@/services/trackingService';
import { auditService } from '@/services/auditService';
import { TrackingNumber, TrackingHistory } from '@/types/tracking';
import { TrackingStatus } from '@/lib/firestore-schema';
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

const TrackingDetails = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [tracking, setTracking] = useState<TrackingNumber | null>(null);
  const [history, setHistory] = useState<TrackingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<TrackingStatus>(TrackingStatus.PENDING);
  const [newLocation, setNewLocation] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const trackingId = params.id as string;

  useEffect(() => {
    if (trackingId) {
      loadTrackingDetails();
    }
  }, [trackingId]);

  const loadTrackingDetails = async () => {
    setLoading(true);
    try {
      const trackingData = await trackingService.getTrackingById(trackingId);
      const historyData = await trackingService.getTrackingHistory(trackingId);
      
      setTracking(trackingData);
      setHistory(historyData);
      setNewStatus(trackingData?.status || 'pending');
    } catch (error) {
      console.error('Failed to load tracking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!tracking || !user) return;
    
    setUpdating(true);
    try {
      await trackingService.updateTrackingStatus(
        tracking.trackingNumber,
        newStatus,
        newLocation,
        newNotes,
        user.id,
        user.name
      );

      // Log the action
      await auditService.logAction(
        user.id,
        user.name,
        'UPDATE_STATUS',
        'tracking_number',
        {
          trackingNumber: tracking.trackingNumber,
          oldStatus: tracking.status,
          newStatus,
          location: newLocation,
          notes: newNotes
        },
        {
          resourceId: tracking.trackingNumber,
          severity: 'medium'
        }
      );

      // Reload data
      await loadTrackingDetails();
      setEditingStatus(false);
      setNewLocation('');
      setNewNotes('');
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: TrackingStatus) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'picked_up': return <Package className="h-5 w-5 text-blue-500" />;
      case 'in_transit': return <Truck className="h-5 w-5 text-purple-500" />;
      case 'out_for_delivery': return <MapPin className="h-5 w-5 text-orange-500" />;
      case 'delivered': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'exception': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TrackingStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'picked_up': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'exception': return 'bg-red-100 text-red-800';
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
      ['Timestamp', 'Status', 'Location', 'Notes', 'Updated By'],
      ...history.map(h => [
        new Date(h.timestamp).toISOString(),
        h.status,
        h.location || '',
        h.notes || '',
        h.updatedBy || 'System'
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracking-history-${tracking.trackingNumber}.csv`;
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
            <h1 className="text-2xl font-bold text-gray-900">{tracking.trackingNumber}</h1>
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
              onClick={() => setEditingStatus(true)} 
              size="sm"
              disabled={editingStatus}
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
            <p className="text-sm text-gray-900">{new Date(tracking.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                <p className="text-sm text-gray-900">{tracking.sender.address}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <p className="text-sm text-gray-900">{tracking.recipient.address}</p>
          </div>
        </div>
        
        {tracking.estimatedDelivery && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery</label>
            <p className="text-sm text-gray-900">{new Date(tracking.estimatedDelivery).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      {/* Status Update Form */}
      {editingStatus && hasPermission('tracking', 'write') && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Update Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as TrackingStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={TrackingStatus.PENDING}>Pending</option>
                <option value={TrackingStatus.PICKED_UP}>Picked Up</option>
                <option value={TrackingStatus.IN_TRANSIT}>In Transit</option>
                <option value={TrackingStatus.OUT_FOR_DELIVERY}>Out for Delivery</option>
                <option value={TrackingStatus.DELIVERED}>Delivered</option>
                <option value={TrackingStatus.EXCEPTION}>Exception</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Current location..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={handleStatusUpdate} 
              disabled={updating}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
            <Button 
              onClick={() => {
                setEditingStatus(false);
                setNewStatus(tracking.status);
                setNewLocation('');
                setNewNotes('');
              }} 
              variant="outline"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Tracking History */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tracking History</h3>
          <p className="text-sm text-gray-600">Complete timeline of status updates</p>
        </div>
        
        <div className="p-6">
          {history.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No History Available</h3>
              <p className="text-gray-500">No status updates have been recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
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
                            {entry.location}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    {entry.notes && (
                      <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
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
    </div>
  );
};

export default TrackingDetails;