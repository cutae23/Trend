import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NewsPlace } from '../types';
import { MapPin, Navigation, Star, ExternalLink, Utensils, Coffee, Compass, Palette } from 'lucide-react';

interface MapViewProps {
  places: NewsPlace[];
  selectedPlace: NewsPlace | null;
  onSelectPlace: (place: NewsPlace) => void;
  onViewProofCard?: (place: NewsPlace) => void;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  onToggleBucket: (place: NewsPlace) => void;
  bucketList: NewsPlace[];
}

export const MapView: React.FC<MapViewProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  onViewProofCard,
  mapCenter,
  mapZoom,
  onToggleBucket,
  bucketList
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Helper to get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'restaurant': return '#FF6B00'; // Vivid Orange
      case 'cafe': return '#1A1A1A'; // Deep Black
      case 'spot': return '#2563EB'; // Ocean Blue
      case 'culture': return '#9333EA'; // Purple
      default: return '#FF6B00';
    }
  };

  // Helper to create editorial HTML icon for marker
  const createCustomIcon = (place: NewsPlace, isSelected: boolean) => {
    const color = getCategoryColor(place.category);
    const isSaved = bucketList.some(b => b.id === place.id);
    
    const html = `
      <div class="relative group cursor-pointer flex flex-col items-center select-none" style="transform: translate(-50%, -100%);">
        <!-- Pulse ring for selected place -->
        ${isSelected ? `
          <div class="absolute -inset-2 rounded-full bg-[#FF6B00]/30 animate-ping"></div>
        ` : ''}

        <!-- Marker Badge -->
        <div class="relative flex items-center gap-1.5 px-2.5 py-1 text-white font-sans text-[10px] font-bold tracking-tight shadow-[3px_3px_0px_0px_#1A1A1A] transition-transform duration-200 ${
          isSelected ? 'scale-110 z-30 ring-2 ring-[#FF6B00]' : 'hover:scale-105 z-10'
        }" style="background-color: ${color}; border: 2px solid #1A1A1A;">
          
          <span class="truncate max-w-[100px]">${place.name}</span>
          
          ${isSaved ? '<span class="text-amber-300 font-bold">★</span>' : ''}
          
          ${place.mediaBuzzScore ? `
            <span class="bg-black/30 text-white text-[8px] px-1 py-0.2 rounded-xs font-mono">
              ${place.mediaBuzzScore}%
            </span>
          ` : ''}
        </div>

        <!-- Pin Arrow Triangle -->
        <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]" style="border-t-color: ${color}; margin-top: -1px;"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-leaflet-marker',
      iconSize: [120, 40],
      iconAnchor: [60, 40],
      popupAnchor: [0, -40]
    });
  };

  // Initialize map instance once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: mapZoom,
        zoomControl: false // Custom controls
      });

      // CartoDB Positron clean map tile style
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19
      }).addTo(map);

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;

      // Invalidate size after layout completes
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ResizeObserver to automatically resize map whenever container dimensions change
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    observer.observe(mapContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Sync map center and zoom when props update
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([mapCenter.lat, mapCenter.lng], mapZoom, {
        duration: 1.2
      });
      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 300);
    }
  }, [mapCenter, mapZoom]);

  // Render & Update Markers whenever places or selectedPlace or bucketList changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Add new markers
    places.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const icon = createCustomIcon(place, isSelected);

      const marker = L.marker([place.latitude, place.longitude], { icon }).addTo(map);

      // Marker Click -> Select Place
      marker.on('click', () => {
        onSelectPlace(place);
      });

      markersRef.current.set(place.id, marker);
    });

    // Auto-fit bounds to display all location markers cleanly if places exist
    if (places.length > 0) {
      const bounds = L.latLngBounds(places.map(p => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [places]);

  // Handle selected place highlight updates separately without refitting all bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((marker, id) => {
      const place = places.find(p => p.id === id);
      if (place) {
        const isSelected = selectedPlace?.id === place.id;
        marker.setIcon(createCustomIcon(place, isSelected));
      }
    });
  }, [selectedPlace, bucketList]);

  return (
    <div className="relative w-full h-full min-h-[350px] bg-[#FCFAF7] border-l border-[#1A1A1A]/10 overflow-hidden">
      
      {/* Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Header Overlay Badge */}
      <div className="absolute top-4 left-4 z-10 bg-[#FCFAF7] border-2 border-[#1A1A1A] p-2.5 shadow-[4px_4px_0px_0px_#1A1A1A] flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] animate-ping"></div>
        <div>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#1A1A1A]/60 block">
            LIVE MEDIA SPATIAL MAP
          </span>
          <span className="text-xs font-bold font-serif text-[#1A1A1A]">
            보도 검증 장소: {places.length}개 표출 중
          </span>
        </div>
      </div>

      {/* Selected Place Popup Card at Bottom of Map */}
      {selectedPlace && (
        <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-80 z-20 bg-[#FCFAF7] border-2 border-[#1A1A1A] p-4 shadow-[6px_6px_0px_0px_#1A1A1A] space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          
          <div className="flex items-start justify-between gap-2 border-b border-[#1A1A1A]/10 pb-2">
            <div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#FF6B00] text-white uppercase rounded-xs">
                {selectedPlace.category.toUpperCase()}
              </span>
              <h4 className="text-base font-serif font-black text-[#1A1A1A] mt-1 line-clamp-1">
                {selectedPlace.name}
              </h4>
            </div>
            <button
              onClick={() => onToggleBucket(selectedPlace)}
              className="text-[#FF6B00] hover:scale-110 active:scale-95 transition-transform p-1 cursor-pointer"
              title="버킷리스트 토글"
            >
              <Star className={`w-4 h-4 ${bucketList.some(b => b.id === selectedPlace.id) ? 'fill-[#FF6B00]' : 'fill-none'}`} />
            </button>
          </div>

          <p className="text-[11px] font-sans text-[#1A1A1A]/80 line-clamp-2 italic font-serif">
            "{selectedPlace.newsTitle}"
          </p>

          <p className="text-[10px] text-[#1A1A1A]/60 truncate flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#FF6B00] shrink-0" />
            <span>{selectedPlace.address}</span>
          </p>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                if (onViewProofCard) onViewProofCard(selectedPlace);
              }}
              className="w-full bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-serif font-bold py-2 px-3 rounded-xs text-center flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>📜 언론 보도 증명서 보기</span>
            </button>

            <div className="grid grid-cols-2 gap-1.5">
              <a
                href={`https://map.naver.com/v5/search/${encodeURIComponent(selectedPlace.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#03C75A] hover:bg-[#02b350] text-white text-[10px] font-bold py-1.5 px-2 rounded-xs text-center flex items-center justify-center gap-1 transition-colors"
              >
                <span>네이버 길찾기 ↗</span>
              </a>
              <a
                href={selectedPlace.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[#1A1A1A]/20 hover:border-[#1A1A1A] bg-white text-[#1A1A1A] text-[10px] font-bold py-1.5 px-2 rounded-xs text-center flex items-center justify-center gap-1 transition-colors"
              >
                <span>원문 기사 ↗</span>
              </a>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
