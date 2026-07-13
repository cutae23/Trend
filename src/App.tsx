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
  HelpCircle,
  Star,
  Trash2,
  Filter,
  ListFilter,
  Calendar
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
  
  // Gemini API Key state
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem("locus_gemini_api_key") || "");
  const [apiKeyInput, setApiKeyInput] = useState(localStorage.getItem("locus_gemini_api_key") || "");
  const [showKeyGuide, setShowKeyGuide] = useState(false);
  const [keySavedMessage, setKeySavedMessage] = useState("");

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (trimmed) {
      localStorage.setItem("locus_gemini_api_key", trimmed);
      setGeminiApiKey(trimmed);
      setKeySavedMessage("Gemini API Key가 성공적으로 저장되었습니다!");
    } else {
      localStorage.removeItem("locus_gemini_api_key");
      setGeminiApiKey("");
      setKeySavedMessage("API Key가 제거되어 기본 키를 사용합니다.");
    }
    setTimeout(() => setKeySavedMessage(""), 3000);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem("locus_gemini_api_key");
    setGeminiApiKey("");
    setApiKeyInput("");
    setKeySavedMessage("API Key가 성공적으로 해제되었습니다.");
    setTimeout(() => setKeySavedMessage(""), 3000);
  };

  // Search state
  const [selectedRegion, setSelectedRegion] = useState<RegionOption>(REGIONS[0]);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [customKeyword, setCustomKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  // Bucket list states and persistence
  const [activeTab, setActiveTab] = useState<"search" | "bucket">("search");
  const [bucketList, setBucketList] = useState<NewsPlace[]>(() => {
    const saved = localStorage.getItem("locus_bucket_list");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("locus_bucket_list", JSON.stringify(bucketList));
  }, [bucketList]);

  const toggleBucketList = (place: NewsPlace) => {
    setBucketList(prev => {
      const exists = prev.some(p => p.id === place.id);
      if (exists) {
        return prev.filter(p => p.id !== place.id);
      } else {
        const now = new Date();
        const formattedDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return [...prev, { ...place, addedAt: formattedDate }];
      }
    });
  };

  // Bucket list filter/grouping states
  const [bucketGroupBy, setBucketGroupBy] = useState<"category" | "region" | "date" | "none">("category");
  const [bucketCategoryFilter, setBucketCategoryFilter] = useState<CategoryFilter>("all");
  const [bucketSearchQuery, setBucketSearchQuery] = useState("");

  // Helper to extract clean region from address
  const getRegionFromAddress = (address: string) => {
    if (!address) return "기타";
    const cleanAddr = address.trim();
    const parts = cleanAddr.split(/\s+/);
    if (parts.length > 0) {
      const firstPart = parts[0];
      if (firstPart.startsWith("서울")) {
        const guPart = parts[1];
        if (guPart && (guPart.endsWith("구") || guPart.includes("구"))) {
          return `서울 ${guPart}`;
        }
        return "서울";
      }
      if (firstPart.startsWith("경기")) return "경기";
      if (firstPart.startsWith("인천")) return "인천";
      if (firstPart.startsWith("부산")) return "부산";
      if (firstPart.startsWith("제주")) return "제주";
      if (firstPart.startsWith("강원")) return "강원";
      if (firstPart.startsWith("충청") || firstPart.startsWith("충북") || firstPart.startsWith("충남")) return "충청";
      if (firstPart.startsWith("전라") || firstPart.startsWith("전북") || firstPart.startsWith("전남")) return "전라";
      if (firstPart.startsWith("경상") || firstPart.startsWith("경북") || firstPart.startsWith("경남")) return "경상";
      if (firstPart.startsWith("대구")) return "대구";
      if (firstPart.startsWith("대전")) return "대전";
      if (firstPart.startsWith("광주")) return "광주";
      if (firstPart.startsWith("울산")) return "울산";
      if (firstPart.startsWith("세종")) return "세종";
      return firstPart;
    }
    return "기타";
  };

  // Helper to extract date (YYYY.MM.DD) from addedAt
  const getDateFromAddedAt = (addedAt?: string) => {
    if (!addedAt) return "기존 추가됨";
    return addedAt.split(" ")[0]; // returns YYYY.MM.DD
  };

  // Filter bucket list items first
  const getFilteredBucketList = () => {
    return bucketList.filter(place => {
      // Category filter
      if (bucketCategoryFilter !== "all" && place.category !== bucketCategoryFilter) {
        return false;
      }
      // Search query filter
      if (bucketSearchQuery.trim()) {
        const query = bucketSearchQuery.toLowerCase();
        return (
          place.name.toLowerCase().includes(query) ||
          place.address.toLowerCase().includes(query) ||
          place.menuSummary.toLowerCase().includes(query) ||
          place.newsTitle.toLowerCase().includes(query)
        );
      }
      return true;
    });
  };

  const renderBucketItem = (place: NewsPlace, index: number) => {
    const isSelected = selectedPlace?.id === place.id;
    return (
      <div
        key={place.id}
        onClick={() => {
          setSelectedPlace(place);
          setMapCenter({ lat: place.latitude, lng: place.longitude });
          setMapZoom(15);
        }}
        className={`group cursor-pointer text-left pb-3 border-b border-[#1A1A1A]/5 transition-opacity ${
          isSelected ? "opacity-100" : "opacity-75 hover:opacity-100"
        }`}
      >
        <div className="flex items-center justify-between text-[9px] font-mono opacity-50 mb-1">
          <div className="flex items-center gap-1.5">
            <span>0{index + 1} / {place.category.toUpperCase()}</span>
            {place.addedAt && (
              <span className="bg-[#E63946]/10 text-[#E63946] px-1 py-0.5 rounded-xs font-bold text-[8px]">
                ★ {place.addedAt} 저장됨
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleBucketList(place);
            }}
            className="text-[#E63946] hover:scale-110 active:scale-95 transition-transform cursor-pointer p-0.5 bg-transparent border-none flex items-center justify-center"
            title="버킷리스트에서 제거"
          >
            <Trash2 className="w-3 h-3 hover:text-[#1A1A1A]" />
          </button>
        </div>

        <h4 className={`text-base font-serif leading-tight text-[#1A1A1A] group-hover:underline ${
          isSelected ? "font-bold underline" : ""
        }`}>
          {place.name}
        </h4>

        <p className="text-[11px] text-[#1A1A1A]/60 mt-1 truncate">
          {place.address}
        </p>

        <p className="text-[11px] font-serif italic text-[#1A1A1A]/70 mt-1 line-clamp-1">
          "{place.newsTitle}"
        </p>

        {/* Quick shortcuts with no OSM */}
        <div className="grid grid-cols-2 gap-1.5 mt-2.5">
          <a
            href={`https://map.naver.com/v5/search/${encodeURIComponent(place.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-center bg-[#03C75A] hover:bg-[#02b350] text-white text-[9px] font-bold py-1.5 px-1 transition-all rounded-xs flex items-center justify-center gap-1 shadow-xs"
          >
            <span>네이버 지도 ↗</span>
          </a>
          <a
            href={place.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-center border border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/5 text-[#1A1A1A] text-[9px] font-bold py-1 px-1 transition-all rounded-xs flex items-center justify-center gap-1"
          >
            <span>원문 기사 ↗</span>
          </a>
        </div>
      </div>
    );
  };
  
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

  // Set default map view to Seoul on mount without fetching places
  useEffect(() => {
    setMapCenter({ lat: REGIONS[0].lat, lng: REGIONS[0].lng });
    setMapZoom(13);
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
          category: activeCategory === "all" ? undefined : activeCategory,
          customApiKey: geminiApiKey
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
      case "restaurant": return <Utensils className="w-3 h-3 text-[#FF6B00]" />;
      case "cafe": return <Coffee className="w-3 h-3 text-[#1A1A1A]" />;
      case "spot": return <Compass className="w-3 h-3 text-[#1A1A1A]" />;
      case "culture": return <Palette className="w-3 h-3 text-[#FF6B00]" />;
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
      case "restaurant": return "bg-[#FF6B00] text-white border-[#FF6B00]";
      case "cafe": return "bg-[#1A1A1A] text-white border-[#1A1A1A]";
      case "spot": return "bg-transparent text-[#1A1A1A] border-[#1A1A1A]";
      case "culture": return "bg-transparent text-[#FF6B00] border-[#FF6B00]";
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
      
      {/* 1. Header (Trended Editorial layout) */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end px-6 sm:px-10 pt-6 pb-4 border-b border-[#1A1A1A]/10 bg-[#FCFAF7]" id="app-header">
        <div className="flex items-center gap-3">
          {/* Vivid Orange Icon */}
          <div className="w-10 h-10 bg-[#FF6B00] rounded-sm flex items-center justify-center text-white font-serif font-black text-2xl shadow-[3px_3px_0px_0px_#1A1A1A] border-2 border-[#1A1A1A]">
            T
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-serif font-black tracking-tighter leading-none text-[#1A1A1A]">
              Trended<span className="italic font-light text-[#FF6B00]">.</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold mt-1 text-[#1A1A1A]/60">
              The Weekly Spatial Intelligence Report & Hotspots
            </p>
          </div>
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
            
            {/* Gemini API Key Configuration Section */}
            <div className="bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 p-4 space-y-3 rounded-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>GEMINI API 설정</span>
                </h3>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-xs ${geminiApiKey ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-[#1A1A1A]/10 text-[#1A1A1A]/60"}`}>
                  {geminiApiKey ? "ACTIVE (사용자)" : "SYSTEM (데모)"}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-[#1A1A1A]/60">Gemini API Key 입력</label>
                  <button 
                    onClick={() => setShowKeyGuide(!showKeyGuide)}
                    className="text-[9px] text-[#FF6B00] font-bold hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>키 발급 방법</span>
                  </button>
                </div>

                {showKeyGuide && (
                  <div className="text-[10px] text-[#1A1A1A]/70 bg-white p-2.5 border border-[#1A1A1A]/10 space-y-1 leading-relaxed rounded-xs">
                    <p className="font-bold text-[#FF6B00]">발급 방법:</p>
                    <p>1. <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-[#1A1A1A] hover:text-[#FF6B00]">Google AI Studio ↗</a>에 로그인합니다.</p>
                    <p>2. <strong>'Create API Key'</strong> 또는 <strong>'Get API key'</strong>를 눌러 무료 키를 생성합니다.</p>
                    <p>3. 생성된 키(AIzaSy...)를 아래 칸에 붙여넣고 [저장]을 누르세요.</p>
                  </div>
                )}

                <div className="flex gap-1">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="flex-1 text-xs bg-white border border-[#1A1A1A]/20 py-2 px-2.5 text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-all font-mono"
                  />
                  <button
                    onClick={handleSaveApiKey}
                    className="bg-[#1A1A1A] text-white hover:bg-[#FF6B00] text-xs font-bold px-3 py-2 transition-colors cursor-pointer rounded-xs"
                  >
                    저장
                  </button>
                  {geminiApiKey && (
                    <button
                      onClick={handleClearApiKey}
                      className="border border-[#1A1A1A]/20 hover:border-[#1A1A1A] text-[#1A1A1A] text-[10px] font-bold px-2 py-2 transition-colors cursor-pointer rounded-xs"
                    >
                      해제
                    </button>
                  )}
                </div>

                {keySavedMessage && (
                  <p className="text-[10px] text-emerald-700 font-bold mt-1 bg-emerald-50 py-1 px-2 border border-emerald-100 rounded-xs">
                    ✓ {keySavedMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Theme & Search Settings Area */}
            <div className="space-y-4">
              <h2 className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#FF6B00] flex items-center gap-1.5">
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
                    placeholder="예: 망원동 디저트, 서귀포 맛집 (입력 후 Enter)"
                    value={customKeyword}
                    onChange={(e) => setCustomKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    className="w-full text-xs bg-transparent border border-[#1A1A1A]/20 py-2.5 pl-8 pr-3 text-[#1A1A1A] placeholder-[#1A1A1A]/30 focus:outline-none focus:border-[#1A1A1A] transition-all"
                  />
                  <MapPin className="w-3.5 h-3.5 text-[#1A1A1A]/40 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Clickable Keyword Suggestions */}
              <div className="space-y-1.5 pt-0.5">
                <span className="text-[9px] uppercase tracking-wider font-bold text-[#1A1A1A]/40 block">추천 키워드 (클릭하여 키워드 설정)</span>
                <div className="flex flex-wrap gap-1">
                  {["소금빵", "흑돼지", "우동", "밀락더마켓", "서피비치", "흑임자라떼", "복국", "팝업스토어"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setCustomKeyword(tag);
                      }}
                      className="text-[10px] bg-white hover:bg-[#1A1A1A]/5 text-[#1A1A1A]/80 hover:text-[#1A1A1A] py-1 px-2 border border-[#1A1A1A]/10 rounded-sm transition-all cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Trigger Button */}
              <button
                onClick={handleSearch}
                disabled={loading}
                className={`w-full py-3 px-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  loading
                    ? "bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : "bg-[#1A1A1A] text-[#FCFAF7] hover:bg-[#FF6B00] active:scale-98"
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
                  ? "bg-[#FF6B00]/5 border-[#FF6B00]/20 text-[#FF6B00]" 
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
                    className="h-full bg-[#FF6B00] transition-all duration-1000 ease-out"
                    style={{ width: `${(loadingStep + 1) * 25}%` }}
                  ></div>
                </div>
                <div className="space-y-1.5">
                  {loadingSteps.map((step, idx) => (
                    <div 
                      key={idx} 
                      className={`text-[10px] leading-relaxed transition-all duration-300 ${
                        idx === loadingStep 
                          ? "text-[#FF6B00] font-bold" 
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

            {/* Tab Selector */}
            {!loading && (
              <div className="grid grid-cols-2 border border-[#1A1A1A]/10 bg-white p-1 rounded-sm shadow-xs">
                <button
                  onClick={() => setActiveTab("search")}
                  className={`py-2 text-[11px] font-bold tracking-wider uppercase text-center transition-all rounded-xs cursor-pointer ${
                    activeTab === "search"
                      ? "bg-[#1A1A1A] text-white font-black"
                      : "bg-transparent text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                  }`}
                >
                  📡 실시간 탐색 ({places.length})
                </button>
                <button
                  onClick={() => setActiveTab("bucket")}
                  className={`py-2 text-[11px] font-bold tracking-wider uppercase text-center transition-all rounded-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "bucket"
                      ? "bg-[#FF6B00] text-white font-black"
                      : "bg-transparent text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${activeTab === "bucket" ? "fill-white text-white" : "fill-none text-[#1A1A1A]/60"}`} />
                  <span>내 버킷리스트 ({bucketList.length})</span>
                </button>
              </div>
            )}

            {/* Local Category Inline Filters */}
            {!loading && places.length > 0 && activeTab === "search" && (
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

            {/* List of articles - Search Tab */}
            {!loading && activeTab === "search" && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-1.5">
                  <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#FF6B00]">
                    SPATIAL DIGEST ({filteredPlaces.length})
                  </span>
                  <span className="text-[10px] font-mono opacity-50">LATEST INTEL</span>
                </div>

                {filteredPlaces.length === 0 ? (
                  <div className="text-center py-10 space-y-2 border border-dashed border-[#1A1A1A]/10 p-4">
                    <p className="text-sm font-serif italic text-[#1A1A1A]/60">
                      {places.length === 0 ? "No locations loaded yet" : "No matching places found"}
                    </p>
                    <p className="text-[10px] text-[#1A1A1A]/40">
                      {places.length === 0 
                        ? "지역 및 테마를 선택한 후 하단의 'Extract Locations' 버튼을 클릭하여 뉴스를 추출하세요." 
                        : "다른 테마나 카테고리를 선택해 장소를 필터링해 보세요."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {filteredPlaces.map((place, index) => {
                      const isSelected = selectedPlace?.id === place.id;
                      const isSaved = bucketList.some(b => b.id === place.id);
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
                            <div className="flex items-center gap-2">
                              <span>{place.publishDate}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBucketList(place);
                                }}
                                className="hover:scale-110 active:scale-95 transition-transform cursor-pointer p-0.5 bg-transparent border-none"
                                title={isSaved ? "버킷리스트에서 제거" : "버킷리스트에 추가"}
                              >
                                <Star className={`w-3.5 h-3.5 ${isSaved ? "fill-[#FF6B00] text-[#FF6B00]" : "fill-none text-[#1A1A1A]/40 hover:text-[#FF6B00]"}`} />
                              </button>
                            </div>
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

                          {/* Direct Quick Shortcuts */}
                          <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2.5 border-t border-[#1A1A1A]/10">
                            <a
                              href={`https://map.naver.com/v5/search/${encodeURIComponent(place.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-center bg-[#03C75A] hover:bg-[#02b350] text-white text-[10px] font-bold py-2 px-1 transition-all rounded-xs flex items-center justify-center gap-1 shadow-xs"
                            >
                              <span>네이버 지도 ↗</span>
                            </a>
                            <a
                              href={place.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-center border border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/5 text-[#1A1A1A] text-[10px] font-bold py-1.5 px-1 transition-all rounded-xs flex items-center justify-center gap-1"
                            >
                              <span>원문 기사 ↗</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bucket List Tab */}
            {!loading && activeTab === "bucket" && (
              <div className="space-y-5 pt-2">
                <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-1.5">
                  <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#FF6B00]">
                    MY BUCKET LIST ({bucketList.length})
                  </span>
                  <span className="text-[10px] font-mono opacity-50">SAVED HOTSPOTS</span>
                </div>

                {bucketList.length > 0 && (
                  <div className="space-y-3 pb-3 border-b border-[#1A1A1A]/10">
                    {/* Compact Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1A1A1A]/40" />
                      <input
                        type="text"
                        value={bucketSearchQuery}
                        onChange={(e) => setBucketSearchQuery(e.target.value)}
                        placeholder="저장된 핫플 이름, 주소, 메뉴 검색..."
                        className="w-full text-xs pl-8 pr-3 py-1.5 bg-[#1A1A1A]/5 hover:bg-[#1A1A1A]/8 focus:bg-white border border-transparent focus:border-[#1A1A1A]/20 rounded-xs transition-all focus:outline-none placeholder:text-[#1A1A1A]/30"
                      />
                    </div>

                    {/* Category Filter Pills */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A]/40 block">CATEGORY FILTER</span>
                      <div className="flex flex-wrap gap-1">
                        {(["all", "restaurant", "cafe", "spot", "culture"] as const).map((cat) => {
                          const count = bucketList.filter(p => cat === "all" || p.category === cat).length;
                          return (
                            <button
                              key={cat}
                              onClick={() => setBucketCategoryFilter(cat)}
                              className={`px-2 py-1 text-[9px] font-bold tracking-wider uppercase transition-all rounded-xs cursor-pointer border ${
                                bucketCategoryFilter === cat
                                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                                  : "bg-transparent text-[#1A1A1A]/60 border-[#1A1A1A]/10 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
                              }`}
                            >
                              {cat === "all" ? "전체" : getCategoryLabel(cat)} ({count})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Grouping Options */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A]/40 block">GROUP BY (그룹 기준)</span>
                      <div className="grid grid-cols-4 gap-1 p-0.5 bg-[#1A1A1A]/5 rounded-xs border border-[#1A1A1A]/10">
                        {(["none", "category", "region", "date"] as const).map((groupType) => {
                          const label = {
                            none: "없음 (최신)",
                            category: "분류별",
                            region: "지역별",
                            date: "저장일별",
                          }[groupType];
                          return (
                            <button
                              key={groupType}
                              onClick={() => setBucketGroupBy(groupType)}
                              className={`py-1 text-[9px] font-bold tracking-tight text-center rounded-xs transition-all cursor-pointer ${
                                bucketGroupBy === groupType
                                  ? "bg-white text-[#1A1A1A] shadow-xs font-black border border-[#1A1A1A]/10"
                                  : "bg-transparent text-[#1A1A1A]/50 hover:text-[#1A1A1A] border border-transparent"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {bucketList.length === 0 ? (
                  <div className="text-center py-12 space-y-3 border border-dashed border-[#1A1A1A]/10 p-4 bg-[#1A1A1A]/2 rounded-sm">
                    <Star className="w-8 h-8 mx-auto text-[#1A1A1A]/20 animate-pulse" />
                    <p className="text-xs font-serif italic text-[#1A1A1A]/60">가고 싶은 곳이 비어 있습니다.</p>
                    <p className="text-[10px] text-[#1A1A1A]/40 leading-relaxed">
                      실시간 탐색 결과에서 핫플 카드의 별(⭐)을 눌러 나중에 방문할 버킷리스트 장소로 저장해 보세요!
                    </p>
                  </div>
                ) : getFilteredBucketList().length === 0 ? (
                  <div className="text-center py-12 space-y-3 p-4 bg-[#1A1A1A]/2 rounded-sm border border-[#1A1A1A]/5">
                    <p className="text-xs font-serif italic text-[#1A1A1A]/60">검색 또는 필터 결과가 없습니다.</p>
                    <p className="text-[10px] text-[#1A1A1A]/40">필터 기준을 바꾸거나 검색어를 지워보세요.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      const filteredList = getFilteredBucketList();

                      // 1. No Grouping (none)
                      if (bucketGroupBy === "none") {
                        // Reverse chronological order (newest added first)
                        const sorted = [...filteredList].reverse();
                        return (
                          <div className="space-y-4">
                            {sorted.map((place, index) => renderBucketItem(place, index))}
                          </div>
                        );
                      }

                      // 2. Group by Category
                      if (bucketGroupBy === "category") {
                        return (["restaurant", "cafe", "spot", "culture"] as const).map((cat) => {
                          const catPlaces = filteredList.filter(p => p.category === cat);
                          if (catPlaces.length === 0) return null;

                          return (
                            <div key={cat} className="space-y-3">
                              <div className="flex items-center gap-1.5 border-b border-[#1A1A1A]/10 pb-1 bg-[#1A1A1A]/5 px-2 py-1 rounded-xs">
                                {getCategoryIcon(cat)}
                                <span className="text-[11px] font-bold text-[#1A1A1A] tracking-wider uppercase">
                                  {getCategoryLabel(cat)} ({catPlaces.length})
                                </span>
                              </div>
                              <div className="space-y-4">
                                {catPlaces.map((place, index) => renderBucketItem(place, index))}
                              </div>
                            </div>
                          );
                        });
                      }

                      // 3. Group by Region
                      if (bucketGroupBy === "region") {
                        const regionsMap = new Map<string, NewsPlace[]>();
                        filteredList.forEach(place => {
                          const region = getRegionFromAddress(place.address);
                          if (!regionsMap.has(region)) {
                            regionsMap.set(region, []);
                          }
                          regionsMap.get(region)!.push(place);
                        });

                        const sortedRegions = Array.from(regionsMap.keys()).sort();

                        return sortedRegions.map((region) => {
                          const regionPlaces = regionsMap.get(region)!;
                          return (
                            <div key={region} className="space-y-3">
                              <div className="flex items-center gap-1.5 border-b border-[#1A1A1A]/10 pb-1 bg-[#1A1A1A]/5 px-2 py-1 rounded-xs">
                                <MapPin className="w-3.5 h-3.5 text-[#FF6B00]" />
                                <span className="text-[11px] font-bold text-[#1A1A1A] tracking-wider uppercase">
                                  {region} 지역 ({regionPlaces.length})
                                </span>
                              </div>
                              <div className="space-y-4">
                                {regionPlaces.map((place, index) => renderBucketItem(place, index))}
                              </div>
                            </div>
                          );
                        });
                      }

                      // 4. Group by Date
                      if (bucketGroupBy === "date") {
                        const datesMap = new Map<string, NewsPlace[]>();
                        filteredList.forEach(place => {
                          const date = getDateFromAddedAt(place.addedAt);
                          if (!datesMap.has(date)) {
                            datesMap.set(date, []);
                          }
                          datesMap.get(date)!.push(place);
                        });

                        // Sort dates descending (newest dates first)
                        const sortedDates = Array.from(datesMap.keys()).sort((a, b) => b.localeCompare(a));

                        return sortedDates.map((date) => {
                          const datePlaces = datesMap.get(date)!;
                          return (
                            <div key={date} className="space-y-3">
                              <div className="flex items-center gap-1.5 border-b border-[#1A1A1A]/10 pb-1 bg-[#1A1A1A]/5 px-2 py-1 rounded-xs">
                                <Calendar className="w-3.5 h-3.5 text-[#FF6B00]" />
                                <span className="text-[11px] font-bold text-[#1A1A1A] tracking-wider uppercase">
                                  {date} 저장 ({datePlaces.length})
                                </span>
                              </div>
                              <div className="space-y-4">
                                {datePlaces.map((place, index) => renderBucketItem(place, index))}
                              </div>
                            </div>
                          );
                        });
                      }

                      return null;
                    })()}
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

        {/* Right Section: Interactive Editorial Board Panel & Map */}
        <section className="flex-1 bg-[#FCFAF7] relative overflow-hidden flex flex-col h-full min-h-0" id="editorial-details-panel">
          
          {/* 1. Interactive Naver Map Integration */}
          <div className="w-full h-[320px] sm:h-[40%] shrink-0 border-b border-[#1A1A1A]/10 relative z-20">
            <MapContainer
              places={activeTab === "search" ? filteredPlaces : getFilteredBucketList()}
              selectedPlace={selectedPlace}
              onSelectPlace={(place) => {
                setSelectedPlace(place);
                if (place) {
                  setMapCenter({ lat: place.latitude, lng: place.longitude });
                  setMapZoom(15);
                }
              }}
              center={mapCenter}
              zoom={mapZoom}
            />
          </div>

          {/* 2. Scrollable Detail Board or Cover Index */}
          <div className="flex-1 overflow-y-auto min-h-0 relative z-10 scrollbar-thin">
            {/* Subtle Grid Backdrop for Editorial style */}
            <div className="absolute inset-0 opacity-10 pointer-events-none z-0" style={{ backgroundImage: "radial-gradient(#1A1A1A 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }}></div>
            
            {selectedPlace ? (
              <div className="p-6 sm:p-12 z-10 relative flex flex-col justify-between max-w-4xl mx-auto w-full space-y-8" id="details-block">
              <div className="space-y-8">
                {/* Header/Category indicator */}
                <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 border ${getCategoryThemeClass(selectedPlace.category)}`}>
                      {getCategoryLabel(selectedPlace.category)}
                    </span>
                    <span className="text-[10px] font-mono text-[#1A1A1A]/50">LAT: {selectedPlace.latitude.toFixed(4)} • LNG: {selectedPlace.longitude.toFixed(4)}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedPlace(null)}
                    className="text-[#1A1A1A]/50 hover:text-[#FF6B00] p-1 text-[11px] uppercase font-bold tracking-wider hover:underline cursor-pointer"
                  >
                    [ 상세 닫기 ]
                  </button>
                </div>

                {/* Main Name & Signature */}
                <div className="space-y-3">
                  <span className="text-[11px] font-mono text-[#E63946] font-bold tracking-widest uppercase block">SELECTED TREND HOTSPOT</span>
                  <h2 className="text-4xl sm:text-5xl font-serif font-black tracking-tight text-[#1A1A1A] leading-tight">
                    {selectedPlace.name}
                  </h2>
                  <div className="inline-block bg-[#E63946]/5 border border-[#E63946]/10 px-4 py-2.5 rounded-sm">
                    <p className="text-sm font-serif italic text-[#E63946] font-bold">
                      ✨ 시그니처 메뉴/특징: {selectedPlace.menuSummary}
                    </p>
                  </div>
                </div>

                {/* Grid for Two Columns: Info & Media */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  {/* Left Column: Address & Details */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#1A1A1A]/50 block">공식 등록 주소</span>
                      <div className="border border-[#1A1A1A]/10 p-4 bg-white/50 backdrop-blur-xs space-y-3 rounded-sm">
                        <p className="text-sm font-sans text-[#1A1A1A]/80 leading-relaxed font-semibold">
                          {selectedPlace.address}
                        </p>
                        <button
                          onClick={() => handleCopyAddress(selectedPlace.address)}
                          className="w-full py-2 px-3 border border-[#1A1A1A]/20 hover:border-[#1A1A1A] bg-transparent text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 rounded-xs hover:bg-[#1A1A1A]/5"
                        >
                          {copiedAddress ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600">주소 복사 완료</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 opacity-60" />
                              <span>주소 복사하기</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#1A1A1A]/50 block">공간 분류 정보</span>
                      <div className="border border-[#1A1A1A]/10 p-4 bg-white/50 backdrop-blur-xs rounded-sm space-y-2 text-xs text-[#1A1A1A]/80">
                        <div className="flex justify-between pb-1.5 border-b border-[#1A1A1A]/5">
                          <span className="opacity-60">기사 발행일</span>
                          <span className="font-mono font-bold">{selectedPlace.publishDate || "최근 보도"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-60">추천 타겟층</span>
                          <span className="font-bold">2030 트렌드세터, 커플 데이트</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Media Analysis */}
                  <div className="space-y-2">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-[#1A1A1A]/50 block">언론 보도 심층 분석</span>
                    <div className="bg-[#FF6B00]/5 border-l-4 border-l-[#FF6B00] p-5 space-y-3 h-full rounded-r-sm">
                      <h4 className="text-sm font-bold font-serif text-[#1A1A1A] leading-snug">
                        "{selectedPlace.newsTitle}"
                      </h4>
                      <p className="text-xs text-[#1A1A1A]/80 leading-relaxed font-sans">
                        {selectedPlace.newsSummary}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div className="pt-6 border-t border-[#1A1A1A]/10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <a
                    href={`https://map.naver.com/v5/search/${encodeURIComponent(selectedPlace.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#03C75A] hover:bg-[#02b350] text-white text-xs font-bold py-3.5 px-4 text-center tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm rounded-sm"
                  >
                    <span>네이버 지도에서 위치 확인</span>
                    <MapPin className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => toggleBucketList(selectedPlace)}
                    className={`text-xs font-bold py-3.5 px-4 tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm rounded-sm cursor-pointer ${
                      bucketList.some(b => b.id === selectedPlace.id)
                        ? "bg-[#FF6B00] hover:bg-[#e05e00] text-white"
                        : "border border-[#1A1A1A]/20 hover:border-[#1A1A1A] hover:bg-[#1A1A1A]/5 bg-white text-[#1A1A1A]"
                    }`}
                  >
                    <Star className={`w-4 h-4 ${bucketList.some(b => b.id === selectedPlace.id) ? "fill-white text-white" : "fill-none text-[#1A1A1A]/60"}`} />
                    <span>
                      {bucketList.some(b => b.id === selectedPlace.id)
                        ? "버킷리스트에서 제거"
                        : "버킷리스트 추가"
                      }
                    </span>
                  </button>

                  <a
                    href={selectedPlace.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[#1A1A1A]/20 hover:border-[#1A1A1A] bg-transparent text-[#1A1A1A] text-xs font-bold uppercase py-3 px-4 text-center tracking-widest flex items-center justify-center gap-2 transition-all shadow-xs rounded-sm hover:bg-[#1A1A1A]/5"
                  >
                    <span>원문 기사 읽기</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-[10px] text-[#1A1A1A]/50 text-center mt-4 leading-normal">
                  본 정보는 공신 언론 보도를 기반으로 추출되었으며, 네이버 지도 연동 및 원문 기사로 상세 확인이 가능합니다.
                </p>
              </div>
            </div>
          ) : (
            /* Cover index style when no selectedPlace */
            <div className="flex-1 flex flex-col justify-center items-center p-8 text-center max-w-xl mx-auto space-y-6 z-10 relative">
              <div className="space-y-4">
                <div className="inline-block border border-[#1A1A1A] px-3 py-1 text-[10px] uppercase tracking-[0.25em] font-bold text-[#1A1A1A]">
                  Trended AI • 공간 탐색 지능
                </div>
                <h1 className="text-4xl sm:text-5xl font-serif font-black tracking-tight text-[#1A1A1A]">
                  TRENDED JOURNAL
                </h1>
                <p className="text-xs font-sans tracking-[0.15em] uppercase text-[#1A1A1A]/60 font-semibold">
                  NEWS-BASED SPATIAL DISCOVERY ENGINE
                </p>
              </div>

              <div className="h-px w-24 bg-[#1A1A1A]"></div>

              <p className="text-xs font-serif italic text-[#1A1A1A]/70 leading-relaxed">
                "언론 보도 빅데이터와 구글 실시간 뉴스 검색, 공간지능 AI 분석 기술을 결합하여 가치 있는 핫플레이스를 탐지하는 뉴스 미디어 기반 로컬 정보 가이드입니다."
              </p>

              <div className="border border-[#1A1A1A]/10 p-5 bg-[#FCFAF7]/80 rounded-sm w-full space-y-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B00] flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>이용 가이드</span>
                </p>
                <div className="text-[11px] text-[#1A1A1A]/70 space-y-2 text-left leading-relaxed">
                  <p className="flex gap-2">
                    <span className="font-mono font-bold text-[#1A1A1A]">1.</span>
                    <span>왼쪽 검색창에서 <strong>지역과 테마</strong>를 설정하여 탐색해 보세요.</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="font-mono font-bold text-[#1A1A1A]">2.</span>
                    <span>실시간 검색 결과 장소 목록에서 특정 핫플을 클릭하면 상세한 기사 분석 정보가 나타납니다.</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="font-mono font-bold text-[#1A1A1A]">3.</span>
                    <span>가고 싶은 장소는 <strong>별(★) 아이콘</strong>을 눌러 버킷리스트 탭에 저장하고 저장 날짜를 확인하세요.</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          </div>
        </section>
      </main>

      {/* 3. Bottom Ticker (The perfect marquee visual layout from design HTML) */}
      <footer className="h-12 bg-[#1A1A1A] text-white flex items-center px-6 sm:px-10 gap-8 overflow-hidden shrink-0 z-40 select-none" id="app-footer">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap text-[#FF6B00] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-ping inline-block mr-1"></span>
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
