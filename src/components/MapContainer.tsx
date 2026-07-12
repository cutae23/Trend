import { useEffect, useRef, useState } from "react";
import { NewsPlace } from "../types";

interface MapContainerProps {
  places: NewsPlace[];
  selectedPlace: NewsPlace | null;
  onSelectPlace: (place: NewsPlace | null) => void;
  center: { lat: number; lng: number };
  zoom: number;
}

export default function MapContainer({
  places,
  selectedPlace,
  onSelectPlace,
  center,
  zoom,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [leafletReady, setLeafletReady] = useState(!!(window as any).L);

  // Poll or check if Leaflet is loaded
  useEffect(() => {
    if ((window as any).L) {
      setLeafletReady(true);
      return;
    }

    const interval = setInterval(() => {
      if ((window as any).L) {
        setLeafletReady(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const L = (window as any).L;

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || !L || !leafletReady) return;

    // Create Leaflet map instance
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([center.lat, center.lng], zoom);

    // Add official, high-quality, and robust standard OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control at bottom-right for elegant UI
    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    // Handle container resize cleanly using ResizeObserver to prevent grey/broken tiles
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Delayed invalidateSize to ensure correct initial rendering after layout completes
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletReady]);

  // 2. Fly to region center when props change
  useEffect(() => {
    if (mapRef.current && L && leafletReady) {
      mapRef.current.setView([center.lat, center.lng], zoom, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [center, zoom, leafletReady]);

  // 3. Populate Map Markers when places list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !L || !leafletReady) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Category mapping for styling matching "Editorial Aesthetic"
    const categoryColors: Record<string, { bg: string; text: string; label: string }> = {
      restaurant: { bg: "#E63946", text: "식당", label: "🍲" },
      cafe: { bg: "#1A1A1A", text: "카페", label: "☕" },
      spot: { bg: "#4A4A4A", text: "명소", label: "🌴" },
      culture: { bg: "#E63946", text: "문화", label: "🎨" },
    };

    places.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const theme = categoryColors[place.category] || { bg: "#1A1A1A", text: "기타", label: "📍" };

      // Define standard HTML for the custom divIcon
      const htmlIcon = `
        <div class="relative flex items-center justify-center pointer-events-auto">
          ${
            isSelected
              ? `<div class="absolute -inset-2.5 rounded-full opacity-35 animate-ping" style="background-color: ${theme.bg}"></div>`
              : ""
          }
          <div class="flex items-center justify-center rounded-full border border-[#FCFAF7] shadow-lg text-white font-medium transition-all duration-300 transform ${
            isSelected ? "scale-125 z-50 ring-4 ring-[#1A1A1A]" : "scale-100 hover:scale-110"
          }" style="width: 36px; height: 36px; background-color: ${theme.bg};">
            <span class="text-base leading-none">${theme.label}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: htmlIcon,
        className: "custom-leaflet-marker", // transparent reset
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Create marker and associate placeId for 100% robust tracking
      const marker = L.marker([place.latitude, place.longitude], { icon: customIcon }).addTo(map);
      (marker as any).placeId = place.id;

      // Bind dynamic rich popup matching Editorial styling
      const popupContent = `
        <div class="p-1 max-w-[280px] font-sans">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 border" style="color: ${theme.bg}; border-color: ${theme.bg}20; background-color: ${theme.bg}08">
              ${theme.text}
            </span>
            <span class="text-[9px] text-[#1A1A1A]/40 font-mono">${place.publishDate}</span>
          </div>
          <h3 class="font-serif font-bold text-[#1A1A1A] text-base hover:underline cursor-pointer mb-1 leading-tight select-none">
            ${place.name}
          </h3>
          <p class="text-[11px] text-[#E63946] font-serif italic mb-1.5">${place.menuSummary}</p>
          <div class="h-px bg-[#1A1A1A]/10 my-1.5"></div>
          <p class="text-[11px] text-[#1A1A1A]/70 line-clamp-2 leading-relaxed mb-2 bg-[#1A1A1A]/5 p-2 border border-[#1A1A1A]/5">
            "${place.newsTitle}"
          </p>
          <div class="flex items-center gap-1 mt-1">
            <button id="btn-popup-select-${place.id}" class="flex-1 text-center bg-[#1A1A1A] text-white text-[9px] font-bold tracking-tight uppercase py-1.5 px-2 hover:bg-[#E63946] cursor-pointer transition-colors">
              상세 분석 보기
            </button>
            <a href="https://map.naver.com/v5/search/${encodeURIComponent(place.name)}" target="_blank" rel="noopener noreferrer" class="text-center bg-[#03C75A] text-white text-[9px] font-bold py-1.5 px-2 hover:bg-[#02b350] transition-colors rounded-xs">
              네이버 지도 ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        offset: [0, -10],
      });

      // Click callback
      marker.on("click", () => {
        onSelectPlace(place);
      });

      // Listen to popup opens to attach events to custom buttons
      marker.on("popupopen", () => {
        const selectBtn = document.getElementById(`btn-popup-select-${place.id}`);
        if (selectBtn) {
          selectBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            onSelectPlace(place);
          });
        }
      });

      markersRef.current.push(marker);
    });

    // Auto-fit bounds if we have markers to prevent empty-looking maps
    if (places.length > 0) {
      const bounds = L.latLngBounds(places.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [places, leafletReady]);

  // 4. Handle Programmatic Fly To selected place
  useEffect(() => {
    if (selectedPlace && mapRef.current && L && leafletReady) {
      const marker = markersRef.current.find((m) => m.placeId === selectedPlace.id);

      if (marker) {
        marker.openPopup();
      }

      mapRef.current.flyTo([selectedPlace.latitude, selectedPlace.longitude], 16, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [selectedPlace, leafletReady]);

  return (
    <div className="relative w-full h-full min-h-[350px] md:min-h-0 bg-[#F0EEEB] overflow-hidden border border-[#1A1A1A]/10">
      {/* Map Element */}
      <div id="map-element" ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Info Overlay */}
      <div className="absolute top-4 left-4 z-20 bg-[#FCFAF7]/95 backdrop-blur py-2 px-3 border border-[#1A1A1A]/10 flex items-center gap-2 pointer-events-none shadow-xs">
        <span className="flex h-1.5 w-1.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E63946] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#E63946]"></span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/80">MAP ENGINE: OPENSTREETMAP</span>
      </div>

      {places.length === 0 && (
        <div className="absolute inset-0 bg-[#FCFAF7]/90 backdrop-blur-xs z-20 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 border border-[#1A1A1A]/20 text-[#1A1A1A]/60 flex items-center justify-center text-xl mb-4 font-serif">
            🗺️
          </div>
          <h4 className="font-serif font-bold text-[#1A1A1A] mb-1.5 text-lg">LOCUS MAP ACTIVE</h4>
          <p className="text-xs text-[#1A1A1A]/60 max-w-[280px] leading-relaxed">
            좌측에서 대상 지역 및 트렌드 테마를 선정하여 실시간 뉴스 속 맛집들을 이 공간 맵프레임 위에 펼쳐 보세요.
          </p>
        </div>
      )}
    </div>
  );
}
