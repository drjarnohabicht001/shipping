import { TrackingNumber, GenerateTrackingRequest, TrackingHistory, AuditLog } from '@/types/tracking';
import { TrackingStatus } from '@/lib/firestore-schema';

class TrackingService {
  private static instance: TrackingService;
  private trackingNumbers: Map<string, TrackingNumber> = new Map();
  private auditLogs: AuditLog[] = [];

  private constructor() {
    // Initialize with some mock data
    this.initializeMockData();
  }

  public static getInstance(): TrackingService {
    if (!TrackingService.instance) {
      TrackingService.instance = new TrackingService();
    }
    return TrackingService.instance;
  }

  /**
   * Generate a unique tracking number
   * Format: SH-YYYY-XXXXXX (SH = Shipping, YYYY = Year, XXXXXX = Sequential number)
   */
  private generateTrackingNumber(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SH-${year}-${timestamp}${random}`;
  }

  /**
   * Generate a unique ID for internal use
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate estimated delivery date based on service type
   */
  private calculateEstimatedDelivery(serviceType: string): string {
    const now = new Date();
    let daysToAdd = 0;

    switch (serviceType) {
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
    return deliveryDate.toISOString();
  }

  /**
   * Calculate shipping cost based on weight, dimensions, and service type
   */
  private calculateCost(request: GenerateTrackingRequest): number {
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
      international: 3
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

    return Math.round(baseCost * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Create audit log entry
   */
  private createAuditLog(
    action: AuditLog['action'],
    trackingNumber: string,
    userId: string,
    userName: string,
    details: string,
    oldValue?: any,
    newValue?: any
  ): void {
    const auditLog: AuditLog = {
      id: this.generateId(),
      action,
      trackingNumber,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      details,
      oldValue,
      newValue
    };

    this.auditLogs.unshift(auditLog);
    
    // Keep only last 1000 audit logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(0, 1000);
    }
  }

  /**
   * Generate a new tracking number
   */
  public async generateTracking(
    request: GenerateTrackingRequest,
    userId: string,
    userName: string
  ): Promise<TrackingNumber> {
    const trackingNumber = this.generateTrackingNumber();
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const tracking: TrackingNumber = {
      id,
      trackingNumber,
      itemName: request.itemName,
      itemDescription: request.itemDescription,
      sender: request.sender,
      recipient: request.recipient,
      status: 'pending',
      priority: request.priority,
      serviceType: request.serviceType,
      weight: request.weight,
      dimensions: request.dimensions,
      estimatedDelivery: this.calculateEstimatedDelivery(request.serviceType),
      cost: this.calculateCost(request),
      currency: 'USD',
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      history: [
        {
          id: this.generateId(),
          status: 'pending',
          location: 'Origin Facility',
          timestamp: now,
          description: 'Tracking number generated and shipment created',
          updatedBy: userId
        }
      ],
      notes: request.notes
    };

    this.trackingNumbers.set(trackingNumber, tracking);
    
    // Create audit log
    this.createAuditLog(
      'create',
      trackingNumber,
      userId,
      userName,
      `Created new tracking number for item: ${request.itemName}`,
      null,
      tracking
    );

    return tracking;
  }

  /**
   * Get tracking information by tracking number
   */
  public async getTracking(trackingNumber: string): Promise<TrackingNumber | null> {
    return this.trackingNumbers.get(trackingNumber) || null;
  }

  /**
   * Get tracking information by tracking number (alias for getTracking)
   */
  public async getTrackingById(trackingNumber: string): Promise<TrackingNumber | null> {
    return this.trackingNumbers.get(trackingNumber) || null;
  }

  /**
   * Get tracking history for a specific tracking number
   */
  public async getTrackingHistory(trackingNumber: string): Promise<TrackingHistory[]> {
    const tracking = this.trackingNumbers.get(trackingNumber);
    return tracking ? tracking.history : [];
  }

  /**
   * Get all tracking numbers with optional filtering
   */
  public async getAllTrackings(filters?: {
    status?: TrackingStatus[];
    priority?: string[];
    serviceType?: string[];
    searchQuery?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ trackings: TrackingNumber[]; total: number }> {
    let trackings = Array.from(this.trackingNumbers.values());

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      trackings = trackings.filter(t => filters.status!.includes(t.status));
    }

    if (filters?.priority && filters.priority.length > 0) {
      trackings = trackings.filter(t => filters.priority!.includes(t.priority));
    }

    if (filters?.serviceType && filters.serviceType.length > 0) {
      trackings = trackings.filter(t => filters.serviceType!.includes(t.serviceType));
    }

    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      trackings = trackings.filter(t => 
        t.trackingNumber.toLowerCase().includes(query) ||
        t.itemName.toLowerCase().includes(query) ||
        t.sender.name.toLowerCase().includes(query) ||
        t.recipient.name.toLowerCase().includes(query)
      );
    }

    // Sort by creation date (newest first)
    trackings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = trackings.length;
    
    // Apply pagination
    if (filters?.limit && filters?.offset !== undefined) {
      trackings = trackings.slice(filters.offset, filters.offset + filters.limit);
    }

    return { trackings, total };
  }

  /**
   * Update tracking status
   */
  public async updateTrackingStatus(
    trackingNumber: string,
    newStatus: TrackingStatus,
    location: string,
    description: string,
    userId: string,
    userName: string
  ): Promise<TrackingNumber | null> {
    const tracking = this.trackingNumbers.get(trackingNumber);
    if (!tracking) return null;

    const oldStatus = tracking.status;
    const now = new Date().toISOString();

    // Update tracking
    tracking.status = newStatus;
    tracking.updatedAt = now;

    // Add to history
    const historyEntry: TrackingHistory = {
      id: this.generateId(),
      status: newStatus,
      location,
      timestamp: now,
      description,
      updatedBy: userId
    };
    
    tracking.history.unshift(historyEntry);

    // Set actual delivery date if delivered
    if (newStatus === 'delivered') {
      tracking.actualDelivery = now;
    }

    this.trackingNumbers.set(trackingNumber, tracking);

    // Create audit log
    this.createAuditLog(
      'status_change',
      trackingNumber,
      userId,
      userName,
      `Status changed from ${oldStatus} to ${newStatus}`,
      { status: oldStatus },
      { status: newStatus }
    );

    return tracking;
  }

  /**
   * Get audit logs
   */
  public async getAuditLogs(limit = 50, offset = 0): Promise<{ logs: AuditLog[]; total: number }> {
    const total = this.auditLogs.length;
    const logs = this.auditLogs.slice(offset, offset + limit);
    return { logs, total };
  }

  /**
   * Get tracking statistics
   */
  public async getTrackingStats(): Promise<{
    total: number;
    pending: number;
    inTransit: number;
    delivered: number;
    failed: number;
    averageDeliveryTime: number;
    onTimeDeliveryRate: number;
  }> {
    const trackings = Array.from(this.trackingNumbers.values());
    
    const stats = {
      total: trackings.length,
      pending: trackings.filter(t => t.status === TrackingStatus.PENDING).length,
      inTransit: trackings.filter(t => [TrackingStatus.PICKED_UP, TrackingStatus.IN_TRANSIT, TrackingStatus.OUT_FOR_DELIVERY].includes(t.status)).length,
      delivered: trackings.filter(t => t.status === TrackingStatus.DELIVERED).length,
      failed: trackings.filter(t => [TrackingStatus.FAILED_DELIVERY, TrackingStatus.RETURNED_TO_SENDER, TrackingStatus.CANCELLED].includes(t.status)).length,
      averageDeliveryTime: 0,
      onTimeDeliveryRate: 0
    };

    // Calculate average delivery time and on-time rate
    const deliveredTrackings = trackings.filter(t => t.status === TrackingStatus.DELIVERED && t.actualDelivery);
    
    if (deliveredTrackings.length > 0) {
      const totalDeliveryTime = deliveredTrackings.reduce((sum, t) => {
        const created = new Date(t.createdAt).getTime();
        const delivered = new Date(t.actualDelivery!).getTime();
        return sum + (delivered - created);
      }, 0);
      
      stats.averageDeliveryTime = Math.round(totalDeliveryTime / deliveredTrackings.length / (1000 * 60 * 60 * 24)); // Days
      
      const onTimeDeliveries = deliveredTrackings.filter(t => {
        const estimated = new Date(t.estimatedDelivery).getTime();
        const actual = new Date(t.actualDelivery!).getTime();
        return actual <= estimated;
      }).length;
      
      stats.onTimeDeliveryRate = Math.round((onTimeDeliveries / deliveredTrackings.length) * 100);
    }

    return stats;
  }

  /**
   * Initialize mock data for demonstration
   */
  private initializeMockData(): void {
    // This would be removed in production and replaced with database calls
    const mockTrackings = [
      {
        itemName: 'Electronics Package',
        itemDescription: 'Laptop and accessories',
        sender: {
          name: 'Tech Store Inc',
          email: 'orders@techstore.com',
          phone: '+1-555-0123',
          address: '123 Business Ave, New York, NY 10001'
        },
        recipient: {
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '+1-555-0456',
          address: '456 Home St, Los Angeles, CA 90001'
        },
        priority: 'high' as const,
        serviceType: 'express' as const,
        weight: 5.2,
        dimensions: { length: 40, width: 30, height: 10 },
        notes: 'Handle with care - fragile electronics'
      },
      {
        itemName: 'Documents',
        itemDescription: 'Legal documents',
        sender: {
          name: 'Law Firm LLC',
          email: 'admin@lawfirm.com',
          address: '789 Legal Blvd, Chicago, IL 60601'
        },
        recipient: {
          name: 'Jane Doe',
          email: 'jane.doe@email.com',
          address: '321 Residential Dr, Miami, FL 33101'
        },
        priority: 'urgent' as const,
        serviceType: 'overnight' as const,
        weight: 0.5
      }
    ];

    // Generate mock tracking numbers
    mockTrackings.forEach(async (mock, index) => {
      const tracking = await this.generateTracking(mock, 'system', 'System');
      
      // Add some history for demonstration
      if (index === 0) {
        await this.updateTrackingStatus(
          tracking.trackingNumber,
          TrackingStatus.PICKED_UP,
          'Origin Facility - New York',
          'Package picked up from sender',
          'system',
          'System'
        );
        
        await this.updateTrackingStatus(
          tracking.trackingNumber,
          TrackingStatus.IN_TRANSIT,
          'Transit Hub - Chicago',
          'Package in transit to destination',
          'system',
          'System'
        );
      }
    });
  }
}

export const trackingService = TrackingService.getInstance();