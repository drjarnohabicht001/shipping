import { useState, useEffect, useCallback } from 'react';
import FirestoreTrackingService from '@/services/firestoreTrackingService';
import { PublicTrackingItem } from '@/lib/firestore-schema';

export interface UseTrackingUpdatesResult {
  trackingItem: PublicTrackingItem | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook for real-time tracking updates
 * @param trackingId - The tracking ID to monitor
 * @param enableRealTime - Whether to enable real-time updates (default: true)
 */
export const useTrackingUpdates = (
  trackingId: string | null,
  enableRealTime: boolean = true
): UseTrackingUpdatesResult => {
  const [trackingItem, setTrackingItem] = useState<PublicTrackingItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const trackingService = FirestoreTrackingService.getInstance();

  const fetchTrackingItem = useCallback(async () => {
    if (!trackingId) {
      setTrackingItem(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const item = await trackingService.getPublicTrackingByTrackingId(trackingId);
      setTrackingItem(item);
      
      if (!item) {
        setError('Tracking number not found. Please check your tracking ID and try again.');
      }
    } catch (err) {
      console.error('Error fetching tracking item:', err);
      setError('Failed to fetch tracking information. Please try again later.');
      setTrackingItem(null);
    } finally {
      setLoading(false);
    }
  }, [trackingId, trackingService]);

  const refetch = useCallback(() => {
    fetchTrackingItem();
  }, [fetchTrackingItem]);

  useEffect(() => {
    if (!trackingId) {
      setTrackingItem(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (enableRealTime) {
      setLoading(true);
      setError(null);

      const unsubscribe = trackingService.subscribeToPublicTrackingUpdates(
        trackingId,
        (item) => {
          setTrackingItem(item);
          setLoading(false);
          
          if (!item) {
            setError('Tracking number not found. Please check your tracking ID and try again.');
          } else {
            setError(null);
          }
        }
      );
      return () => {
        unsubscribe();
      };
    } else {
      fetchTrackingItem();
    }
  }, [trackingId, enableRealTime, trackingService, fetchTrackingItem]);

  return {
    trackingItem,
    loading,
    error,
    refetch
  };
};

export default useTrackingUpdates;
