'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  MapPin,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/Components/Button';
import { trackingService } from '@/services/trackingService';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { TrackingStatus } from '@/lib/firestore-schema';

// Interfaces are now imported from the hook

export default function AdminDashboard() {
  const { 
    trackingStats, 
    statusDistribution, 
    recentTrackings, 
    performanceMetrics, 
    loading, 
    error,
    refetch 
  } = useDashboardStats();

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load dashboard data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refetch} className="bg-[#FF5A24] hover:bg-[#e54a1f]">
             <RefreshCw className="h-4 w-4 mr-2" />
             Try Again
           </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case TrackingStatus.DELIVERED:
        return 'bg-green-500';
      case TrackingStatus.IN_TRANSIT:
      case TrackingStatus.OUT_FOR_DELIVERY:
        return 'bg-blue-500';
      case TrackingStatus.PENDING:
        return 'bg-yellow-500';
      case TrackingStatus.FAILED_DELIVERY:
      case TrackingStatus.CANCELLED:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case TrackingStatus.DELIVERED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case TrackingStatus.IN_TRANSIT:
      case TrackingStatus.OUT_FOR_DELIVERY:
        return <Truck className="h-4 w-4 text-blue-600" />;
      case TrackingStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case TrackingStatus.FAILED_DELIVERY:
      case TrackingStatus.CANCELLED:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatStatusDisplay = (status: string) => {
    switch (status) {
      case TrackingStatus.IN_TRANSIT:
        return 'In Transit';
      case TrackingStatus.OUT_FOR_DELIVERY:
        return 'Out for Delivery';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case TrackingStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case TrackingStatus.IN_TRANSIT:
      case TrackingStatus.OUT_FOR_DELIVERY:
        return 'bg-blue-100 text-blue-800';
      case TrackingStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case TrackingStatus.FAILED_DELIVERY:
      case TrackingStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#FF5A24] to-[#e54a1f] rounded-lg p-6 text-white animate-pulse">
          <div className="h-6 bg-orange-300 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-orange-200 rounded w-2/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#FF5A24] to-[#e54a1f] rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Tracking Dashboard</h1>
            <p className="text-orange-100">Real-time overview of all tracking operations and performance metrics.</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
               onClick={refetch} 
               variant="secondary" 
               size="sm"
               disabled={loading}
               className="bg-white/10 hover:bg-white/20 text-white border-white/20"
             >
               {loading ? (
                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
               ) : (
                 <RefreshCw className="h-4 w-4 mr-2" />
               )}
               Refresh
             </Button>
            <div className="text-right">
              <p className="text-orange-100 text-sm">Total Trackings</p>
              <p className="text-3xl font-bold">{trackingStats.total.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{trackingStats.delivered.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Success Rate</span>
              <span className="font-medium text-green-600">
                {trackingStats.total > 0 ? Math.round((trackingStats.delivered / trackingStats.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-blue-600">{trackingStats.inTransit.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Active Rate</span>
              <span className="font-medium text-blue-600">
                {trackingStats.total > 0 ? Math.round((trackingStats.inTransit / trackingStats.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{trackingStats.pending.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Avg. Processing</span>
              <span className="font-medium text-yellow-600">2.3 days</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{trackingStats.failed.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Failure Rate</span>
              <span className="font-medium text-red-600">
                {trackingStats.total > 0 ? Math.round((trackingStats.failed / trackingStats.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">{metric.label}</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {metric.value}{metric.unit}
                </p>
              </div>
              <div className="flex items-center text-sm">
                {getTrendIcon(metric.trend)}
                <span className={`ml-1 font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}{metric.trendValue}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Status Distribution</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {statusDistribution.map((status, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(status.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatStatusDisplay(status.status)}</p>
                      <p className="text-xs text-gray-500">{status.count} items</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                     <div className="w-24 bg-gray-200 rounded-full h-2">
                       <div 
                         className={`h-2 rounded-full ${getStatusColor(status.status)}`}
                         style={{ width: `${status.percentage}%` }}
                       />
                     </div>
                     <span className="text-sm font-medium text-gray-900 w-12 text-right">
                       {status.percentage.toFixed(1)}%
                     </span>
                   </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Items</span>
                <span className="font-medium text-gray-900">{trackingStats.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tracking Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Tracking Activities</h2>
              <Button variant="secondary" size="sm">
                View All
              </Button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentTrackings.map((tracking, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                     tracking.status === 'delivered' ? 'bg-green-100' :
                     tracking.status === 'in_transit' ? 'bg-blue-100' :
                     tracking.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                   }`}>
                     {getStatusIcon(tracking.status)}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {tracking.trackingNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {tracking.destination} • {tracking.lastUpdate}
                      </p>
                    </div>
                   <div className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${getStatusBadgeColor(tracking.status)}`}>
                     {formatStatusDisplay(tracking.status)}
                   </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Avg. Delivery Time</span>
                <span className="font-medium text-gray-900">
                  {trackingStats.averageDeliveryTime.toFixed(1)} days
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500">On-Time Delivery Rate</span>
                <span className="font-medium text-green-600">
                  {trackingStats.onTimeDeliveryRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}