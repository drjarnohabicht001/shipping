'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, Eye, Edit, Trash2, AlertCircle, Mail, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
import QuoteService, { QuoteSearchFilters } from '@/services/quoteService';
import { FirestoreQuote } from '@/lib/firestore-schema';
import QuoteDetailsModal from '@/Components/quotes/QuoteDetailsModal';
import QuoteEditModal from '@/Components/quotes/QuoteEditModal';

const quoteService = QuoteService.getInstance();

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800'
};

const STATUS_ICONS = {
  pending: Clock,
  sent: Mail,
  accepted: CheckCircle,
  rejected: XCircle,
  expired: AlertCircle
};

interface QuoteStats {
  total: number;
  pending: number;
  sent: number;
  accepted: number;
  rejected: number;
}

export default function AdminQuotesDashboard() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [quotes, setQuotes] = useState<FirestoreQuote[]>([]);
  const [stats, setStats] = useState<QuoteStats>({
    total: 0,
    pending: 0,
    sent: 0,
    accepted: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');
  const [selectedQuote, setSelectedQuote] = useState<FirestoreQuote | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, [searchTerm, statusFilter]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all quotes once and filter client-side to reduce Firestore reads
      const allQuotes = await quoteService.getAllQuotes();
      
      // Calculate stats from all quotes
      const newStats = {
        total: allQuotes.length,
        pending: allQuotes.filter((q) => q.status === 'pending').length,
        sent: allQuotes.filter((q) => q.status === 'sent').length,
        accepted: allQuotes.filter((q) => q.status === 'accepted').length,
        rejected: allQuotes.filter((q) => q.status === 'rejected').length
      };
      setStats(newStats);

      // Apply client-side filtering
      let filteredQuotes = allQuotes;
      
      // Filter by status
      if (statusFilter !== 'all') {
        filteredQuotes = filteredQuotes.filter(q => q.status === statusFilter);
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredQuotes = filteredQuotes.filter(q => 
          q.quoteNumber.toLowerCase().includes(searchLower) ||
          q.customer.name.toLowerCase().includes(searchLower) ||
          q.customer.email.toLowerCase().includes(searchLower) ||
          (q.customer.company && q.customer.company.toLowerCase().includes(searchLower))
        );
      }
      
      setQuotes(filteredQuotes);
    } catch (err: any) {
      // Handle rate limiting specifically
      if (err?.code === 'resource-exhausted' || err?.message?.includes('429')) {
        setError('Rate limit exceeded. Please wait a moment and try again.');
      } else {
        setError('Failed to load quotes');
      }
      console.error('Error loading quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;
    
    try {
      await quoteService.deleteQuote(quoteId);
      loadQuotes();
    } catch (err) {
      console.error('Error deleting quote:', err);
      setError('Failed to delete quote');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp && typeof timestamp.toDate === 'function' 
        ? timestamp.toDate() 
        : timestamp instanceof Date 
          ? timestamp 
          : new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  if (!hasPermission('quotes', 'read')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">You don't have permission to view quotes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quote Management</h1>
          <p className="text-gray-600">Manage and monitor all shipping quotes</p>
        </div>
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
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Sent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Accepted</p>
              <p className="text-2xl font-bold text-gray-900">{stats.accepted}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
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
                placeholder="Search by quote number, customer name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-[#FF5A24] focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5A24]"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
              <p className="mt-2 text-sm text-red-600">{error}</p>
            </div>
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Package className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No quotes found</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quote Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimated Cost
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
                {quotes.map((quote) => {
                  const StatusIcon = STATUS_ICONS[quote.status as keyof typeof STATUS_ICONS] || Clock;
                  return (
                    <tr key={quote.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{quote.quoteNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{quote.customer.name}</div>
                        <div className="text-sm text-gray-500">{quote.customer.email}</div>
                        {quote.customer.company && (
                          <div className="text-xs text-gray-400">{quote.customer.company}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {quote.origin.city}, {quote.origin.country}
                        </div>
                        <div className="text-xs text-gray-500">→ {quote.destination.city}, {quote.destination.country}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">{quote.serviceType.replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {quote.estimatedCost ? `$${quote.estimatedCost.toFixed(2)}` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[quote.status as keyof typeof STATUS_COLORS]}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(quote.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedQuote(quote);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {hasPermission('quotes', 'update') && (
                            <button
                              onClick={() => {
                                setSelectedQuote(quote);
                                setShowEditModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {hasPermission('quotes', 'delete') && (
                            <button
                              onClick={() => handleDeleteQuote(quote.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedQuote && (
        <QuoteDetailsModal
          quote={selectedQuote}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedQuote(null);
          }}
          onUpdate={loadQuotes}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedQuote && (
        <QuoteEditModal
          quote={selectedQuote}
          onClose={() => {
            setShowEditModal(false);
            setSelectedQuote(null);
          }}
          onUpdate={loadQuotes}
        />
      )}
    </div>
  );
}
