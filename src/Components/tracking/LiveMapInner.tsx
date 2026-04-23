'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

interface Location {
  city: string;
  state?: string;
  country: string;
  facility?: string;
  coordinates?: { latitude: number; longitude: number };
}

interface LiveMapInnerProps {
  location: Location;
}

// Inject pulsing keyframe animation once
function injectPingCSS() {
  if (typeof document === 'undefined' || document.getElementById('lm-ping-style')) return;
  const style = document.createElement('style');
  style.id = 'lm-ping-style';
  style.textContent = `
    @keyframes lm-ping {
      0% { transform: scale(0.5); opacity: 1; }
      75%, 100% { transform: scale(2.2); opacity: 0; }
    }
    .lm-ping-ring { animation: lm-ping 1.8s cubic-bezier(0,0,0.2,1) infinite; }
    .lm-ping-ring2 { animation: lm-ping 1.8s cubic-bezier(0,0,0.2,1) infinite 0.6s; }
  `;
  document.head.appendChild(style);
}

function createPulseIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
        <div class="lm-ping-ring"  style="position:absolute;width:40px;height:40px;background:rgba(255,90,36,0.25);border-radius:50%;"></div>
        <div class="lm-ping-ring2" style="position:absolute;width:28px;height:28px;background:rgba(255,90,36,0.25);border-radius:50%;"></div>
        <div style="position:relative;z-index:10;width:20px;height:20px;background:#FF5A24;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(255,90,36,0.6);"></div>
      </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -28],
  });
}

async function geocode(city: string, state?: string, country?: string): Promise<[number, number] | null> {
  try {
    const q = encodeURIComponent([city, state, country].filter(Boolean).join(', '));
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { 'User-Agent': 'ShippingTracker/1.0' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch {/* silent */}
  return null;
}

const LiveMapInner: React.FC<LiveMapInnerProps> = ({ location }) => {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    injectPingCSS();
  }, []);

  useEffect(() => {
    if (location.coordinates?.latitude && location.coordinates?.longitude) {
      setCoords([location.coordinates.latitude, location.coordinates.longitude]);
    } else {
      setGeocoding(true);
      geocode(location.city, location.state, location.country).then((result) => {
        setCoords(result);
        setGeocoding(false);
      });
    }
  }, [location]);

  if (geocoding) {
    return (
      <div className="h-80 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-[#FF5A24] border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">Locating package...</p>
        </div>
      </div>
    );
  }

  if (!coords) {
    return (
      <div className="h-80 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex flex-col items-center justify-center gap-3">
        <MapPin className="w-10 h-10 text-gray-300" />
        <p className="text-sm text-gray-500">Location coordinates unavailable</p>
        <p className="text-xs text-gray-400">{location.city}, {location.country}</p>
      </div>
    );
  }

  const locationLabel = [location.city, location.state, location.country].filter(Boolean).join(', ');

  return (
    <MapContainer
      center={coords}
      zoom={11}
      scrollWheelZoom={false}
      style={{ height: '320px', width: '100%', borderRadius: '1rem', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <Marker position={coords} icon={createPulseIcon()}>
        <Popup>
          <div className="text-sm font-semibold text-gray-900">{locationLabel}</div>
          {location.facility && <div className="text-xs text-gray-600 mt-1">{location.facility}</div>}
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default LiveMapInner;
