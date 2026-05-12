// Re-export TrackingStatus from firestore-schema to avoid conflicts
import { TrackingStatus } from '../lib/firestore-schema';
export { TrackingStatus };

export interface TrackingNumber {
  id: string;
  trackingNumber: string;
  itemName: string;
  itemDescription?: string;
  sender: {
    name: string;
    email: string;
    phone?: string;
    address: string;
  };
  recipient: {
    name: string;
    address: string;
  };
  status: TrackingStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  serviceType: 'standard' | 'express' | 'overnight' | 'international';
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  estimatedDelivery: string;
  actualDelivery?: string;
  cost: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  history: TrackingHistory[];
  notes?: string;
}

export interface TrackingHistory {
  id: string;
  status: TrackingStatus;
  location: string;
  timestamp: string;
  description: string;
  updatedBy: string;
  notes?: string;
}

export interface TrackingFilters {
  status?: TrackingStatus[];
  priority?: string[];
  serviceType?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
}

export interface TrackingStats {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  failed: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
}

export interface GenerateTrackingRequest {
  itemName: string;
  itemDescription?: string;
  sender: {
    name: string;
    email: string;
    phone?: string;
    address: string;
  };
  recipient: {
    name: string;
    address: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  serviceType: 'standard' | 'express' | 'overnight' | 'international';
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  notes?: string;
}

export interface AuditLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'status_change';
  trackingNumber: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
  oldValue?: any;
  newValue?: any;
}

export const TRACKING_STATUS_LABELS: Record<TrackingStatus, string> = {
  pending: 'Pending Pickup',
  label_created: 'Label Created',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  failed_delivery: 'Failed Delivery',
  returned_to_sender: 'Returned to Sender',
  cancelled: 'Cancelled',
  exception: 'Exception',
  customs_clearance: 'Customs Clearance',
  delayed: 'Delayed'
};

export const TRACKING_STATUS_COLORS: Record<TrackingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  label_created: 'bg-indigo-100 text-indigo-800',
  picked_up: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  failed_delivery: 'bg-red-100 text-red-800',
  returned_to_sender: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  exception: 'bg-amber-100 text-amber-800',
  customs_clearance: 'bg-teal-100 text-teal-800',
  delayed: 'bg-pink-100 text-pink-800'
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  standard: 'Standard Delivery',
  express: 'Express Delivery',
  overnight: 'Overnight Delivery',
  international: 'International Shipping'
};
