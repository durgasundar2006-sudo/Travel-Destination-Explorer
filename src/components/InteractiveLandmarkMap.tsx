import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CountryDetails } from '../types/country';
import { Landmark, getLandmarksForCountry } from '../data/countryLandmarks';
import {
  MapPin,
  Compass,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  Info,
  Clock,
  MessageSquare
} from 'lucide-react';

interface InteractiveLandmarkMapProps {
  country: CountryDetails;
  onAskAboutLandmark?: (landmarkName: string) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Iconic: { bg: '#0284c7', border: '#0369a1', text: '#ffffff' },
  Nature: { bg: '#059669', border: '#047857', text: '#ffffff' },
  Historic: { bg: '#d97706', border: '#b45309', text: '#ffffff' },
  Cultural: { bg: '#6366f1', border: '#4f46e5', text: '#ffffff' },
  Culinary: { bg: '#e11d48', border: '#be123c', text: '#ffffff' }
};

export const InteractiveLandmarkMap: React.FC<InteractiveLandmarkMapProps> = ({
  country,
  onAskAboutLandmark
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Retrieve landmarks for the active country
  const landmarks: Landmark[] = React.useMemo(() => {
    return getLandmarksForCountry(
      country.cca3 || country.id,
      country.commonName,
      country.capital,
      country.latlng
    );
  }, [country.id, country.cca3, country.commonName, country.capital, country.latlng]);

  const filteredLandmarks = React.useMemo(() => {
    if (selectedCategory === 'All') return landmarks;
    return landmarks.filter((l) => l.category === selectedCategory);
  }, [landmarks, selectedCategory]);

  // Initialize or re-center Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const centerLat = country.latlng && country.latlng.length === 2 ? country.latlng[0] : 20;
    const centerLng = country.latlng && country.latlng.length === 2 ? country.latlng[1] : 0;

    // Determine initial zoom level based on area
    const zoom = country.areaKm2 > 5000000 ? 3 : country.areaKm2 > 500000 ? 5 : 6;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap Tiles (Fast, high-contrast, no API key needed)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([centerLat, centerLng], zoom);
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Add markers for filtered landmarks
    const bounds = L.latLngBounds([]);

    filteredLandmarks.forEach((lm) => {
      const color = CATEGORY_COLORS[lm.category] || { bg: '#0284c7', border: '#0369a1', text: '#fff' };

      // Create custom SVG marker icon
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background-color: ${color.bg};
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            <span style="
              transform: rotate(45deg);
              color: white;
              font-size: 13px;
              font-weight: bold;
            ">★</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([lm.lat, lm.lng], { icon: customIcon }).addTo(map);

      // Popup Content
      const popupHtml = `
        <div style="font-family: inherit; max-width: 240px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 4px;">
            <span style="background: ${color.bg}15; color: ${color.bg}; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px; text-transform: uppercase;">
              ${lm.category}
            </span>
            <span style="font-size: 11px; color: #64748b;">${lm.recommendedDuration}</span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #0f172a;">
            ${lm.name}
          </h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #475569; line-height: 1.4;">
            ${lm.description}
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; font-size: 11px; color: #0284c7; margin-top: 4px;">
            💡 <strong>AI Tip:</strong> ${lm.aiTip}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedLandmark(lm);
      });

      markersRef.current.set(lm.id, marker);
      bounds.extend([lm.lat, lm.lng]);
    });

    // If multiple landmarks exist, fit map to enclose them nicely
    if (filteredLandmarks.length > 1 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }

    // Invalidate size to ensure proper tile rendering
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [country.id, filteredLandmarks]);

  // Fly to landmark when selected from the list
  const handleSelectLandmark = (lm: Landmark) => {
    setSelectedLandmark(lm);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lm.lat, lm.lng], 12, { duration: 1.2 });
      const marker = markersRef.current.get(lm.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  const handleResetZoom = () => {
    if (!mapInstanceRef.current) return;
    const bounds = L.latLngBounds([]);
    landmarks.forEach((l) => bounds.extend([l.lat, l.lng]));
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  };

  const categories = ['All', 'Iconic', 'Historic', 'Nature', 'Cultural', 'Culinary'];

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all ${isExpanded ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl flex flex-col' : ''}`}>
      {/* Top Header */}
      <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-sky-500/20 text-sky-400 border border-sky-400/30 rounded-xl">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-1.5">
              <span>Interactive Destination Map & Landmarks</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/10 text-sky-200">
                {country.commonName}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Explore major attractions and cultural landmarks highlighted in AI trip recommendations
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <button
            onClick={handleResetZoom}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset to whole country view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Zoom</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title={isExpanded ? 'Minimize map' : 'Expand full-screen'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          Landmark Category:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
        <span className="text-xs text-slate-400 ml-auto hidden sm:inline font-mono">
          {filteredLandmarks.length} pins
        </span>
      </div>

      {/* Split Grid: Leaflet Map (Left) + Interactive Landmark Cards (Right) */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 ${isExpanded ? 'flex-1 min-h-0' : 'h-[420px] sm:h-[480px]'}`}>
        {/* Map Viewport Container */}
        <div className="lg:col-span-8 relative h-full w-full bg-slate-100 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Quick Attribution / Coordinates Badge */}
          <div className="absolute bottom-2 left-2 z-20 bg-white/90 backdrop-blur-sm border border-slate-200 px-2 py-1 rounded-md text-[10px] text-slate-600 font-mono shadow-2xs">
            📍 {country.commonName} • {country.capital} • {landmarks.length} Landmark Sites
          </div>
        </div>

        {/* Landmarks Sidebar List */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50/60 p-3 overflow-y-auto space-y-2 h-full">
          <div className="px-1 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>AI Featured Landmarks</span>
            <span className="text-[10px] text-sky-600">Click to Fly</span>
          </div>

          {filteredLandmarks.map((lm) => {
            const isSelected = selectedLandmark?.id === lm.id;
            const color = CATEGORY_COLORS[lm.category] || { bg: '#0284c7', border: '#0369a1', text: '#fff' };

            return (
              <div
                key={lm.id}
                onClick={() => handleSelectLandmark(lm)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-1.5 ${
                  isSelected
                    ? 'bg-sky-50 border-sky-300 shadow-xs'
                    : 'bg-white hover:bg-slate-100/80 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${color.bg}15`, color: color.bg }}
                  >
                    {lm.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {lm.cityOrRegion}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {lm.name}
                </h4>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {lm.description}
                </p>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {lm.recommendedDuration}
                  </span>

                  {onAskAboutLandmark && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskAboutLandmark(lm.name);
                      }}
                      className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Ask AI</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
