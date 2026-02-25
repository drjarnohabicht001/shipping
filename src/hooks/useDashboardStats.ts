import { useState, useEffect, useCallback } from 'react';
import FirestoreTrackingService from '@/services/firestoreTrackingService';
import { FirestoreTrackingItem } from '@/lib/firestore-schema';
import { TrackingStatus } from '@/lib/firestore-schema';

export interface DashboardStats {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  failed: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface RecentTracking {
  id: string;
  trackingNumber: string;
  status: string;
  destination: string;
  lastUpdate: string;
  estimatedDelivery?: string;
}

export interface PerformanceMetric {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

export interface UseDashboardStatsResult {
  trackingStats: DashboardStats;
  statusDistribution: StatusDistribution[];
  recentTrackings: RecentTracking[];
  performanceMetrics: PerformanceMetric[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook for real-time dashboard statistics
 * @param enableRealTime - Whether to enable real-time updates (default: true)
 */
export const useDashboardStats = (
  enableRealTime: boolean = true
): UseDashboardStatsResult => {
  const [trackingItems, setTrackingItems] = useState<FirestoreTrackingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previousStats, setPreviousStats] = useState<DashboardStats | null>(null);

  const trackingService = FirestoreTrackingService.getInstance();

  // Helper function to safely convert Firestore Timestamp to Date
  const toDate = useCallback((timestamp: any): Date | null => {
    if (!timestamp) return null;

    // Check if it's a Firestore Timestamp with toDate method
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }

    // Check if it's already a Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }

    // Check if it has seconds property (Firestore Timestamp structure)
    if (timestamp && typeof timestamp.seconds === 'number') {
      return new Date(timestamp.seconds * 1000);
    }

    return null;
  }, []);

  // Calculate statistics from tracking items
  const calculateStats = useCallback((items: FirestoreTrackingItem[]): DashboardStats => {
    const total = items.length;
    const pending = items.filter(item => item.status === TrackingStatus.PENDING).length;
    const inTransit = items.filter(item =>
      item.status === TrackingStatus.IN_TRANSIT ||
      item.status === TrackingStatus.OUT_FOR_DELIVERY
    ).length;
    const delivered = items.filter(item => item.status === TrackingStatus.DELIVERED).length;
    const failed = items.filter(item =>
      item.status === TrackingStatus.FAILED_DELIVERY ||
      item.status === TrackingStatus.CANCELLED
    ).length;

    // Calculate average delivery time for delivered items
    const deliveredItems = items.filter(item =>
      item.status === TrackingStatus.DELIVERED &&
      item.actualDeliveryDate &&
      item.createdAt
    );

    let averageDeliveryTime = 0;
    if (deliveredItems.length > 0) {
      const totalDeliveryTime = deliveredItems.reduce((sum, item) => {
        const createdDate = toDate(item.createdAt);
        const deliveredDate = toDate(item.actualDeliveryDate);

        if (!createdDate || !deliveredDate) return sum;

        const deliveryTime = (deliveredDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        return sum + deliveryTime;
      }, 0);
      averageDeliveryTime = totalDeliveryTime / deliveredItems.length;
    }

    // Calculate on-time delivery rate
    const itemsWithEstimatedDelivery = deliveredItems.filter(item => item.estimatedDeliveryDate);
    let onTimeDeliveryRate = 0;
    if (itemsWithEstimatedDelivery.length > 0) {
      const onTimeDeliveries = itemsWithEstimatedDelivery.filter(item => {
        const actualDate = toDate(item.actualDeliveryDate);
        const estimatedDate = toDate(item.estimatedDeliveryDate);

        if (!actualDate || !estimatedDate) return false;

        return actualDate <= estimatedDate;
      }).length;
      onTimeDeliveryRate = (onTimeDeliveries / itemsWithEstimatedDelivery.length) * 100;
    }

    return {
      total,
      pending,
      inTransit,
      delivered,
      failed,
      averageDeliveryTime,
      onTimeDeliveryRate
    };
  }, [toDate]);

  // Calculate status distribution
  const calculateStatusDistribution = useCallback((items: FirestoreTrackingItem[]): StatusDistribution[] => {
    const total = items.length;
    if (total === 0) return [];

    const statusCounts = items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: (count / total) * 100
    }));
  }, []);

  // Get recent tracking activities
  const getRecentTrackings = useCallback((items: FirestoreTrackingItem[]): RecentTracking[] => {
    return items
      .slice(0, 10) // Get latest 10 items
      .map(item => {
        // Safely convert Timestamp to Date
        const getDateString = (timestamp: any): string => {
          if (!timestamp) return 'N/A';

          // Check if it's a Firestore Timestamp with toDate method
          if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleDateString();
          }

          // Check if it's already a Date object
          if (timestamp instanceof Date) {
            return timestamp.toLocaleDateString();
          }

          // Check if it has seconds property (Firestore Timestamp structure)
          if (timestamp && typeof timestamp.seconds === 'number') {
            return new Date(timestamp.seconds * 1000).toLocaleDateString();
          }

          return 'N/A';
        };

        return {
          id: item.id,
          trackingNumber: item.trackingId,
          status: item.status,
          destination: `${item.recipient.address.city}, ${item.recipient.address.state}`,
          lastUpdate: getDateString(item.updatedAt),
          estimatedDelivery: item.estimatedDeliveryDate ? getDateString(item.estimatedDeliveryDate) : undefined
        };
      });
  }, []);

  // Calculate performance metrics with trends
  const calculatePerformanceMetrics = useCallback((currentStats: DashboardStats): PerformanceMetric[] => {
    const getTrend = (current: number, previous: number): { trend: 'up' | 'down' | 'stable', trendValue: number } => {
      if (previous === 0) return { trend: 'stable', trendValue: 0 };
      const change = ((current - previous) / previous) * 100;
      if (Math.abs(change) < 1) return { trend: 'stable', trendValue: 0 };
      return {
        trend: change > 0 ? 'up' : 'down',
        trendValue: Math.abs(change)
      };
    };

    const deliveryTimeTrend = previousStats ?
      getTrend(currentStats.averageDeliveryTime, previousStats.averageDeliveryTime) :
      { trend: 'stable' as const, trendValue: 0 };

    const onTimeRateTrend = previousStats ?
      getTrend(currentStats.onTimeDeliveryRate, previousStats.onTimeDeliveryRate) :
      { trend: 'stable' as const, trendValue: 0 };

    const successRateTrend = previousStats && currentStats.total > 0 ?
      getTrend(
        (currentStats.delivered / currentStats.total) * 100,
        (previousStats.delivered / previousStats.total) * 100
      ) : { trend: 'stable' as const, trendValue: 0 };

    return [
      {
        label: 'Avg. Delivery Time',
        value: Math.round(currentStats.averageDeliveryTime * 10) / 10,
        unit: ' days',
        ...deliveryTimeTrend
      },
      {
        label: 'On-Time Rate',
        value: Math.round(currentStats.onTimeDeliveryRate * 10) / 10,
        unit: '%',
        ...onTimeRateTrend
      },
      {
        label: 'Success Rate',
        value: currentStats.total > 0 ? Math.round((currentStats.delivered / currentStats.total) * 1000) / 10 : 0,
        unit: '%',
        ...successRateTrend
      },
      {
        label: 'Active Shipments',
        value: currentStats.inTransit,
        unit: '',
        trend: 'stable',
        trendValue: 0
      }
    ];
  }, [previousStats]);

  const fetchAllTrackingItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await trackingService.getAllTrackingItems();
      setTrackingItems(items);
    } catch (err) {
      console.error('Error fetching tracking items:', err);
      setError('Failed to fetch tracking data. Please try again later.');
      setTrackingItems([]);
    } finally {
      setLoading(false);
    }
  }, [trackingService]);

  const refetch = useCallback(() => {
    fetchAllTrackingItems();
  }, [fetchAllTrackingItems]);

  useEffect(() => {
    if (enableRealTime) {
      // Set up real-time subscription
      setLoading(true);
      setError(null);

      const unsubscribe = trackingService.subscribeToAllTrackingItems(
        (items) => {
          setTrackingItems(items);
          setLoading(false);
          setError(null);
        }
      );

      return () => {
        unsubscribe();
      };
    } else {
      // Fetch once without real-time updates
      fetchAllTrackingItems();
    }
  }, [enableRealTime, trackingService, fetchAllTrackingItems]);

  // Update previous stats when current stats change (for trend calculation)
  useEffect(() => {
    if (trackingItems.length > 0) {
      const currentStats = calculateStats(trackingItems);
      // Store previous stats after a delay to allow for trend calculation
      const timer = setTimeout(() => {
        setPreviousStats(currentStats);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [trackingItems, calculateStats]);

  // Calculate derived data
  const trackingStats = calculateStats(trackingItems);
  const statusDistribution = calculateStatusDistribution(trackingItems);
  const recentTrackings = getRecentTrackings(trackingItems);
  const performanceMetrics = calculatePerformanceMetrics(trackingStats);

  return {
    trackingStats,
    statusDistribution,
    recentTrackings,
    performanceMetrics,
    loading,
    error,
    refetch
  };
};