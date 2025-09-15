'use client';

import React, { useState } from 'react';
import { Search, Package, MapPin, Clock, CheckCircle, AlertCircle, Truck, Calendar } from 'lucide-react';
import { useTrackingUpdates } from '@/hooks/useTrackingUpdates';
import { TrackingStatus } from '@/lib/firestore-schema';
import { useAuth } from '@/contexts/AuthContext';

interface TrackingLookupProps {
  className?: string;
}

const TrackingLookup: React.FC<TrackingLookupProps> = ({ className = '' }) => {
  const [trackingInput, setTrackingInput] = useState('');
  const [searchedTrackingId, setSearchedTrackingId] = useState<string | null>(null);
  
  const { trackingItem, loading, error } = useTrackingUpdates(searchedTrackingId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = trackingInput.trim().toUpperCase();
    if (trimmedInput) {
      setSearchedTrackingId(trimmedInput);
    }
  };

  const getStatusIcon = (status: TrackingStatus) => {
    switch (status) {
      case TrackingStatus.DELIVERED:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case TrackingStatus.OUT_FOR_DELIVERY:
        return <Truck className="w-5 h-5 text-blue-500" />;
      case TrackingStatus.IN_TRANSIT:
        return <MapPin className="w-5 h-5 text-yellow-500" />;
      case TrackingStatus.EXCEPTION:
      case TrackingStatus.FAILED_DELIVERY:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TrackingStatus) => {
    switch (status) {
      case TrackingStatus.DELIVERED:
        return 'text-green-600 bg-green-50 border-green-200';
      case TrackingStatus.OUT_FOR_DELIVERY:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case TrackingStatus.IN_TRANSIT:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case TrackingStatus.EXCEPTION:
      case TrackingStatus.FAILED_DELIVERY:
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatStatus = (status: TrackingStatus) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Enter your tracking number (e.g., SH-2024-000001)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-lg"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !trackingInput.trim()}
            className="px-8 py-3 bg-[#FF5A24] text-white rounded-lg hover:bg-[#e54a1f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-colors"
          >
            <Search className="w-5 h-5" />
            {loading ? 'Searching...' : 'Track Package'}
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5A24] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Searching for your package...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-semibold">Tracking Not Found</h3>
          </div>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Tracking Results */}
      {trackingItem && !loading && (
        <div className="space-y-6">
          {/* Package Overview */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Package Details</h2>
              <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(trackingItem.status)}`}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(trackingItem.status)}
                  {formatStatus(trackingItem.status)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Tracking Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tracking ID:</span>
                    <span className="font-mono font-medium">{trackingItem.trackingId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Type:</span>
                    <span className="capitalize">{trackingItem.serviceType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <span className="capitalize">{trackingItem.priority}</span>
                  </div>
                  {trackingItem.weight && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weight:</span>
                      <span>{trackingItem.weight} kg</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Item Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Item:</span>
                    <span>{trackingItem.itemName}</span>
                  </div>
                  {trackingItem.itemDescription && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Description:</span>
                      <span>{trackingItem.itemDescription}</span>
                    </div>
                  )}
                  {trackingItem.itemValue && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Value:</span>
                      <span>${trackingItem.itemValue}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Delivery Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">From</h4>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{trackingItem.sender.name}</p>
                  {trackingItem.sender.companyName && (
                    <p>{trackingItem.sender.companyName}</p>
                  )}
                  <p>{trackingItem.sender.address.street}</p>
                  <p>{trackingItem.sender.address.city}, {trackingItem.sender.address.state} {trackingItem.sender.address.postalCode}</p>
                  <p>{trackingItem.sender.address.country}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">To</h4>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{trackingItem.recipient.name}</p>
                  {trackingItem.recipient.companyName && (
                    <p>{trackingItem.recipient.companyName}</p>
                  )}
                  <p>{trackingItem.recipient.address.street}</p>
                  <p>{trackingItem.recipient.address.city}, {trackingItem.recipient.address.state} {trackingItem.recipient.address.postalCode}</p>
                  <p>{trackingItem.recipient.address.country}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Estimated Delivery:</span>
                  <span className="font-medium">{formatDate(trackingItem.estimatedDeliveryDate)}</span>
                </div>
                {trackingItem.actualDeliveryDate && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">Delivered:</span>
                    <span className="font-medium">{formatDate(trackingItem.actualDeliveryDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Location */}
          {trackingItem.currentLocation && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Current Location
              </h3>
              <div className="text-sm">
                <p className="font-medium">{trackingItem.currentLocation.city}, {trackingItem.currentLocation.country}</p>
                {trackingItem.currentLocation.facility && (
                  <p className="text-gray-600">{trackingItem.currentLocation.facility}</p>
                )}
              </div>
            </div>
          )}

          {/* Tracking History */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="font-medium text-gray-900 mb-4">Tracking History</h3>
            
            <div className="space-y-4">
              {trackingItem.statusHistory
                .filter(update => update.isPublic)
                .sort((a, b) => {
                  const timeA = a.timestamp && typeof a.timestamp.toDate === 'function' ? a.timestamp.toDate().getTime() : new Date(a.timestamp as any).getTime();
                  const timeB = b.timestamp && typeof b.timestamp.toDate === 'function' ? b.timestamp.toDate().getTime() : new Date(b.timestamp as any).getTime();
                  return timeB - timeA;
                })
                .map((update, index) => (
                  <div key={update.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex-shrink-0">
                      {getStatusIcon(update.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{formatStatus(update.status)}</h4>
                        <span className="text-sm text-gray-500">{formatDate(update.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{update.description}</p>
                      {update.location && (
                        <p className="text-xs text-gray-500 mt-1">
                          {update.location.city}, {update.location.country}
                          {update.location.facility && ` - ${update.location.facility}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Special Instructions */}
          {(trackingItem.deliveryInstructions || trackingItem.specialInstructions) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 shadow-lg">
              <h3 className="font-medium text-yellow-800 mb-2">Special Instructions</h3>
              <div className="text-sm text-yellow-700 space-y-1">
                {trackingItem.deliveryInstructions && (
                  <p><strong>Delivery:</strong> {trackingItem.deliveryInstructions}</p>
                )}
                {trackingItem.specialInstructions && (
                  <p><strong>Handling:</strong> {trackingItem.specialInstructions}</p>
                )}
                {trackingItem.signatureRequired && (
                  <p><strong>Note:</strong> Signature required upon delivery</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackingLookup;