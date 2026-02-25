'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, MapPin, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import QuoteService from '@/services/quoteService';
import { FirestoreQuote } from '@/lib/firestore-schema';

const quoteService = QuoteService.getInstance();

export default function QuotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState<FirestoreQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customer: {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      }
    },
    origin: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    destination: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    items: [{
      description: '',
      quantity: 1,
      weight: 0,
      dimensions: {
        length: 0,
        width: 0,
        height: 0
      },
      value: 0,
      category: ''
    }],
    serviceType: 'standard' as const,
    priority: 'medium' as const,
    notes: ''
  });

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

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        quantity: 1,
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        value: 0,
        category: ''
      }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.customer.name || !formData.customer.email) {
        throw new Error('Please provide your name and email');
      }
      if (!formData.origin.city || !formData.origin.country) {
        throw new Error('Please provide origin city and country');
      }
      if (!formData.destination.city || !formData.destination.country) {
        throw new Error('Please provide destination city and country');
      }
      if (formData.items.length === 0 || formData.items.some(item => !item.description || item.weight <= 0)) {
        throw new Error('Please provide at least one item with description and weight');
      }

      // ... inside handleSubmit ...
      const quote = await quoteService.createQuote(formData);
      setGeneratedQuote(quote);
      setSuccess(true);
      
      // Auto-scroll to top to see the result
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote request');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setGeneratedQuote(null);
    setSuccess(false);
    setFormData({
      customer: {
        name: '',
        email: '',
        phone: '',
        company: '',
        address: { street: '', city: '', state: '', postalCode: '', country: '' }
      },
      origin: { street: '', city: '', state: '', postalCode: '', country: '' },
      destination: { street: '', city: '', state: '', postalCode: '', country: '' },
      items: [{
        description: '',
        quantity: 1,
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        value: 0,
        category: ''
      }],
      serviceType: 'standard',
      priority: 'medium',
      notes: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#FF5A24] to-[#e54a1f] pt-20 pb-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Get a Shipping Quote
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Fill out the form below and we'll provide you with a personalized shipping quote within 24 hours.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {success && generatedQuote && (
            <div className="mb-8 bg-white border border-green-200 rounded-xl shadow-lg overflow-hidden animate-fade-in">
              <div className="bg-green-50 p-6 border-b border-green-100">
                <div className="flex items-center gap-3 text-green-800 mb-2">
                  <CheckCircle className="h-8 w-8" />
                  <div>
                    <h3 className="text-xl font-bold">Quote Generated Successfully!</h3>
                    <p className="text-green-700 text-sm">Your quote is ready for review.</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Details</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600 block text-xs">Quote Number</span>
                      <span className="font-mono font-bold text-lg text-gray-900">{generatedQuote.quoteNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-xs">Status</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 capitalize">
                        {generatedQuote.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-xs">Valid Until</span>
                      <span className="font-medium text-gray-900">
                        {generatedQuote.validUntil?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                  <span className="text-gray-500 text-sm font-medium mb-1">Estimated Cost</span>
                  <span className="text-4xl font-bold text-[#FF5A24]">
                    ${generatedQuote.estimatedCost?.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400 mt-2">USD</span>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Create Another Quote
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <h3 className="font-semibold">Error</h3>
              </div>
              <p className="text-red-700 mt-2">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-8">
            {/* Customer Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="h-6 w-6 text-[#FF5A24]" />
                Your Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer.name}
                    onChange={(e) => updateFormData('customer.name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.customer.email}
                    onChange={(e) => updateFormData('customer.email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.customer.phone}
                    onChange={(e) => updateFormData('customer.phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.customer.company}
                    onChange={(e) => updateFormData('customer.company', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Origin */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-[#FF5A24]" />
                Origin Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    value={formData.origin.street}
                    onChange={(e) => updateFormData('origin.street', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.origin.city}
                    onChange={(e) => updateFormData('origin.city', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                  <input
                    type="text"
                    value={formData.origin.state}
                    onChange={(e) => updateFormData('origin.state', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={formData.origin.postalCode}
                    onChange={(e) => updateFormData('origin.postalCode', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                  <input
                    type="text"
                    required
                    value={formData.origin.country}
                    onChange={(e) => updateFormData('origin.country', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-[#FF5A24]" />
                Destination Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    value={formData.destination.street}
                    onChange={(e) => updateFormData('destination.street', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination.city}
                    onChange={(e) => updateFormData('destination.city', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                  <input
                    type="text"
                    value={formData.destination.state}
                    onChange={(e) => updateFormData('destination.state', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={formData.destination.postalCode}
                    onChange={(e) => updateFormData('destination.postalCode', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination.country}
                    onChange={(e) => updateFormData('destination.country', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="h-6 w-6 text-[#FF5A24]" />
                  Items to Ship
                </h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-[#FF5A24] text-white rounded-lg hover:bg-[#e54a1f] flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">Item {index + 1}</h3>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].description = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].quantity = parseInt(e.target.value) || 1;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.1"
                        value={item.weight}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].weight = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Length (cm)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.dimensions.length}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].dimensions.length = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Width (cm)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.dimensions.width}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].dimensions.width = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.dimensions.height}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].dimensions.height = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Value ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.value}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].value = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Service Options */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Service Options</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Type *</label>
                  <select
                    required
                    value={formData.serviceType}
                    onChange={(e) => updateFormData('serviceType', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  >
                    <option value="standard">Standard</option>
                    <option value="express">Express</option>
                    <option value="overnight">Overnight</option>
                    <option value="international">International</option>
                    <option value="same_day">Same Day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => updateFormData('priority', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24] text-gray-900"
                placeholder="Any special instructions or requirements..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-[#FF5A24] text-white rounded-lg hover:bg-[#e54a1f] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Quote Request'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
