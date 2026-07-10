import { useState, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  Sparkles, 
  Utensils, 
  Coffee, 
  Compass, 
  Palette, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  Clock, 
  Copy,
  Check,
  Key,
  HelpCircle
} from "lucide-react";
import { NewsPlace, CategoryFilter, RegionOption } from "./types";
import MapContainer from "./components/MapContainer";

// Supported preset regions in South Korea with coordinates
const REGIONS: RegionOption[] = [
  { value: "Seoul", label: "📍 서울 (성수·용산·홍대)", lat: 37.5450, lng: 127.0420 },
  { value: "Busan", label: "📍 부산 (광안리·해운대·영도)", lat: 35.1557, lng: 129.1332 },
  { value: "Jeju", label: "📍 제주 (애월·구좌·서귀포)", lat: 33.5120, lng: 126.6118 },
  { value: "Gangwon", label: "📍 강원 (강릉·양양·속초)", lat: 37.8518, lng: 128.8761 }
];

// Preset themes to append for contextual searching
const THEMES = [
  { label: "요즘 뜨는 핫플", suffix: "맛집 핫플레이스" },
  { label: "감성 힐링 카페", suffix: "디저트 베이커리 맛집 카페" },
  { label: "TV 방송 출현 맛집", suffix: "생방송투데이 백종원 맛집" },
  { label: "데이트 야외 명소", suffix: "인기 데이트 코스 야외 가볼만한곳" }
];

export default function App() {
  const [places, setPlaces] = useState<NewsPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NewsPlace | null>(null);
  
  // Search state
  const [selectedRegion, setSelectedRegion] = useState<RegionOption>(REGIONS[0]);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [customKeyword, setCustomKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [dataSource, setDataSource] = useState<"cached_simulation" | "gemini_grounding_live" | "error_fallback_simulation" | "">("");

  // Map state
  const [mapCenter, setMapCenter] = useState({ lat: REGIONS[0].lat, lng: REGIONS[0].lng });
  const [mapZoom, setMapZoom] = useState(13);

  // Load default Seoul data on mount
  useEffect(() => {
    fetchPlaces(REGIONS[0].value, THEMES[0].suffix, "", true);
  }, []);

  // Stagger loading messages for ultimate premium feel
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const fetchPlaces = async (regionName: string, themeSuffix: string, customQuery: string, isInitial = false) => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      const response = await fetch("/api/news-places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: regionName,
          query: customQuery ? customQuery : `${regionName} ${themeSuffix}`,
          category: activeCategory === "all" ? undefined : activeCategory
        })
      });

      if (!response.ok) {
        throw new Error("서버 응답 오류가 발생했습니다.");
      }

      const data = await response.json();
      
      if (data.success && data.places && data.places.length > 0) {
        setPlaces(data.places);
        setDataSource(data.source);
        
        // Auto-select first place
        setSelectedPlace(data.places[0]);
        
        // Set map view to the center of extracted places
        if (!isInitial) {
          const avgLat = data.places.reduce((sum: number, p: NewsPlace) => sum + p.latitude, 0) / data.places.length;
          const avgLng = data.places.reduce((sum: number, p: NewsPlace) => sum + p.longitude, 0) / data.places.length;
          setMapCenter({ lat: avgLat, lng: avgLng });
          setMapZoom(14);
        }

        if (data.source === "cached_simulation") {
          setSuccessMsg("사전 수집된 핫플레이스 뉴스를 성공적으로 분석했습니다!");
        } else if (data.source === "dynamic_simulation") {
          setSuccessMsg(data.message || "💡 공간 지능 AI 로컬 분석 모드: 실시간 Gemini API 서버 환경 영향으로, 검색하신 조건에 맞춰 가공된 공간 빅데이터 트렌드 정보를 제공합니다.");
        } else if (data.source === "error_fallback_simulation") {
          setErrorMsg(data.message || "실시간 뉴스 추출 지연으로 사전 수집 데이터를 렌더링했습니다.");
        } else if (data.source === "gemini_live_no_grounding") {
          setSuccessMsg(data.message || "💡 구글 실시간 검색(Search Grounding) API 한도가 초과되어, Gemini 자체 지식 기반 공간 지능 모델로 즉시 핫플레이스를 분석·대체 생성했습니다!");
        } else {
          setSuccessMsg("Gemini 실시간 뉴스 검색 및 장소 지오코딩이 완료되었습니다!");
        }
      } else {
        throw new Error("조건에 맞는 장소 데이터를 기사에서 추출하지 못했습니다.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "장소 데이터를 추출하는 도중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const searchRegion = selectedRegion.value;
    const searchTheme = selectedTheme.suffix;
    const query = customKeyword.trim();
    
    if (!query) {
      setMapCenter({ lat: selectedRegion.lat, lng: selectedRegion.lng });
      setMapZoom(13);
    }
    
    fetchPlaces(searchRegion, searchTheme, query);
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Filter places locally based on current category selection
  const filteredPlaces = activeCategory === "all" 
    ? places 
    : places.filter(p => p.category === activeCategory);

  // Category Icon Mapper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "restaurant": return <Utensils className="w-3 h-3 text-[#E63946]" />;
      case "cafe": return <Coffee className="w-3 h-3 text-[#1A1A1A]" />;
      case "spot": return <Compass className="w-3 h-3 text-[#1A1A1A]" />;
      case "culture": return <Palette className="w-3 h-3 text-[#E63946]" />;
      default: return <MapPin className="w-3 h-3 text-[#1A1A1A]" />;
    }
  };

  // Category Korean Name Mapper
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "restaurant": return "식당";
      case "cafe": return "카페/베이커리";
      case "spot": return "관광/야외";
      case "culture": return "문화/체험";
      default: return "장소";
    }
  };

  // Category Theme classes mapper following Editorial style
  const getCategoryThemeClass = (category: string) => {
    switch (category) {
      case "restaurant": return "bg-[#E63946] text-white border-[#E63946]";
      case "cafe": return "bg-[#1A1A1A] text-white border-[#1A1A1A]";
      case "spot": return "bg-transparent text-[#1A1A1A] border-[#1A1A1A]";
      case "culture": return "bg-transparent text-[#E63946] border-[#E63946]";
      default: return "bg-transparent text-[#1A1A1A] border-[#1A1A1A]/30";
    }
  };

  const loadingSteps = [
    "포털 인기 언론사의 보도 기사 및 소셜 핫트렌드 검색 중...",
    "Gemini 3.5가 맛집, 인테리어 평점, 방문 후기 기사 필터링 중...",
    "기사에 기재된 상호명의 공식 주소 매칭 중...",
    "지도 렌더링을 위한 좌표(위도·경도) 정밀 계산 중..."
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FCFAF7] text-[#1A1A1A] font-sans overflow-hidden" id="app-root">
      
      {/* 1. Header (LOCUS NEWS Editorial layout) */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end px-6 sm:px-10 pt-6 pb-4 border-b border-[#1A1A1A]/10 bg-[#FCFAF7]" id="app-header">
        <div>
          <h1 className="text-4xl sm:text-5xl font-serif font-black tracking-tighter leading-none text-[#1A1A1A]">
            LOCUS<span className="italic font-light text-[#E63946]">NEWS</span> MAP
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold mt-2 text-[#1A1A1A]/60">
            The Weekly Spatial Intelligence Report & Hotspots
          </p>
        </div>
        
        <div className="flex gap-8 items-baseline mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right">
            <p className="text-[9px] uppercase tracking-widest font-bold text-[#1A1A1A]/40">Analysis Date</p>
            <p className="font-serif italic text-base sm:text-lg text-[#1A1A1A]">July 02 — July 09, 2026</p>
          </div>
        </div>
      </header>

      {/* 2. Main Content Grid (Unified Editorial Frame) */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-128px)]" id="app-main">
        
        {/* Left Sidebar: Controls, Filters & Articles list */}
        <aside className="w-full md:w-[380px] border-b md:border-b-0 md:border-r border-[#1A1A1A]/10 flex flex-col h-full bg-[#FCFAF7] overflow-hidden shrink-0" id="sidebar-panel">
          
          {/* Scrollable controls and list body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin" id="sidebar-scrollable">
            
            {/* Theme & Search Settings Area */}
            <div className="space-y-4">
              <h2 className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#E63946] flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>SPATIAL EXTRACTOR</span>
              </h2>

              {/* Region Grid Selection */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/50">대상 지역 필터</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {REGIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => {
                        setSelectedRegion(r);
                        setCustomKeyword("");
                        setMapCenter({ lat: r.lat, lng: r.lng });
                        setMapZoom(13);
                        fetchPlaces(r.value, selectedTheme.suffix, "");
                      }}
                      className={`text-xs text-left py-2 px-3 border transition-all duration-200 ${
                        selectedRegion.value === r.value && !customKeyword
                          ? "bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold"
                          : "bg-transparent text-[#1A1A1A] border-[#1A1A1A]/10 hover:border-[#1A1A1A]/40"
                      }`}
                    >
                      {r.label.split(" ")[1]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Predefined Themes */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/50">주간 핫토픽 트렌드</span>
                <div className="flex flex-col gap-1.5">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.label}
                      onClick={() => {
                        setSelectedTheme(theme);
                        setCustomKeyword("");
                        fetchPlaces(selectedRegion.value, theme.suffix, "");
                      }}
                      className={`text-xs text-left py-2 px-3 border flex items-center justify-between transition-all duration-200 ${
                        selectedTheme.label === theme.label && !customKeyword
                          ? "bg-[#FCFAF7] border-[#1A1A1A] text-[#1A1A1A] font-bold shadow-xs border-l-4 border-l-[#E63946]"
                          : "bg-transparent text-[#1A1A1A]/70 border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
                      }`}
                    >
                      <span className="font-serif italic text-sm">{theme.label}</span>
                      <span className="text-[9px] uppercase tracking-widest opacity-50">Select</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/50">키워드 직접 분석</span>
                  <span className="text-[9px] font-mono text-[#E63946]">Priority</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="예: 망원동 디저트, 서귀포 맛집"
                    value={customKeyword}
                    onChange={(e) => setCustomKeyword(e.target.value)}
                    className="w-full text-xs bg-transparent border border-[#1A1A1A]/20 py-2.5 pl-8 pr-3 text-[#1A1A1A] placeholder-[#1A1A1A]/30 focus:outline-none focus:border-[#1A1A1A] transition-all"
                  />
                  <MapPin className="w-3.5 h-3.5 text-[#1A1A1A]/40 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Search Trigger Button */}
              <button
                onClick={handleSearch}
                disabled={loading}
                className={`w-full py-3 px-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  loading
                    ? "bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : "bg-[#1A1A1A] text-[#FCFAF7] hover:bg-[#E63946] active:scale-98"
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Extract Locations</span>
                  </>
                )}
              </button>
            </div>

            {/* Error & Success Message Alerts */}
            {(successMsg || errorMsg) && (
              <div className={`p-4 border text-xs leading-relaxed ${
                errorMsg 
                  ? "bg-[#E63946]/5 border-[#E63946]/20 text-[#E63946]" 
                  : "bg-emerald-50 border-emerald-100 text-emerald-800"
              }`}>
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">{errorMsg ? "알림" : "완료"}</p>
                    <p className="mt-0.5 opacity-90 text-[11px]">{errorMsg || successMsg}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading detailed micro steps */}
            {loading && (
              <div className="bg-[#1A1A1A] text-[#FCFAF7] p-5 space-y-4 border border-[#1A1A1A]/20">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border border-white border-t-transparent animate-spin shrink-0"></div>
                  <span className="text-[10px] uppercase tracking-widest font-mono">Geo-Extraction Running</span>
                </div>
                <div className="h-0.5 bg-white/10 overflow-hidden">
                  <div 
                    className="h-full bg-[#E63946] transition-all duration-1000 ease-out"
                    style={{ width: `${(loadingStep + 1) * 25}%` }}
                  ></div>
                </div>
                <div className="space-y-1.5">
                  {loadingSteps.map((step, idx) => (
                    <div 
                      key={idx} 
                      className={`text-[10px] leading-relaxed transition-all duration-300 ${
                        idx === loadingStep 
                          ? "text-[#E63946] font-bold" 
                          : idx < loadingStep 
                          ? "opacity-40 line-through" 
                          : "opacity-20"
                      }`}
                    >
                      <span className="mr-1">{idx < loadingStep ? "✓" : idx === loadingStep ? "▶" : "○"}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Local Category Inline Filters */}
            {!loading && places.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/40 block">LOCAL CATEGORY FILTERS</span>
                <div className="flex flex-wrap gap-1">
                  {(["all", "restaurant", "cafe", "spot", "culture"] as const).map((cat) => {
                    const isActive = activeCategory === cat;
                    const label = cat === "all" ? "전체" : cat === "restaurant" ? "식당" : cat === "cafe" ? "카페" : cat === "spot" ? "명소" : "문화";
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setActiveCategory(cat);
                          if (selectedPlace && cat !== "all" && selectedPlace.category !== cat) {
                            setSelectedPlace(null);
                          }
                        }}
                        className={`text-[10px] py-1 px-2.5 border transition-all duration-150 ${
                          isActive
                            ? "bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold"
                            : "bg-transparent text-[#1A1A1A]/60 border-[#1A1A1A]/10 hover:border-[#1A1A1A]/40 hover:text-[#1A1A1A]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List of articles */}
            {!loading && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-1.5">
                  <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#E63946]">
                    SPATIAL DIGEST ({filteredPlaces.length})
                  </span>
                  <span className="text-[10px] font-mono opacity-50">LATEST INTEL</span>
                </div>

                {filteredPlaces.length === 0 ? (
                  <div className="text-center py-10 space-y-2 border border-dashed border-[#1A1A1A]/10 p-4">
                    <p className="text-sm font-serif italic text-[#1A1A1A]/60">No matching places found</p>
                    <p className="text-[10px] text-[#1A1A1A]/40">
                      다른 테마나 카테고리를 선택해 장소를 필터링해 보세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {filteredPlaces.map((place, index) => {
                      const isSelected = selectedPlace?.id === place.id;
                      return (
                        <div
                          key={place.id}
                          onClick={() => setSelectedPlace(place)}
                          className={`group cursor-pointer text-left pb-4 border-b border-[#1A1A1A]/5 transition-opacity ${
                            isSelected ? "opacity-100" : "opacity-70 hover:opacity-100"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono opacity-50 mb-1.5">
                            <span>0{index + 1} / {place.category.toUpperCase()}</span>
                            <span>{place.publishDate}</span>
                          </div>
                          
                          <h3 className={`text-xl font-serif leading-tight text-[#1A1A1A] group-hover:underline underline-offset-4 ${
                            isSelected ? "font-bold underline" : ""
                          }`}>
                            {place.name}
                          </h3>
                          
                          <p className="text-xs font-sans mt-2 text-[#1A1A1A]/80 line-clamp-2 leading-relaxed">
                            {place.newsSummary}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-3 text-[9px] font-bold tracking-tighter uppercase">
                            <span className={`px-2 py-0.5 border ${getCategoryThemeClass(place.category)}`}>
                              {getCategoryLabel(place.category)}
                            </span>
                            <span className="opacity-40">{place.address.split(" ")[1] || "Seoul"}</span>
                            <span className="opacity-40 italic font-serif">Signature: {place.menuSummary.split(",")[0]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Stats Footer on Left Sidebar matching design HTML */}
          <div className="p-6 bg-[#1A1A1A] text-[#FCFAF7] shrink-0 border-t border-[#FCFAF7]/10">
            <div className="flex justify-between items-center">
              <div className="text-4xl font-serif italic font-black text-white">{places.length}</div>
              <div className="text-[9px] uppercase tracking-widest text-right leading-relaxed opacity-70">
                Locations<br/>Extracted Today
              </div>
            </div>
          </div>

        </aside>

        {/* Right Section: Interactive Map Grid (Vibrant canvas styled container) */}
        <section className="flex-1 bg-[#F0EEEB] relative overflow-hidden flex flex-col md:flex-row h-full min-h-0" id="map-and-details-panel">
          
          {/* Subtle Grid Backdrop for Editorial Cartography style */}
          <div className="absolute inset-0 opacity-15 pointer-events-none z-0" style={{ backgroundImage: "radial-gradient(#1A1A1A 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }}></div>
          
          {/* Map Viewer */}
          <div className="flex-1 h-full p-4 sm:p-6 z-10 relative flex flex-col min-h-[350px] md:min-h-0" id="map-wrapper">
            <div className="w-full h-full border border-[#1A1A1A]/20 relative bg-[#FCFAF7]/60 backdrop-blur-xs">
              <MapContainer
                places={filteredPlaces}
                selectedPlace={selectedPlace}
                onSelectPlace={(place) => setSelectedPlace(place)}
                center={mapCenter}
                zoom={mapZoom}
              />
            </div>
            
            {/* Overlay Indicator */}
            <div className="absolute bottom-10 left-10 transform -rotate-90 origin-left hidden lg:block select-none pointer-events-none">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#1A1A1A]/40">Interactive Cartography</p>
            </div>
          </div>

          {/* Exquisite Museum Guide Details Panel */}
          {selectedPlace && (
            <div className="w-full md:w-[340px] bg-[#FCFAF7] border-t md:border-t-0 md:border-l border-[#1A1A1A]/10 p-6 flex flex-col justify-between gap-6 shrink-0 h-auto md:h-full overflow-y-auto z-20 relative shadow-xl md:shadow-none" id="details-block">
              
              <div className="space-y-5">
                {/* Header info */}
                <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]/10">
                  <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border ${getCategoryThemeClass(selectedPlace.category)}`}>
                    {getCategoryLabel(selectedPlace.category)}
                  </span>
                  <button 
                    onClick={() => setSelectedPlace(null)}
                    className="text-[#1A1A1A]/40 hover:text-[#1A1A1A] p-1 text-[10px] uppercase font-bold tracking-wider"
                  >
                    [ Close ]
                  </button>
                </div>

                {/* Main Name & Signature */}
                <div className="space-y-1">
                  <p className="text-[10px] font-mono opacity-50 uppercase">Featured Location</p>
                  <h2 className="text-2xl font-serif font-black tracking-tight text-[#1A1A1A] leading-tight">
                    {selectedPlace.name}
                  </h2>
                  <p className="text-xs font-serif italic text-[#E63946] font-medium">
                    ✨ 시그니처 메뉴: {selectedPlace.menuSummary}
                  </p>
                </div>

                {/* Real-time coordinates */}
                <div className="py-2 px-3 bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 rounded-sm font-mono text-[9px] text-[#1A1A1A]/70 flex justify-between">
                  <span>LAT: {selectedPlace.latitude.toFixed(4)}</span>
                  <span>LNG: {selectedPlace.longitude.toFixed(4)}</span>
                </div>

                {/* Editorial Address Card */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/50 block">공식 등록 주소</span>
                  <div className="border border-[#1A1A1A]/10 p-3 bg-[#FCFAF7] space-y-2">
                    <p className="text-xs font-sans text-[#1A1A1A]/80 leading-relaxed font-medium">
                      {selectedPlace.address}
                    </p>
                    <button
                      onClick={() => handleCopyAddress(selectedPlace.address)}
                      className="w-full py-1.5 px-3 border border-[#1A1A1A]/20 hover:border-[#1A1A1A] bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      {copiedAddress ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 opacity-60" />
                          <span>Copy Address</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Grounded News Coverage */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/50 block">언론 보도 분석</span>
                  <div className="bg-[#E63946]/5 border-l-2 border-l-[#E63946] p-4 space-y-2">
                    <h4 className="text-xs font-bold font-serif text-[#1A1A1A] leading-snug">
                      "{selectedPlace.newsTitle}"
                    </h4>
                    <p className="text-[11px] text-[#1A1A1A]/80 leading-relaxed font-sans">
                      {selectedPlace.newsSummary}
                    </p>
                  </div>
                </div>

              </div>

              {/* News Outlink Action & Naver Map Navigation */}
              <div className="pt-4 border-t border-[#1A1A1A]/10 space-y-2.5">
                <a
                  href={`https://map.naver.com/v5/search/${encodeURIComponent(selectedPlace.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#03C75A] hover:bg-[#02b350] text-white text-xs font-bold py-3 px-4 text-center tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm rounded-sm"
                >
                  <span>네이버 지도에서 위치 확인</span>
                  <MapPin className="w-3.5 h-3.5" />
                </a>

                <a
                  href={selectedPlace.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full border border-[#1A1A1A]/20 hover:border-[#1A1A1A] bg-transparent text-[#1A1A1A] text-xs font-bold uppercase py-2.5 px-4 text-center tracking-widest flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <span>원문 기사 읽기</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-[9px] text-[#1A1A1A]/50 text-center leading-normal">
                  본 정보는 공신 언론 보도를 기반으로 추출되었으며, 네이버 지도 검색 및 원문 기사로 상세 확인이 가능합니다.
                </p>
              </div>

            </div>
          )}

        </section>
      </main>

      {/* 3. Bottom Ticker (The perfect marquee visual layout from design HTML) */}
      <footer className="h-12 bg-[#1A1A1A] text-white flex items-center px-6 sm:px-10 gap-8 overflow-hidden shrink-0 z-40 select-none" id="app-footer">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap text-[#E63946] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E63946] animate-ping inline-block mr-1"></span>
          Breaking Spatial Data:
        </div>
        <div className="flex gap-12 text-[11px] font-serif italic whitespace-nowrap opacity-80 animate-marquee hover:pause overflow-x-auto scrollbar-none scroll-smooth">
          <span>* 성수동 골목 및 복합문화공간 보도 언급량 전주 대비 240% 이상 가파른 급증세 기록 중</span>
          <span>* 부산 영도·광안리 중심 미식 축제 기사 배포 확대 및 해안 상권 인지도 고조</span>
          <span>* 강원 양양 서피비치 서핑 문화 보도 증폭 및 트렌드 포토 스팟 부상</span>
          <span>* 제주 구좌읍 중심 베이커리 핫스팟 소셜 미디어 인산인해 분석 수립</span>
        </div>
      </footer>

    </div>
  );
}
