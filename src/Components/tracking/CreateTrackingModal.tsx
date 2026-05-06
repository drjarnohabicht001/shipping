'use client';

import React, { useState } from 'react';
import { X, Package, User, MapPin } from 'lucide-react';

interface CreateTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

const CreateTrackingModal: React.FC<CreateTrackingModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '',
    itemDescription: '',
    itemValue: '',
    weight: '',
    cost: '',
    vat: '',
    tax: '',
    serviceType: 'standard' as const,
    priority: 'medium' as const,
    sender: {
      name: '',
      email: '',
      phone: '',
      companyName: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      }
    },
    recipient: {
      name: '',
      email: '',
      phone: '',
      companyName: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      }
    },
    deliveryInstructions: '',
    specialInstructions: '',
    signatureRequired: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        itemValue: formData.itemValue ? parseFloat(formData.itemValue) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        vat: formData.vat ? parseFloat(formData.vat) : undefined,
        tax: formData.tax ? parseFloat(formData.tax) : undefined,
        status: 'pending' as const
      };
      
      await onSubmit(submitData);
      onClose();
      // Reset form
      setFormData({
        itemName: '',
        itemDescription: '',
        itemValue: '',
        weight: '',
        cost: '',
        vat: '',
        tax: '',
        serviceType: 'standard' as const,
        priority: 'medium' as const,
        sender: {
          name: '',
          email: '',
          phone: '',
          companyName: '',
          address: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: ''
          }
        },
        recipient: {
          name: '',
          email: '',
          phone: '',
          companyName: '',
          address: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: ''
          }
        },
        deliveryInstructions: '',
        specialInstructions: '',
        signatureRequired: false
      });
    } catch (error) {
      console.error('Error creating tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create New Tracking Item
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Item Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Item Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={(e) => updateFormData('itemName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => updateFormData('weight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.itemDescription}
                  onChange={(e) => updateFormData('itemDescription', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.itemValue}
                  onChange={(e) => updateFormData('itemValue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => updateFormData('serviceType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="overnight">Overnight</option>
                  <option value="international">International</option>
                </select>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <span className="text-green-600">$</span>
              Financial Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => updateFormData('cost', e.target.value)}
                  placeholder="Auto-calculated if empty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VAT ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.vat}
                  onChange={(e) => updateFormData('vat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax}
                  onChange={(e) => updateFormData('tax', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Sender Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sender.name}
                  onChange={(e) => updateFormData('sender.name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.sender.email}
                  onChange={(e) => updateFormData('sender.email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.sender.phone}
                  onChange={(e) => updateFormData('sender.phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.sender.companyName}
                  onChange={(e) => updateFormData('sender.companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Sender Address */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Street Address *"
                    required
                    value={formData.sender.address.street}
                    onChange={(e) => updateFormData('sender.address.street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="City *"
                    required
                    value={formData.sender.address.city}
                    onChange={(e) => updateFormData('sender.address.city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="State/Province *"
                    required
                    value={formData.sender.address.state}
                    onChange={(e) => updateFormData('sender.address.state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Postal Code *"
                    required
                    value={formData.sender.address.postalCode}
                    onChange={(e) => updateFormData('sender.address.postalCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Country *"
                    required
                    value={formData.sender.address.country}
                    onChange={(e) => updateFormData('sender.address.country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recipient Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Recipient Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.recipient.name}
                  onChange={(e) => updateFormData('recipient.name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.recipient.companyName}
                  onChange={(e) => updateFormData('recipient.companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Recipient Address */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Street Address *"
                    required
                    value={formData.recipient.address.street}
                    onChange={(e) => updateFormData('recipient.address.street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="City *"
                    required
                    value={formData.recipient.address.city}
                    onChange={(e) => updateFormData('recipient.address.city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="State/Province *"
                    required
                    value={formData.recipient.address.state}
                    onChange={(e) => updateFormData('recipient.address.state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Postal Code *"
                    required
                    value={formData.recipient.address.postalCode}
                    onChange={(e) => updateFormData('recipient.address.postalCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Country *"
                    required
                    value={formData.recipient.address.country}
                    onChange={(e) => updateFormData('recipient.address.country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Additional Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => updateFormData('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="signatureRequired"
                  checked={formData.signatureRequired}
                  onChange={(e) => updateFormData('signatureRequired', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="signatureRequired" className="ml-2 block text-sm text-gray-700">
                  Signature Required
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Instructions
              </label>
              <textarea
                value={formData.deliveryInstructions}
                onChange={(e) => updateFormData('deliveryInstructions', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Special delivery instructions..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                value={formData.specialInstructions}
                onChange={(e) => updateFormData('specialInstructions', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Handling instructions, fragile items, etc..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Tracking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTrackingModal;
