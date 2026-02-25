"use client";

import React, { useState, useEffect } from "react";
import { X, Save, DollarSign, Calendar } from "lucide-react";
import { FirestoreQuote } from "@/lib/firestore-schema";
import QuoteService from "@/services/quoteService";
import { useAuth } from "@/contexts/AuthContext";

const quoteService = QuoteService.getInstance();

interface QuoteEditModalProps {
  quote: FirestoreQuote;
  onClose: () => void;
  onUpdate: () => void;
}

const QuoteEditModal: React.FC<QuoteEditModalProps> = ({
  quote,
  onClose,
  onUpdate,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: quote.status,
    estimatedCost: quote.estimatedCost || 0,
    validUntil:
      quote.validUntil && typeof quote.validUntil.toDate === "function"
        ? quote.validUntil.toDate().toISOString().split("T")[0]
        : "",
    notes: quote.notes || "",
    adminNotes: quote.adminNotes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = user?.id || "system";
      const updateData: any = {
        quoteId: quote.id,
        status: formData.status,
        estimatedCost:
          formData.estimatedCost > 0 ? formData.estimatedCost : undefined,
        notes: formData.notes || undefined,
        adminNotes: formData.adminNotes || undefined,
        updatedBy: userId,
      };

      if (formData.validUntil) {
        updateData.validUntil = new Date(formData.validUntil);
      }

      await quoteService.updateQuote(updateData);
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error("Error updating quote:", error);
      alert(error.message || "Failed to update quote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Quote: {quote.quoteNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              required
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
            >
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Estimated Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#FF5A24]" />
              Estimated Cost ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.estimatedCost}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estimatedCost: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
            />
          </div>

          {/* Valid Until */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#FF5A24]" />
              Valid Until
            </label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) =>
                setFormData({ ...formData, validUntil: e.target.value })
              }
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
            />
          </div>

          {/* Customer Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
              placeholder="Customer's notes..."
            />
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes (Internal)
            </label>
            <textarea
              value={formData.adminNotes}
              onChange={(e) =>
                setFormData({ ...formData, adminNotes: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
              placeholder="Internal notes for admin use only..."
            />
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
              {loading ? "Updating..." : "Update Quote"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuoteEditModal;
