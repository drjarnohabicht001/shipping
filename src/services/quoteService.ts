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
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  FirestoreQuote,
  FIRESTORE_COLLECTIONS
} from '@/lib/firestore-schema';

export interface CreateQuoteRequest {
  customer: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  origin: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  destination: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: {
    description: string;
    quantity: number;
    weight: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    value?: number;
    category?: string;
  }[];
  serviceType: 'standard' | 'express' | 'overnight' | 'international' | 'same_day';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export interface UpdateQuoteRequest {
  quoteId: string;
  status?: 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired';
  estimatedCost?: number;
  validUntil?: Date;
  notes?: string;
  adminNotes?: string;
  updatedBy: string;
}

export interface QuoteSearchFilters {
  status?: string[];
  serviceType?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  createdBy?: string;
}

class QuoteService {
  private static instance: QuoteService;
  private quoteCounterDoc = 'quote_counter';

  private constructor() { }

  public static getInstance(): QuoteService {
    if (!QuoteService.instance) {
      QuoteService.instance = new QuoteService();
    }
    return QuoteService.instance;
  }

  /**
   * Generate a unique quote number with format: QT-YYYY-XXXXXX
   */
  private async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const counterRef = doc(db, 'system_counters', this.quoteCounterDoc);

    try {
      const counterDoc = await getDoc(counterRef);
      let nextNumber = 1;

      if (counterDoc.exists()) {
        nextNumber = (counterDoc.data().value || 0) + 1;
      }

      await updateDoc(counterRef, {
        value: increment(1),
        lastUpdated: Timestamp.now()
      });

      const paddedNumber = nextNumber.toString().padStart(6, '0');
      return `QT-${year}-${paddedNumber}`;
    } catch (error) {
      // Fallback to timestamp-based ID if counter fails
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `QT-${year}-${timestamp}${random}`;
    }
  }

  /**
   * Calculate estimated cost based on quote details
   */
  private calculateEstimatedCost(request: CreateQuoteRequest): number {
    let baseCost = 10; // Base cost in USD

    // Weight-based pricing
    const totalWeight = request.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    baseCost += totalWeight * 2;

    // Dimension-based pricing
    const totalVolume = request.items.reduce((sum, item) => {
      if (item.dimensions) {
        const volume = item.dimensions.length * item.dimensions.width * item.dimensions.height * item.quantity;
        return sum + volume;
      }
      return sum;
    }, 0);
    baseCost += totalVolume * 0.01;

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

    // International shipping multiplier
    if (request.origin.country !== request.destination.country) {
      baseCost *= 1.5;
    }

    return Math.round(baseCost * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate valid until date (default 30 days from now)
   */
  private calculateValidUntil(): Timestamp {
    const now = new Date();
    const validUntil = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
    return Timestamp.fromDate(validUntil);
  }

  /**
   * Create a new quote
   */
  async createQuote(request: CreateQuoteRequest, createdBy?: string): Promise<FirestoreQuote> {
    try {
      const quoteNumber = await this.generateQuoteNumber();
      const now = Timestamp.now();
      const estimatedCost = this.calculateEstimatedCost(request);
      const validUntil = this.calculateValidUntil();

      const quoteData: Omit<FirestoreQuote, 'id'> = {
        quoteNumber,
        customer: request.customer,
        origin: request.origin,
        destination: request.destination,
        items: request.items,
        serviceType: request.serviceType,
        priority: request.priority,
        status: 'pending',
        estimatedCost,
        currency: 'USD',
        validUntil,
        notes: request.notes,
        createdAt: now,
        updatedAt: now,
        createdBy: createdBy || 'guest',
        lastUpdatedBy: createdBy || 'system'
      };

      const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.QUOTES), quoteData);

      return {
        id: docRef.id,
        ...quoteData
      };
    } catch (error) {
      console.error('Error creating quote:', error);
      throw new Error('Failed to create quote');
    }
  }

  /**
   * Get quote by ID
   */
  async getQuoteById(quoteId: string): Promise<FirestoreQuote | null> {
    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.QUOTES, quoteId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as FirestoreQuote;
    } catch (error) {
      console.error('Error getting quote:', error);
      throw new Error('Failed to retrieve quote');
    }
  }

  /**
   * Get quote by quote number
   */
  async getQuoteByQuoteNumber(quoteNumber: string): Promise<FirestoreQuote | null> {
    try {
      const q = query(
        collection(db, FIRESTORE_COLLECTIONS.QUOTES),
        where('quoteNumber', '==', quoteNumber),
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
      } as FirestoreQuote;
    } catch (error) {
      console.error('Error getting quote:', error);
      throw new Error('Failed to retrieve quote');
    }
  }

  /**
   * Update quote
   */
  async updateQuote(request: UpdateQuoteRequest): Promise<void> {
    try {
      const updateData: any = {
        updatedAt: Timestamp.now(),
        lastUpdatedBy: request.updatedBy
      };

      if (request.status !== undefined) {
        updateData.status = request.status;

        if (request.status === 'sent') {
          updateData.sentAt = Timestamp.now();
        }

        if (request.status === 'accepted' || request.status === 'rejected') {
          updateData.respondedAt = Timestamp.now();
        }
      }

      if (request.estimatedCost !== undefined) {
        updateData.estimatedCost = request.estimatedCost;
      }

      if (request.validUntil) {
        updateData.validUntil = Timestamp.fromDate(request.validUntil);
      }

      if (request.notes !== undefined) {
        updateData.notes = request.notes;
      }

      if (request.adminNotes !== undefined) {
        updateData.adminNotes = request.adminNotes;
      }

      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      const docRef = doc(db, FIRESTORE_COLLECTIONS.QUOTES, request.quoteId);
      await updateDoc(docRef, cleanedData);
    } catch (error) {
      console.error('Error updating quote:', error);
      throw new Error('Failed to update quote');
    }
  }

  /**
   * Delete quote
   */
  async deleteQuote(quoteId: string): Promise<void> {
    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.QUOTES, quoteId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting quote:', error);
      throw new Error('Failed to delete quote');
    }
  }

  /**
   * Search quotes with filters
   */
  async searchQuotes(filters: QuoteSearchFilters): Promise<FirestoreQuote[]> {
    try {
      let q = query(collection(db, FIRESTORE_COLLECTIONS.QUOTES));

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
      const quotes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreQuote[];

      // Apply client-side filters
      let filteredQuotes = quotes;

      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        filteredQuotes = filteredQuotes.filter(quote =>
          quote.quoteNumber.toLowerCase().includes(searchLower) ||
          quote.customer.name.toLowerCase().includes(searchLower) ||
          quote.customer.email.toLowerCase().includes(searchLower) ||
          quote.customer.company?.toLowerCase().includes(searchLower)
        );
      }

      if (filters.serviceType && filters.serviceType.length > 0) {
        filteredQuotes = filteredQuotes.filter(quote =>
          filters.serviceType!.includes(quote.serviceType)
        );
      }

      return filteredQuotes;
    } catch (error) {
      console.error('Error searching quotes:', error);
      throw new Error('Failed to search quotes');
    }
  }

  /**
   * Get all quotes
   */
  async getAllQuotes(): Promise<FirestoreQuote[]> {
    try {
      const q = query(
        collection(db, FIRESTORE_COLLECTIONS.QUOTES),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const quotes: FirestoreQuote[] = [];

      querySnapshot.forEach((doc) => {
        quotes.push({
          id: doc.id,
          ...doc.data()
        } as FirestoreQuote);
      });

      return quotes;
    } catch (error) {
      console.error('Error fetching all quotes:', error);
      throw error;
    }
  }
}

export default QuoteService;
