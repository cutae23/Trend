import { useEffect, useRef } from "react";
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

  const L = (window as any).L;

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || !L) return;

    // Create Leaflet map instance
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([center.lat, center.lng], zoom);

    // Add high-quality Mapbox-like styled free OpenStreetMap tiles (Voyager variant)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    // Add zoom control at bottom-right for elegant UI
    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Fly to region center when props change
  useEffect(() => {
    if (mapRef.current && L) {
      mapRef.current.setView([center.lat, center.lng], zoom, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [center, zoom]);

  // 3. Populate Map Markers when places list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !L) return;

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

      // Create marker
      const marker = L.marker([place.latitude, place.longitude], { icon: customIcon }).addTo(map);

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
          <div class="flex items-center gap-1.5 mt-1">
            <button id="btn-popup-select-${place.id}" class="flex-1 text-center bg-[#1A1A1A] text-white text-[10px] font-bold tracking-wider uppercase py-1.5 px-2 hover:bg-[#E63946] cursor-pointer transition-colors">
              상세 분석 보기
            </button>
            <a href="${place.url}" target="_blank" rel="noopener noreferrer" class="text-center border border-[#1A1A1A]/20 text-[#1A1A1A] text-[10px] py-1.5 px-2 hover:bg-[#1A1A1A]/5 transition-colors">
              원문 ↗
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
  }, [places]);

  // 4. Handle Programmatic Fly To selected place
  useEffect(() => {
    if (selectedPlace && mapRef.current && L) {
      const marker = markersRef.current.find((m) => {
        const latLng = m.getLatLng();
        return (
          Math.abs(latLng.lat - selectedPlace.latitude) < 0.0001 &&
          Math.abs(latLng.lng - selectedPlace.longitude) < 0.0001
        );
      });

      if (marker) {
        marker.openPopup();
      }

      mapRef.current.flyTo([selectedPlace.latitude, selectedPlace.longitude], 16, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [selectedPlace]);

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
