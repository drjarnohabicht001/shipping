import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  FirestoreTrackingItem,
  PublicTrackingItem,
  TrackingStatusUpdate,
  TrackingStatus,
  FIRESTORE_COLLECTIONS
} from '@/lib/firestore-schema';

export interface CreateTrackingItemRequest {
  itemName: string;
  itemDescription?: string;
  itemValue?: number;
  cost?: number;
  vat?: number;
  tax?: number;
  itemCategory?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  sender: {
    name: string;
    email: string;
    phone?: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    companyName?: string;
  };
  recipient: {
    name: string;
    email: string;
    phone?: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    companyName?: string;
  };
  serviceType: 'standard' | 'express' | 'overnight' | 'international' | 'same_day';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deliveryInstructions?: string;
  signatureRequired?: boolean;
  isFragile?: boolean;
  requiresSignature?: boolean;
  insuranceAmount?: number;
  specialInstructions?: string;
  notificationPreferences?: {
    sms: boolean;
    email: boolean;
    push: boolean;
  };
  tags?: string[];
  notes?: string;
}

export interface UpdateTrackingStatusRequest {
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
  isPublic?: boolean;
  notes?: string;
  updatedBy: string;
  estimatedDeliveryDate?: Date;
}

export interface TrackingSearchFilters {
  status?: TrackingStatus[];
  priority?: string[];
  serviceType?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  createdBy?: string;
}

class FirestoreTrackingService {
  private static instance: FirestoreTrackingService;
  private trackingCounterDoc = 'tracking_counter';

  private constructor() { }

  public static getInstance(): FirestoreTrackingService {
    if (!FirestoreTrackingService.instance) {
      FirestoreTrackingService.instance = new FirestoreTrackingService();
    }
    return FirestoreTrackingService.instance;
  }

  private mapPublicTrackingItem(trackingItem: FirestoreTrackingItem): Omit<PublicTrackingItem, 'id'> {
    return {
      trackingId: trackingItem.trackingId,
      itemName: trackingItem.itemName,
      status: trackingItem.status,
      estimatedDeliveryDate: trackingItem.estimatedDeliveryDate,
      actualDeliveryDate: trackingItem.actualDeliveryDate,
      currentLocation: trackingItem.currentLocation
        ? {
            city: trackingItem.currentLocation.city,
            state: trackingItem.currentLocation.state,
            country: trackingItem.currentLocation.country,
            facility: trackingItem.currentLocation.facility,
          }
        : undefined,
      statusHistory: (trackingItem.statusHistory || [])
        .filter((entry) => entry.isPublic)
        .map((entry) => ({
          id: entry.id,
          status: entry.status,
          timestamp: entry.timestamp,
          description: entry.description,
          isPublic: entry.isPublic,
          location: entry.location
            ? {
                city: entry.location.city,
                state: entry.location.state,
                country: entry.location.country,
                facility: entry.location.facility,
              }
            : undefined,
        })),
      updatedAt: trackingItem.updatedAt,
    };
  }

  /**
   * Generate a unique tracking ID with format: SH-YYYY-XXXXXX
   * Uses Firestore counter for uniqueness
   */
  private async generateTrackingId(): Promise<string> {
    const year = new Date().getFullYear();
    const counterRef = doc(db, 'system_counters', this.trackingCounterDoc);

    try {
      // Get current counter value
      const counterDoc = await getDoc(counterRef);
      let nextNumber = 1;

      if (counterDoc.exists()) {
        nextNumber = (counterDoc.data().value || 0) + 1;
      }

      // Update counter atomically
      await updateDoc(counterRef, {
        value: increment(1),
        lastUpdated: Timestamp.now()
      });

      // Format: SH-2024-000001
      const paddedNumber = nextNumber.toString().padStart(6, '0');
      return `SH-${year}-${paddedNumber}`;
    } catch (error) {
      // Fallback to timestamp-based ID if counter fails
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `SH-${year}-${timestamp}${random}`;
    }
  }

  /**
   * Calculate estimated delivery date based on service type
   */
  private calculateEstimatedDelivery(serviceType: string): Timestamp {
    const now = new Date();
    let daysToAdd = 0;

    switch (serviceType) {
      case 'same_day':
        daysToAdd = 0;
        break;
      case 'overnight':
        daysToAdd = 1;
        break;
      case 'express':
        daysToAdd = 2;
        break;
      case 'standard':
        daysToAdd = 5;
        break;
      case 'international':
        daysToAdd = 10;
        break;
      default:
        daysToAdd = 5;
    }

    const deliveryDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    return Timestamp.fromDate(deliveryDate);
  }

  /**
   * Calculate shipping cost based on item details and service type
   */
  private calculateShippingCost(request: CreateTrackingItemRequest): number {
    let baseCost = 10; // Base cost in USD

    // Weight-based pricing
    if (request.weight) {
      baseCost += request.weight * 2;
    }

    // Dimension-based pricing
    if (request.dimensions) {
      const volume = request.dimensions.length * request.dimensions.width * request.dimensions.height;
      baseCost += volume * 0.01;
    }

    // Service type multiplier
    const serviceMultipliers = {
      standard: 1,
      express: 1.5,
      overnight: 2.5,
      international: 3,
      same_day: 4
    };

    baseCost *= serviceMultipliers[request.serviceType] || 1;

    // Priority multiplier
    const priorityMultipliers = {
      low: 1,
      medium: 1.1,
      high: 1.25,
      urgent: 1.5
    };

    baseCost *= priorityMultipliers[request.priority] || 1;

    // Insurance cost
    if (request.insuranceAmount) {
      baseCost += request.insuranceAmount * 0.01; // 1% of insured value
    }

    return Math.round(baseCost * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Create a new tracking item
   */
  async createTrackingItem(request: CreateTrackingItemRequest, createdBy: string): Promise<FirestoreTrackingItem> {
    try {
      const response = await fetch('/api/admin/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ ...request, createdBy })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tracking item');
      }

      return data.item as FirestoreTrackingItem;
    } catch (error) {
      console.error('Error creating tracking item:', error);
      throw new Error('Failed to create tracking item');
    }
  }

  /**
   * Get tracking item by tracking ID
   */
  async getTrackingByTrackingId(trackingId: string): Promise<FirestoreTrackingItem | null> {
    try {
      const response = await fetch(`/api/admin/tracking/${encodeURIComponent(trackingId)}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve tracking information');
      }

      return data.item as FirestoreTrackingItem;
    } catch (error) {
      console.error('Error getting tracking item:', error);
      throw new Error('Failed to retrieve tracking information');
    }
  }

  async getPublicTrackingByTrackingId(trackingId: string): Promise<PublicTrackingItem | null> {
    try {
      const q = query(
        collection(db, FIRESTORE_COLLECTIONS.PUBLIC_TRACKING_ITEMS),
        where('trackingId', '==', trackingId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const itemDoc = querySnapshot.docs[0];
      return {
        id: itemDoc.id,
        ...itemDoc.data()
      } as PublicTrackingItem;
    } catch (error) {
      console.error('Error getting public tracking item:', error);
      throw new Error('Failed to retrieve tracking information');
    }
  }

  /**
   * Helper function to remove undefined values from an object
   */
  private removeUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedValues(item));
    }

    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
          cleaned[key] = this.removeUndefinedValues(obj[key]);
        }
      }
      return cleaned;
    }

    return obj;
  }

  private async writePublicTrackingProjection(trackingItem: FirestoreTrackingItem): Promise<void> {
    const publicDocRef = doc(db, FIRESTORE_COLLECTIONS.PUBLIC_TRACKING_ITEMS, trackingItem.id);
    await setDoc(
      publicDocRef,
      this.removeUndefinedValues(this.mapPublicTrackingItem(trackingItem))
    );
  }

  /**
   * Update tracking status
   */
  async updateTrackingStatus(request: UpdateTrackingStatusRequest): Promise<void> {
    try {
      const response = await fetch(`/api/admin/tracking/${encodeURIComponent(request.trackingId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(request)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update tracking status');
      }
    } catch (error: any) {
      console.error('Error updating tracking status:', error);
      // Provide more detailed error message
      const errorMessage = error?.message || 'Unknown error occurred';
      throw new Error(`Failed to update tracking status: ${errorMessage}`);
    }
  }

  /**
   * Search tracking items with filters
   */
  async searchTrackingItems(filters: TrackingSearchFilters): Promise<FirestoreTrackingItem[]> {
    try {
      const params = new URLSearchParams();
      if (filters.searchQuery) {
        params.set('searchQuery', filters.searchQuery);
      }
      if (filters.status && filters.status.length > 0) {
        params.set('status', filters.status.join(','));
      }

      const response = await fetch(`/api/admin/tracking?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search tracking items');
      }

      let items = data.items as FirestoreTrackingItem[];

      if (filters.priority && filters.priority.length > 0) {
        items = items.filter(item => filters.priority!.includes(item.priority));
      }

      if (filters.serviceType && filters.serviceType.length > 0) {
        items = items.filter(item => filters.serviceType!.includes(item.serviceType));
      }

      return items;
    } catch (error) {
      console.error('Error searching tracking items:', error);
      throw new Error('Failed to search tracking items');
    }
  }

  /**
   * Subscribe to real-time updates for a tracking item
   */
  subscribeToTrackingUpdates(
    trackingId: string,
    callback: (trackingItem: FirestoreTrackingItem | null) => void
  ): () => void {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.TRACKING_ITEMS),
      where('trackingId', '==', trackingId),
      limit(1)
    );

    return onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        callback(null);
        return;
      }

      const doc = querySnapshot.docs[0];
      const trackingItem = {
        id: doc.id,
        ...doc.data()
      } as FirestoreTrackingItem;

      callback(trackingItem);
    }, (error) => {
      console.error('Error in tracking subscription:', error);
      callback(null);
    });
  }

  subscribeToPublicTrackingUpdates(
    trackingId: string,
    callback: (trackingItem: PublicTrackingItem | null) => void
  ): () => void {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.PUBLIC_TRACKING_ITEMS),
      where('trackingId', '==', trackingId),
      limit(1)
    );

    return onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        callback(null);
        return;
      }

      const itemDoc = querySnapshot.docs[0];
      callback({
        id: itemDoc.id,
        ...itemDoc.data()
      } as PublicTrackingItem);
    }, (error) => {
      console.error('Error in public tracking subscription:', error);
      callback(null);
    });
  }

  /**
   * Get all tracking items (for initial load)
   */
  async getAllTrackingItems(): Promise<FirestoreTrackingItem[]> {
    try {
      const response = await fetch('/api/admin/tracking', {
        credentials: 'include'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tracking items');
      }

      return data.items as FirestoreTrackingItem[];
    } catch (error) {
      console.error('Error fetching all tracking items:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates for all tracking items (for dashboard statistics)
   */
  subscribeToAllTrackingItems(
    callback: (trackingItems: FirestoreTrackingItem[]) => void
  ): () => void {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.TRACKING_ITEMS),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const trackingItems: FirestoreTrackingItem[] = [];

      querySnapshot.forEach((doc) => {
        trackingItems.push({
          id: doc.id,
          ...doc.data()
        } as FirestoreTrackingItem);
      });

      callback(trackingItems);
    }, (error) => {
      console.error('Error in all tracking items subscription:', error);
      callback([]);
    });
  }

  /**
   * Delete a tracking item (admin only)
   */
  async deleteTrackingItem(trackingId: string): Promise<void> {
    try {
      const response = await fetch(`/api/admin/tracking/${encodeURIComponent(trackingId)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Tracking item not found (id: ${trackingId})`);
      }
    } catch (error: any) {
      console.error('Error deleting tracking item:', error);
      // Preserve the original error message instead of swallowing it
      throw new Error(error?.message ?? 'Failed to delete tracking item');
    }
  }

  private async deletePublicTrackingProjection(trackingId?: string, trackingDocId?: string): Promise<void> {
    if (trackingDocId) {
      await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.PUBLIC_TRACKING_ITEMS, trackingDocId)).catch(() => undefined);
    }

    if (trackingId) {
      const q = query(
        collection(db, FIRESTORE_COLLECTIONS.PUBLIC_TRACKING_ITEMS),
        where('trackingId', '==', trackingId),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      await Promise.all(querySnapshot.docs.map((projection) => deleteDoc(projection.ref)));
    }
  }
}

export default FirestoreTrackingService;
