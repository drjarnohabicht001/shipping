import { 
  collection, 
  doc, 
  addDoc, 
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
  TrackingStatusUpdate, 
  TrackingStatus, 
  FIRESTORE_COLLECTIONS 
} from '@/lib/firestore-schema';

export interface CreateTrackingItemRequest {
  itemName: string;
  itemDescription?: string;
  itemValue?: number;
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

  private constructor() {}

  public static getInstance(): FirestoreTrackingService {
    if (!FirestoreTrackingService.instance) {
      FirestoreTrackingService.instance = new FirestoreTrackingService();
    }
    return FirestoreTrackingService.instance;
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
      const trackingId = await this.generateTrackingId();
      const now = Timestamp.now();
      const estimatedDelivery = this.calculateEstimatedDelivery(request.serviceType);
      const cost = this.calculateShippingCost(request);

      const initialStatusUpdate: TrackingStatusUpdate = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: TrackingStatus.PENDING,
        timestamp: now,
        description: 'Tracking number generated and shipment created',
        updatedBy: createdBy,
        isPublic: true
      };

      const trackingItemData: Omit<FirestoreTrackingItem, 'id'> = {
        trackingId,
        itemName: request.itemName,
        itemDescription: request.itemDescription,
        itemValue: request.itemValue,
        itemCategory: request.itemCategory,
        weight: request.weight,
        dimensions: request.dimensions,
        sender: request.sender,
        recipient: request.recipient,
        serviceType: request.serviceType,
        priority: request.priority,
        status: TrackingStatus.PENDING,
        estimatedDeliveryDate: estimatedDelivery,
        deliveryInstructions: request.deliveryInstructions,
        signatureRequired: request.signatureRequired || false,
        cost,
        currency: 'USD',
        paymentStatus: 'pending',
        createdAt: now,
        updatedAt: now,
        createdBy,
        lastUpdatedBy: createdBy,
        isFragile: request.isFragile || false,
        requiresSignature: request.requiresSignature || false,
        insuranceAmount: request.insuranceAmount,
        specialInstructions: request.specialInstructions,
        statusHistory: [initialStatusUpdate],
        notificationPreferences: request.notificationPreferences || {
          sms: true,
          email: true,
          push: true
        },
        tags: request.tags,
        notes: request.notes
      };

      // Filter out undefined values to prevent Firestore errors
      const trackingItem = Object.fromEntries(
        Object.entries(trackingItemData).filter(([_, value]) => value !== undefined)
      ) as Omit<FirestoreTrackingItem, 'id'>;

      const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.TRACKING_ITEMS), trackingItem);
      
      return {
        id: docRef.id,
        ...trackingItem
      };
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
      const q = query(
        collection(db, FIRESTORE_COLLECTIONS.TRACKING_ITEMS),
        where('trackingId', '==', trackingId),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as FirestoreTrackingItem;
    } catch (error) {
      console.error('Error getting tracking item:', error);
      throw new Error('Failed to retrieve tracking information');
    }
  }

  /**
   * Update tracking status
   */
  async updateTrackingStatus(request: UpdateTrackingStatusRequest): Promise<void> {
    try {
      const trackingItem = await this.getTrackingByTrackingId(request.trackingId);
      
      if (!trackingItem) {
        throw new Error('Tracking item not found');
      }

      const now = Timestamp.now();
      const statusUpdate: TrackingStatusUpdate = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: request.status,
        timestamp: now,
        location: request.location,
        description: request.description,
        updatedBy: request.updatedBy,
        isPublic: request.isPublic !== false, // Default to true
        notes: request.notes
      };

      const updateData: Partial<FirestoreTrackingItem> = {
        status: request.status,
        updatedAt: now,
        lastUpdatedBy: request.updatedBy,
        statusHistory: [...trackingItem.statusHistory, statusUpdate]
      };

      // Update current location if provided
      if (request.location) {
        updateData.currentLocation = request.location;
      }

      // Set delivery timestamp if delivered
      if (request.status === TrackingStatus.DELIVERED) {
        updateData.deliveredAt = now;
        updateData.actualDeliveryDate = now;
      }

      // Set pickup timestamp if picked up
      if (request.status === TrackingStatus.PICKED_UP) {
        updateData.pickedUpAt = now;
      }

      const docRef = doc(db, FIRESTORE_COLLECTIONS.TRACKING_ITEMS, trackingItem.id);
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating tracking status:', error);
      throw new Error('Failed to update tracking status');
    }
  }

  /**
   * Search tracking items with filters
   */
  async searchTrackingItems(filters: TrackingSearchFilters): Promise<FirestoreTrackingItem[]> {
    try {
      let q = query(collection(db, FIRESTORE_COLLECTIONS.TRACKING_ITEMS));

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        q = query(q, where('status', 'in', filters.status));
      }

      if (filters.createdBy) {
        q = query(q, where('createdBy', '==', filters.createdBy));
      }

      if (filters.dateRange) {
        q = query(
          q,
          where('createdAt', '>=', Timestamp.fromDate(filters.dateRange.start)),
          where('createdAt', '<=', Timestamp.fromDate(filters.dateRange.end))
        );
      }

      // Order by creation date (newest first)
      q = query(q, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreTrackingItem[];

      // Apply client-side filters for complex queries
      let filteredItems = items;

      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        filteredItems = filteredItems.filter(item => 
          item.trackingId.toLowerCase().includes(searchLower) ||
          item.itemName.toLowerCase().includes(searchLower) ||
          item.sender.name.toLowerCase().includes(searchLower) ||
          item.recipient.name.toLowerCase().includes(searchLower)
        );
      }

      if (filters.priority && filters.priority.length > 0) {
        filteredItems = filteredItems.filter(item => 
          filters.priority!.includes(item.priority)
        );
      }

      if (filters.serviceType && filters.serviceType.length > 0) {
        filteredItems = filteredItems.filter(item => 
          filters.serviceType!.includes(item.serviceType)
        );
      }

      return filteredItems;
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

  /**
   * Get all tracking items (for initial load)
   */
  async getAllTrackingItems(): Promise<FirestoreTrackingItem[]> {
    try {
      const q = query(
        collection(db, FIRESTORE_COLLECTIONS.TRACKING_ITEMS),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const trackingItems: FirestoreTrackingItem[] = [];
      
      querySnapshot.forEach((doc) => {
        trackingItems.push({
          id: doc.id,
          ...doc.data()
        } as FirestoreTrackingItem);
      });

      return trackingItems;
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
      const trackingItem = await this.getTrackingByTrackingId(trackingId);
      
      if (!trackingItem) {
        throw new Error('Tracking item not found');
      }

      const docRef = doc(db, FIRESTORE_COLLECTIONS.TRACKING_ITEMS, trackingItem.id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting tracking item:', error);
      throw new Error('Failed to delete tracking item');
    }
  }
}

export default FirestoreTrackingService;