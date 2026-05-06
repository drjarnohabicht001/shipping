import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import {
  FIRESTORE_COLLECTIONS,
  FirestoreTrackingItem,
  PublicTrackingItem,
  TrackingStatus,
  TrackingStatusUpdate,
} from "@/lib/firestore-schema";

function asTrackingTimestamp(value: Timestamp) {
  return value as unknown as FirestoreTrackingItem["createdAt"];
}

function asStatusTimestamp(value: Timestamp) {
  return value as unknown as TrackingStatusUpdate["timestamp"];
}

export interface AdminCreateTrackingRequest {
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
  serviceType: "standard" | "express" | "overnight" | "international" | "same_day";
  priority: "low" | "medium" | "high" | "urgent";
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

export interface AdminUpdateTrackingStatusRequest {
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
  estimatedDeliveryDate?: string | Date;
}

export interface AdminTrackingSearchFilters {
  status?: TrackingStatus[];
  searchQuery?: string;
}

function removeUndefinedValues<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefinedValues(item)) as T;
  }

  if (typeof obj === "object") {
    const cleaned: Record<string, unknown> = {};
    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    });
    return cleaned as T;
  }

  return obj;
}

function mapPublicTrackingItem(
  trackingItem: FirestoreTrackingItem
): Omit<PublicTrackingItem, "id"> {
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

async function writePublicTrackingProjection(trackingItem: FirestoreTrackingItem) {
  await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.PUBLIC_TRACKING_ITEMS)
    .doc(trackingItem.id)
    .set(removeUndefinedValues(mapPublicTrackingItem(trackingItem)));
}

async function deletePublicTrackingProjection(trackingDocId: string) {
  await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.PUBLIC_TRACKING_ITEMS)
    .doc(trackingDocId)
    .delete()
    .catch(() => undefined);
}

async function generateTrackingId() {
  const year = new Date().getFullYear();
  const counterRef = getFirebaseAdminDb()
    .collection("system_counters")
    .doc("tracking_counter");

  try {
    const counterDoc = await counterRef.get();
    let nextNumber = 1;

    if (counterDoc.exists) {
      nextNumber = ((counterDoc.data()?.value as number) || 0) + 1;
    }

    await counterRef.set(
      {
        value: nextNumber,
        lastUpdated: Timestamp.now(),
      },
      { merge: true }
    );

    return `SH-${year}-${nextNumber.toString().padStart(6, "0")}`;
  } catch {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `SH-${year}-${timestamp}${random}`;
  }
}

function calculateEstimatedDelivery(serviceType: string) {
  const now = new Date();
  const daysToAdd =
    serviceType === "same_day"
      ? 0
      : serviceType === "overnight"
        ? 1
        : serviceType === "express"
          ? 2
          : serviceType === "international"
            ? 10
            : 5;
  return Timestamp.fromDate(
    new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
  );
}

function calculateShippingCost(request: AdminCreateTrackingRequest) {
  let baseCost = 10;

  if (request.weight) {
    baseCost += request.weight * 2;
  }

  if (request.dimensions) {
    const volume =
      request.dimensions.length *
      request.dimensions.width *
      request.dimensions.height;
    baseCost += volume * 0.01;
  }

  const serviceMultiplier =
    {
      standard: 1,
      express: 1.5,
      overnight: 2.5,
      international: 3,
      same_day: 4,
    }[request.serviceType] ?? 1;
  const priorityMultiplier =
    {
      low: 1,
      medium: 1.1,
      high: 1.25,
      urgent: 1.5,
    }[request.priority] ?? 1;

  baseCost *= serviceMultiplier * priorityMultiplier;

  if (request.insuranceAmount) {
    baseCost += request.insuranceAmount * 0.01;
  }

  return Math.round(baseCost * 100) / 100;
}

export async function listTrackingItems(filters: AdminTrackingSearchFilters = {}) {
  const snapshot = await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.TRACKING_ITEMS)
    .orderBy("createdAt", "desc")
    .get();

  let items = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FirestoreTrackingItem[];

  if (filters.status && filters.status.length > 0) {
    items = items.filter((item) => filters.status?.includes(item.status));
  }

  if (filters.searchQuery) {
    const searchLower = filters.searchQuery.toLowerCase();
    items = items.filter((item) =>
      item.trackingId.toLowerCase().includes(searchLower) ||
      item.itemName.toLowerCase().includes(searchLower) ||
      item.sender.name.toLowerCase().includes(searchLower) ||
      item.recipient.name.toLowerCase().includes(searchLower)
    );
  }

  return items;
}

export async function getTrackingItemByTrackingId(trackingId: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.TRACKING_ITEMS)
    .where("trackingId", "==", trackingId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const itemDoc = snapshot.docs[0];
  return {
    id: itemDoc.id,
    ...itemDoc.data(),
  } as FirestoreTrackingItem;
}

export async function createTrackingItem(
  request: AdminCreateTrackingRequest,
  createdBy: string
) {
  const trackingId = await generateTrackingId();
  const now = Timestamp.now();
  const nowForTracking = asTrackingTimestamp(now);
  const estimatedDelivery = calculateEstimatedDelivery(request.serviceType);
  const cost = request.cost ?? calculateShippingCost(request);

  const initialStatusUpdate: TrackingStatusUpdate = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    status: TrackingStatus.PENDING,
    timestamp: asStatusTimestamp(now),
    description: "Tracking number generated and shipment created",
    updatedBy: createdBy,
    isPublic: true,
  };

  const trackingItem = removeUndefinedValues({
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
    estimatedDeliveryDate:
      estimatedDelivery as unknown as FirestoreTrackingItem["estimatedDeliveryDate"],
    deliveryInstructions: request.deliveryInstructions,
    signatureRequired: request.signatureRequired || false,
    cost,
    vat: request.vat,
    tax: request.tax,
    currency: "USD",
    paymentStatus: "pending",
    createdAt: nowForTracking,
    updatedAt: nowForTracking,
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
      push: true,
    },
    tags: request.tags,
    notes: request.notes,
  }) as Omit<FirestoreTrackingItem, "id">;

  const docRef = await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.TRACKING_ITEMS)
    .add(trackingItem);

  const createdItem = {
    id: docRef.id,
    ...trackingItem,
  } as FirestoreTrackingItem;

  await writePublicTrackingProjection(createdItem);
  return createdItem;
}

export async function updateTrackingStatus(request: AdminUpdateTrackingStatusRequest) {
  const trackingItem = await getTrackingItemByTrackingId(request.trackingId);

  if (!trackingItem) {
    throw new Error("Tracking item not found");
  }

  const now = Timestamp.now();
  const nowForTracking = asTrackingTimestamp(now);
  const statusUpdate = removeUndefinedValues({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    status: request.status,
    timestamp: asStatusTimestamp(now),
    description: request.description,
    updatedBy: request.updatedBy,
    isPublic: request.isPublic !== false,
    location: request.location,
    notes: request.notes,
  }) as TrackingStatusUpdate;

  const cleanedHistory = (trackingItem.statusHistory || []).map((entry) =>
    removeUndefinedValues(entry)
  );
  const updateData = removeUndefinedValues({
    status: request.status,
    updatedAt: nowForTracking,
    lastUpdatedBy: request.updatedBy,
    statusHistory: [...cleanedHistory, statusUpdate],
    currentLocation:
      request.location && request.location.city && request.location.country
        ? request.location
        : trackingItem.currentLocation,
    deliveredAt:
      request.status === TrackingStatus.DELIVERED ? nowForTracking : undefined,
    actualDeliveryDate:
      request.status === TrackingStatus.DELIVERED ? nowForTracking : undefined,
    pickedUpAt:
      request.status === TrackingStatus.PICKED_UP ? nowForTracking : undefined,
    estimatedDeliveryDate: request.estimatedDeliveryDate
      ? (Timestamp.fromDate(new Date(request.estimatedDeliveryDate)) as unknown as FirestoreTrackingItem["estimatedDeliveryDate"])
      : undefined,
  }) as Partial<FirestoreTrackingItem>;

  await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.TRACKING_ITEMS)
    .doc(trackingItem.id)
    .set(updateData, { merge: true });

  const updatedItem = {
    ...trackingItem,
    ...updateData,
    statusHistory: [...cleanedHistory, statusUpdate],
  } as FirestoreTrackingItem;

  await writePublicTrackingProjection(updatedItem);
  return updatedItem;
}

export async function deleteTrackingItem(identifier: string) {
  const trackingItem =
    (await getTrackingItemByTrackingId(identifier)) ||
    ((await getFirebaseAdminDb()
      .collection(FIRESTORE_COLLECTIONS.TRACKING_ITEMS)
      .doc(identifier)
      .get())
      .exists
      ? ({
          id: identifier,
          ...(await getFirebaseAdminDb()
            .collection(FIRESTORE_COLLECTIONS.TRACKING_ITEMS)
            .doc(identifier)
            .get()).data(),
        } as FirestoreTrackingItem)
      : null);

  if (!trackingItem) {
    throw new Error("Tracking item not found");
  }

  await getFirebaseAdminDb()
    .collection(FIRESTORE_COLLECTIONS.TRACKING_ITEMS)
    .doc(trackingItem.id)
    .delete();
  await deletePublicTrackingProjection(trackingItem.id);
}
