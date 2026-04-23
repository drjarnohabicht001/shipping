'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { MapPin } from 'lucide-react';

interface Location {
  city: string;
  state?: string;
  country: string;
  facility?: string;
  coordinates?: { latitude: number; longitude: number };
}

// Dynamically import the actual map (SSR: false — Leaflet needs browser APIs)
const LiveMapInner = dynamic(() => import('./LiveMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-2 border-[#FF5A24] border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading map…</p>
      </div>
    </div>
  ),
});

interface LiveMapProps {
  location: Location;
}

const LiveMap: React.FC<LiveMapProps> = ({ location }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
          <MapPin className="w-4 h-4 text-[#FF5A24]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Live Package Location</h3>
          <p className="text-xs text-gray-500">
            {[location.city, location.state, location.country].filter(Boolean).join(', ')}
            {location.facility && ` · ${location.facility}`}
          </p>
        </div>
        {/* Live pulse badge */}
        <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>

      {/* Map */}
      <div className="overflow-hidden rounded-xl border border-gray-100">
        <LiveMapInner location={location} />
      </div>
    </div>
  );
};

export default LiveMap;
