'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Package, Eye, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
import FirestoreTrackingService, { TrackingSearchFilters } from '@/services/firestoreTrackingService';
import { FirestoreTrackingItem, TrackingStatus } from '@/lib/firestore-schema';
import CreateTrackingModal from '@/Components/tracking/CreateTrackingModal';
import UpdateTrackingModal from '@/Components/tracking/UpdateTrackingModal';
import { generateReceiptPDF } from '@/utils/pdfGenerator';
import { FileText } from 'lucide-react';

interface TrackingStats {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  failed: number;
}

const trackingService = FirestoreTrackingService.getInstance();

const STATUS_COLORS = {
  [TrackingStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [TrackingStatus.PICKED_UP]: 'bg-blue-100 text-blue-800',
  [TrackingStatus.IN_TRANSIT]: 'bg-purple-100 text-purple-800',
  [TrackingStatus.OUT_FOR_DELIVERY]: 'bg-orange-100 text-orange-800',
  [TrackingStatus.DELIVERED]: 'bg-green-100 text-green-800',
  [TrackingStatus.FAILED_DELIVERY]: 'bg-red-100 text-red-800',
  [TrackingStatus.RETURNED_TO_SENDER]: 'bg-gray-100 text-gray-800',
  [TrackingStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [TrackingStatus.EXCEPTION]: 'bg-amber-100 text-amber-800'
};

export default function AdminTrackingDashboard() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [trackings, setTrackings] = useState<FirestoreTrackingItem[]>([]);
  const [stats, setStats] = useState<TrackingStats>({
    total: 0,
    pending: 0,
    inTransit: 0,
    delivered: 0,
    failed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TrackingStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<FirestoreTrackingItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    loadTrackings();
  }, [searchTerm, statusFilter]);

  const loadTrackings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: TrackingSearchFilters = {};
      if (searchTerm) {
        filters.searchQuery = searchTerm;
      }
      if (statusFilter !== 'all') {
        filters.status = [statusFilter as TrackingStatus];
      }

      const results = await trackingService.searchTrackingItems(filters);
      setTrackings(results);
      
      // Always load all items for accurate stats (not just filtered results)
      const allItems = await trackingService.getAllTrackingItems();
      
      const newStats = {
        total: allItems.length,
        pending: allItems.filter((t) => t.status === TrackingStatus.PENDING).length,
        inTransit: allItems.filter((t) => [
          TrackingStatus.PICKED_UP, 
          TrackingStatus.IN_TRANSIT, 
          TrackingStatus.OUT_FOR_DELIVERY
        ].includes(t.status)).length,
        delivered: allItems.filter((t) => t.status === TrackingStatus.DELIVERED).length,
        failed: allItems.filter((t) => [
          TrackingStatus.FAILED_DELIVERY, 
          TrackingStatus.RETURNED_TO_SENDER,
          TrackingStatus.CANCELLED
        ].includes(t.status)).length
      };
      setStats(newStats);
    } catch (err) {
      setError('Failed to load tracking items');
      console.error('Error loading trackings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTracking = async (data: any) => {
    try {
      const userId = user?.id || 'system';
      const newItem = await trackingService.createTrackingItem(data, userId);
      
      // Generate receipt PDF
      await generateReceiptPDF(newItem);
      
      setShowCreateModal(false);
      await loadTrackings();
    } catch (err) {
      console.error('Error creating tracking:', err);
      setError('Failed to create tracking item');
    }
  };

  const handleUpdateStatus = async (data: {
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
    try {
      const userId = user?.id || 'system';
      const updateRequest = {
        ...data,
        updatedBy: userId
      };
      await trackingService.updateTrackingStatus(updateRequest);
      setShowUpdateModal(false);
      setSelectedTracking(null);
      // Reload trackings to update the list and stats cards
      await loadTrackings();
    } catch (err: any) {
      console.error('Error updating status:', err);
      const errorMessage = err?.message || 'Failed to update tracking status';
      setError(errorMessage);
      // Show error for a few seconds then clear
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDeleteTracking = async (trackingId: string) => {
    if (!confirm('Are you sure you want to delete this tracking item?')) return;
    
    try {
      await trackingService.deleteTrackingItem(trackingId);
      loadTrackings();
    } catch (err) {
      console.error('Error deleting tracking:', err);
    }
  };

  if (!hasPermission('tracking', 'read')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">You don't have permission to view tracking data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tracking Management</h1>
          <p className="text-gray-600">Manage and monitor all tracking items</p>
        </div>
        {hasPermission('tracking', 'create') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Tracking
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <AlertCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">In Transit</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inTransit}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by tracking code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TrackingStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value={TrackingStatus.PENDING}>Pending</option>
              <option value={TrackingStatus.PICKED_UP}>Picked Up</option>
              <option value={TrackingStatus.IN_TRANSIT}>In Transit</option>
              <option value={TrackingStatus.OUT_FOR_DELIVERY}>Out for Delivery</option>
              <option value={TrackingStatus.DELIVERED}>Delivered</option>
              <option value={TrackingStatus.FAILED_DELIVERY}>Failed Delivery</option>
                    <option value={TrackingStatus.RETURNED_TO_SENDER}>Returned to Sender</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tracking Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
              <p className="mt-2 text-sm text-red-600">{error}</p>
            </div>
          </div>
        ) : trackings.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Package className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No tracking items found</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trackings.map((tracking) => (
                  <tr key={tracking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tracking.trackingId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{tracking.itemName}</div>
                      <div className="text-sm text-gray-500">{tracking.itemDescription}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{tracking.recipient.name}</div>
                        <div className="text-sm text-gray-500">{`${tracking.recipient.address.street}, ${tracking.recipient.address.city}, ${tracking.recipient.address.state} ${tracking.recipient.address.postalCode}`}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[tracking.status as keyof typeof STATUS_COLORS]}`}>
                        {tracking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tracking.createdAt.seconds * 1000).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateReceiptPDF(tracking)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Download Receipt"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTracking(tracking);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {hasPermission('tracking', 'update') && (
                          <button
                            onClick={() => {
                              setSelectedTracking(tracking);
                              setShowUpdateModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {hasPermission('tracking', 'delete') && (
                          <button
                            onClick={() => handleDeleteTracking(tracking.id!)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTrackingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTracking}
      />
      
      <UpdateTrackingModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedTracking(null);
        }}
        tracking={selectedTracking}
        onSubmit={handleUpdateStatus}
      />
    </div>
  );
}