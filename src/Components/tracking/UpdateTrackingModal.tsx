"use client";

import React, { useState, useEffect } from "react";
import { X, Package, MapPin, Save, AlertCircle, Calendar } from "lucide-react";
import { TrackingStatus, FirestoreTrackingItem } from "@/lib/firestore-schema";
import { Timestamp } from "firebase/firestore";

interface UpdateTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracking: FirestoreTrackingItem | null;
  onSubmit: (data: {
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
    notes?: string;
    isPublic?: boolean;
    estimatedDeliveryDate?: Date;
  }) => Promise<void>;
}

const UpdateTrackingModal: React.FC<UpdateTrackingModalProps> = ({
  isOpen,
  onClose,
  tracking,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: TrackingStatus.PENDING,
    location: {
      city: "",
      state: "",
      country: "",
      facility: "",
      coordinates: {
        latitude: 0,
        longitude: 0,
      },
    },
    description: "",
    notes: "",
    isPublic: true,
    hasLocation: false,
    hasCoordinates: false,
    updateEstimatedDelivery: false,
    estimatedDeliveryDate: "",
  });

  useEffect(() => {
    if (tracking) {
      let estimatedDate = "";
      if (tracking.estimatedDeliveryDate) {
        let date: Date;
        const raw = tracking.estimatedDeliveryDate as any;
        if (typeof raw.toDate === "function") {
          // Firestore Timestamp instance
          date = raw.toDate();
        } else if (raw instanceof Date) {
          date = raw;
        } else if (
          raw &&
          typeof raw === "object" &&
          typeof raw.seconds === "number"
        ) {
          // Serialized Firestore Timestamp plain object: { seconds, nanoseconds }
          date = new Date(raw.seconds * 1000);
        } else {
          date = new Date(raw);
        }
        if (!isNaN(date.getTime())) {
          estimatedDate = date.toISOString().split("T")[0];
        }
      }

      setFormData({
        status: tracking.status,
        location: (tracking.currentLocation as any) || {
          city: "",
          state: "",
          country: "",
          facility: "",
          coordinates: {
            latitude: 0,
            longitude: 0,
          },
        },
        description: "",
        notes: "",
        isPublic: true,
        hasLocation: !!tracking.currentLocation,
        hasCoordinates: !!tracking.currentLocation?.coordinates,
        updateEstimatedDelivery: false,
        estimatedDeliveryDate: estimatedDate,
      });
    }
  }, [tracking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tracking) return;

    // Validate required fields
    if (!formData.description.trim()) {
      alert("Please provide a description for the status update");
      return;
    }

    if (formData.hasLocation) {
      if (!formData.location.city.trim() || !formData.location.country.trim()) {
        alert("Please provide both city and country when updating location");
        return;
      }
    }

    setLoading(true);

    try {
      // Build location object, removing undefined values and empty strings
      let locationObj: any = undefined;
      if (
        formData.hasLocation &&
        formData.location.city.trim() &&
        formData.location.country.trim()
      ) {
        locationObj = {
          city: formData.location.city.trim(),
          country: formData.location.country.trim(),
        };

        if (formData.location.state && formData.location.state.trim()) {
          locationObj.state = formData.location.state.trim();
        }

        if (formData.location.facility && formData.location.facility.trim()) {
          locationObj.facility = formData.location.facility.trim();
        }

        if (
          formData.hasCoordinates &&
          formData.location.coordinates.latitude &&
          formData.location.coordinates.longitude
        ) {
          locationObj.coordinates = {
            latitude: Number(formData.location.coordinates.latitude),
            longitude: Number(formData.location.coordinates.longitude),
          };
        }
      }

      // Handle estimated delivery date
      let estimatedDeliveryDate: Date | undefined = undefined;
      if (formData.updateEstimatedDelivery && formData.estimatedDeliveryDate) {
        estimatedDeliveryDate = new Date(formData.estimatedDeliveryDate);
        if (isNaN(estimatedDeliveryDate.getTime())) {
          alert("Please provide a valid estimated delivery date");
          setLoading(false);
          return;
        }
      }

      const submitData = {
        trackingId: tracking.trackingId,
        status: formData.status,
        description:
          formData.description.trim() || `Status updated to ${formData.status}`,
        notes: formData.notes?.trim() || undefined,
        isPublic: formData.isPublic,
        location: locationObj,
        estimatedDeliveryDate: estimatedDeliveryDate,
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error("Error updating tracking:", error);
      // Error will be handled by parent component
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (path: string, value: any) => {
    setFormData((prev) => {
      const keys = path.split(".");
      const newData = { ...prev };
      let current: any = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  if (!isOpen || !tracking) return null;

  const statusOptions = [
    { value: TrackingStatus.PENDING, label: "Pending Pickup" },
    { value: TrackingStatus.LABEL_CREATED, label: "Label Created" },
    { value: TrackingStatus.PICKED_UP, label: "Picked Up" },
    { value: TrackingStatus.IN_TRANSIT, label: "In Transit" },
    { value: TrackingStatus.OUT_FOR_DELIVERY, label: "Out for Delivery" },
    { value: TrackingStatus.DELIVERED, label: "Delivered" },
    { value: TrackingStatus.FAILED_DELIVERY, label: "Failed Delivery" },
    { value: TrackingStatus.RETURNED_TO_SENDER, label: "Returned to Sender" },
    { value: TrackingStatus.CANCELLED, label: "Cancelled" },
    { value: TrackingStatus.EXCEPTION, label: "Exception" },
    { value: TrackingStatus.CUSTOMS_CLEARANCE, label: "Customs Clearance" },
    { value: TrackingStatus.DELAYED, label: "Delayed" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-[#FF5A24]" />
            Update Tracking Status
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tracking Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Tracking ID:</span>
                <span className="font-mono font-semibold text-gray-900">
                  {tracking.trackingId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Item:</span>
                <span className="font-medium text-gray-900">
                  {tracking.itemName}
                </span>
              </div>
            </div>
          </div>

          {/* Status Update */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Status Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  updateFormData("status", e.target.value as TrackingStatus)
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                required
                rows={3}
                placeholder="Describe the status update (e.g., Package arrived at distribution center)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateFormData("notes", e.target.value)}
                rows={2}
                placeholder="Optional notes for internal use"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => updateFormData("isPublic", e.target.checked)}
                className="h-4 w-4 text-[#FF5A24] focus:ring-[#FF5A24] border-gray-300 rounded"
              />
              <label
                htmlFor="isPublic"
                className="ml-2 block text-sm text-gray-700"
              >
                Make this update visible to customers
              </label>
            </div>
          </div>

          {/* Location Update */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#FF5A24]" />
                Location Information
              </h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasLocation"
                  checked={formData.hasLocation}
                  onChange={(e) =>
                    updateFormData("hasLocation", e.target.checked)
                  }
                  className="h-4 w-4 text-[#FF5A24] focus:ring-[#FF5A24] border-gray-300 rounded"
                />
                <label
                  htmlFor="hasLocation"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Update location
                </label>
              </div>
            </div>

            {formData.hasLocation && (
              <div className="space-y-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      required={formData.hasLocation}
                      value={formData.location.city}
                      onChange={(e) =>
                        updateFormData("location.city", e.target.value)
                      }
                      placeholder="e.g., New York"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State/Province
                    </label>
                    <input
                      type="text"
                      value={formData.location.state}
                      onChange={(e) =>
                        updateFormData("location.state", e.target.value)
                      }
                      placeholder="e.g., NY"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      required={formData.hasLocation}
                      value={formData.location.country}
                      onChange={(e) =>
                        updateFormData("location.country", e.target.value)
                      }
                      placeholder="e.g., United States"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facility Name
                    </label>
                    <input
                      type="text"
                      value={formData.location.facility}
                      onChange={(e) =>
                        updateFormData("location.facility", e.target.value)
                      }
                      placeholder="e.g., Distribution Center #5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                    />
                  </div>
                </div>

                {/* Coordinates (Optional) */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="hasCoordinates"
                      checked={formData.hasCoordinates}
                      onChange={(e) =>
                        updateFormData("hasCoordinates", e.target.checked)
                      }
                      className="h-4 w-4 text-[#FF5A24] focus:ring-[#FF5A24] border-gray-300 rounded"
                    />
                    <label
                      htmlFor="hasCoordinates"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Include GPS coordinates (optional)
                    </label>
                  </div>

                  {formData.hasCoordinates && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.location.coordinates.latitude || ""}
                          onChange={(e) =>
                            updateFormData(
                              "location.coordinates.latitude",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="e.g., 40.7128"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.location.coordinates.longitude || ""}
                          onChange={(e) =>
                            updateFormData(
                              "location.coordinates.longitude",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="e.g., -74.0060"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Estimated Delivery Update */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#FF5A24]" />
                Estimated Delivery Date
              </h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="updateEstimatedDelivery"
                  checked={formData.updateEstimatedDelivery}
                  onChange={(e) =>
                    updateFormData("updateEstimatedDelivery", e.target.checked)
                  }
                  className="h-4 w-4 text-[#FF5A24] focus:ring-[#FF5A24] border-gray-300 rounded"
                />
                <label
                  htmlFor="updateEstimatedDelivery"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Update estimated delivery
                </label>
              </div>
            </div>

            {formData.updateEstimatedDelivery && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Delivery Date *
                  </label>
                  <input
                    type="date"
                    required={formData.updateEstimatedDelivery}
                    value={formData.estimatedDeliveryDate}
                    onChange={(e) =>
                      updateFormData("estimatedDeliveryDate", e.target.value)
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Select the expected delivery date for this shipment
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#FF5A24] text-white rounded-lg hover:bg-[#e54a1f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Save className="h-4 w-4" />
              {loading ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateTrackingModal;
