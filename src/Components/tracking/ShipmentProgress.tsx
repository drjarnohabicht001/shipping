'use client';

import React from 'react';
import {
  Clock,
  FileText,
  Package,
  Truck,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  TimerOff,
  Globe2,
} from 'lucide-react';
import { TrackingStatus } from '@/lib/firestore-schema';

interface ShipmentProgressProps {
  status: TrackingStatus;
}

const STEPS = [
  { status: TrackingStatus.PENDING,          label: 'Order Placed',     icon: Clock },
  { status: TrackingStatus.LABEL_CREATED,    label: 'Label Created',    icon: FileText },
  { status: TrackingStatus.PICKED_UP,        label: 'Picked Up',        icon: Package },
  { status: TrackingStatus.IN_TRANSIT,       label: 'In Transit',       icon: Truck },
  { status: TrackingStatus.OUT_FOR_DELIVERY, label: 'Out for Delivery', icon: Navigation },
  { status: TrackingStatus.DELIVERED,        label: 'Delivered',        icon: CheckCircle2 },
];

const STATUS_INDEX: Record<string, number> = {
  [TrackingStatus.PENDING]:           0,
  [TrackingStatus.LABEL_CREATED]:     1,
  [TrackingStatus.PICKED_UP]:         2,
  [TrackingStatus.IN_TRANSIT]:        3,
  [TrackingStatus.CUSTOMS_CLEARANCE]: 3,
  [TrackingStatus.DELAYED]:           3,
  [TrackingStatus.OUT_FOR_DELIVERY]:  4,
  [TrackingStatus.FAILED_DELIVERY]:   4,
  [TrackingStatus.EXCEPTION]:         4,
  [TrackingStatus.RETURNED_TO_SENDER]:3,
  [TrackingStatus.DELIVERED]:         5,
  [TrackingStatus.CANCELLED]:         -1,
};

const SPECIAL_BANNERS: Partial<Record<TrackingStatus, { icon: React.ReactNode; title: string; body: string; cls: string }>> = {
  [TrackingStatus.CUSTOMS_CLEARANCE]: {
    icon: <Globe2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />,
    title: 'In Customs Clearance',
    body: 'Your package is being processed by customs. This may take additional time.',
    cls: 'bg-purple-50 border-purple-200 text-purple-900',
  },
  [TrackingStatus.DELAYED]: {
    icon: <TimerOff className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />,
    title: 'Shipment Delayed',
    body: "Your shipment has been delayed. We're working to get it back on track.",
    cls: 'bg-amber-50 border-amber-200 text-amber-900',
  },
  [TrackingStatus.FAILED_DELIVERY]: {
    icon: <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />,
    title: 'Delivery Attempted',
    body: 'Delivery was unsuccessful. Please check your delivery instructions or contact support.',
    cls: 'bg-red-50 border-red-200 text-red-900',
  },
  [TrackingStatus.EXCEPTION]: {
    icon: <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />,
    title: 'Shipment Exception',
    body: 'An exception has occurred with your shipment. Please contact support.',
    cls: 'bg-red-50 border-red-200 text-red-900',
  },
  [TrackingStatus.RETURNED_TO_SENDER]: {
    icon: <RotateCcw className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />,
    title: 'Returned to Sender',
    body: 'Your package is being returned to the sender. Please contact support for assistance.',
    cls: 'bg-orange-50 border-orange-200 text-orange-900',
  },
  [TrackingStatus.CANCELLED]: {
    icon: <XCircle className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />,
    title: 'Shipment Cancelled',
    body: 'This shipment has been cancelled. Please contact support if you have any questions.',
    cls: 'bg-gray-50 border-gray-200 text-gray-700',
  },
};

const ShipmentProgress: React.FC<ShipmentProgressProps> = ({ status }) => {
  const activeIndex = STATUS_INDEX[status] ?? 0;
  const isCancelled = status === TrackingStatus.CANCELLED;
  const isFailed = status === TrackingStatus.FAILED_DELIVERY || status === TrackingStatus.EXCEPTION;
  const banner = SPECIAL_BANNERS[status];

  const getCircleClass = (i: number) => {
    if (isCancelled) return 'bg-gray-100 border-gray-200 text-gray-400';
    if (i < activeIndex) return 'bg-[#FF5A24] border-[#FF5A24] text-white shadow-md shadow-orange-200';
    if (i === activeIndex) {
      if (isFailed) return 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200 ring-4 ring-red-100';
      return 'bg-[#FF5A24] border-[#FF5A24] text-white shadow-xl shadow-orange-300 ring-4 ring-orange-100';
    }
    return 'bg-white border-gray-200 text-gray-400';
  };

  const getLabelClass = (i: number) => {
    if (isCancelled) return 'text-gray-400';
    if (i <= activeIndex) return 'text-gray-800 font-semibold';
    return 'text-gray-400 font-medium';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-8">Shipment Progress</h3>

      <div className="flex items-start">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isLast = i === STEPS.length - 1;
          const connectorFilled = !isCancelled && i < activeIndex;

          return (
            <React.Fragment key={step.status}>
              {/* Step */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${getCircleClass(i)}`}>
                  {i < activeIndex && !isCancelled
                    ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                    : <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  }
                  {i === activeIndex && !isFailed && !isCancelled && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF5A24] rounded-full animate-ping" />
                  )}
                </div>
                <p className={`mt-2 text-center text-[10px] md:text-xs leading-tight w-14 md:w-16 ${getLabelClass(i)}`}>
                  {step.label}
                </p>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className="flex-1 mt-6 md:mt-7 mx-0.5 md:mx-1 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${connectorFilled ? 'w-full bg-[#FF5A24]' : 'w-0'}`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Special status banner */}
      {banner && (
        <div className={`mt-8 p-4 border rounded-xl flex items-start gap-3 ${banner.cls}`}>
          {banner.icon}
          <div>
            <p className="text-sm font-semibold">{banner.title}</p>
            <p className="text-xs mt-0.5 opacity-80">{banner.body}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentProgress;
