'use client';

import React from 'react';
import { X, Package, MapPin, User, Mail, Phone, Calendar, DollarSign, FileText } from 'lucide-react';
import { FirestoreQuote } from '@/lib/firestore-schema';

interface QuoteDetailsModalProps {
  quote: FirestoreQuote;
  onClose: () => void;
  onUpdate: () => void;
}

const QuoteDetailsModal: React.FC<QuoteDetailsModalProps> = ({ quote, onClose, onUpdate }) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp && typeof timestamp.toDate === 'function' 
        ? timestamp.toDate() 
        : timestamp instanceof Date 
          ? timestamp 
          : new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Quote Details: {quote.quoteNumber}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Cost */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[quote.status as keyof typeof STATUS_COLORS]}`}>
                {quote.status.toUpperCase()}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
              <p className="text-lg font-semibold text-gray-900">
                {quote.estimatedCost ? `$${quote.estimatedCost.toFixed(2)}` : 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <p className="text-sm text-gray-900">{formatDate(quote.validUntil)}</p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-[#FF5A24]" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-sm text-gray-900">{quote.customer.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-sm text-gray-900">{quote.customer.email}</p>
              </div>
              {quote.customer.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-sm text-gray-900">{quote.customer.phone}</p>
                </div>
              )}
              {quote.customer.company && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <p className="text-sm text-gray-900">{quote.customer.company}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <p className="text-sm text-gray-900">
                  {quote.customer.address.street}, {quote.customer.address.city}, {quote.customer.address.state} {quote.customer.address.postalCode}, {quote.customer.address.country}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Route */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#FF5A24]" />
              Shipping Route
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Origin</label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-900">{quote.origin.street}</p>
                  <p className="text-sm text-gray-900">{quote.origin.city}, {quote.origin.state} {quote.origin.postalCode}</p>
                  <p className="text-sm text-gray-900">{quote.origin.country}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-900">{quote.destination.street}</p>
                  <p className="text-sm text-gray-900">{quote.destination.city}, {quote.destination.state} {quote.destination.postalCode}</p>
                  <p className="text-sm text-gray-900">{quote.destination.country}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-[#FF5A24]" />
              Items ({quote.items.length})
            </h3>
            <div className="space-y-4">
              {quote.items.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <p className="text-sm text-gray-900">{item.description}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <p className="text-sm text-gray-900">{item.quantity}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                      <p className="text-sm text-gray-900">{item.weight} kg</p>
                    </div>
                    {item.dimensions && (item.dimensions.length || item.dimensions.width || item.dimensions.height) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
                        <p className="text-sm text-gray-900">{item.dimensions.length} × {item.dimensions.width} × {item.dimensions.height} cm</p>
                      </div>
                    )}
                    {item.value && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                        <p className="text-sm text-gray-900">${item.value.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service Options */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <p className="text-sm text-gray-900 capitalize">{quote.serviceType.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <p className="text-sm text-gray-900 capitalize">{quote.priority}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(quote.notes || quote.adminNotes) && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#FF5A24]" />
                Notes
              </h3>
              {quote.notes && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Notes</label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{quote.notes}</p>
                </div>
              )}
              {quote.adminNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                  <p className="text-sm text-gray-900 bg-blue-50 rounded-lg p-3">{quote.adminNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#FF5A24]" />
              Timeline
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-900">{formatDate(quote.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="text-gray-900">{formatDate(quote.updatedAt)}</span>
              </div>
              {quote.sentAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sent:</span>
                  <span className="text-gray-900">{formatDate(quote.sentAt)}</span>
                </div>
              )}
              {quote.respondedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Responded:</span>
                  <span className="text-gray-900">{formatDate(quote.respondedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetailsModal;
