import { useState, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  Sparkles, 
  ExternalLink, 
  RefreshCw, 
  Star, 
  Trash2, 
  ShieldCheck, 
  Map as MapIcon, 
  FileText,
  Key,
  X,
  SlidersHorizontal
} from "lucide-react";
import { NewsPlace, CategoryFilter } from "./types";
import { MapView } from "./components/MapView";
import { MediaProofCard } from "./components/MediaProofCard";

// Popular instant search chips
const QUICK_CHIPS = [
  { label: "🎤 K-POP 성지", query: "K-POP 광야 서울" },
  { label: "✨ 애니메이션 성지", query: "홍대 애니메이트" },
  { label: "📍 서울 성수", query: "서울 성수동" },
  { label: "🍿 팝업스토어", query: "성수동 팝업스토어" },
  { label: "🎂 아이돌 생일카페", query: "홍대 생일카페" },
  { label: "📍 부산 광안리", query: "부산 광안리" },
  { label: "📍 제주 애월", query: "제주 애월읍" },
  { label: "📍 전주 한옥마을", query: "전주 한옥마을" }
];

export default function App() {
  const [places, setPlaces] = useState<NewsPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NewsPlace | null>(null);
  const [rightViewMode, setRightViewMode] = useState<"map" | "proof_card">("map");

  // Main single search input
  const [searchQuery, setSearchQuery] = useState("");

  // Optional API Key state (hidden by default)
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem("locus_gemini_api_key") || "");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(geminiApiKey);

  // Bucket list (Saved places)
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
        const formattedDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
        return [...prev, { ...place, addedAt: formattedDate }];
      }
    });
  };

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showProofModal, setShowProofModal] = useState(false);
  const [geminiWorking, setGeminiWorking] = useState<boolean | null>(null);
  const [geminiStatusMsg, setGeminiStatusMsg] = useState<string>("");

  // Map state
  const [mapCenter, setMapCenter] = useState({ lat: 37.5450, lng: 127.0420 });
  const [mapZoom, setMapZoom] = useState(13);

  // Initial state is idle (no automatic search)
  useEffect(() => {
    // Idle on initial load
  }, []);

  const handleSearch = async (overrideQuery?: string) => {
    const targetQuery = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
    if (!targetQuery) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/news-places", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Gemini-Key": geminiApiKey || ""
        },
        body: JSON.stringify({
          region: targetQuery,
          query: targetQuery,
          customApiKey: geminiApiKey
        })
      });

      if (!response.ok) throw new Error("서버 응답 오류가 발생했습니다.");

      const data = await response.json();
      if (data.geminiWorking !== undefined) {
        setGeminiWorking(data.geminiWorking);
        setGeminiStatusMsg(data.geminiMessage || "");
      }

      if (data.success && data.places && data.places.length > 0) {
        setPlaces(data.places);
        setSelectedPlace(data.places[0]);

        const avgLat = data.places.reduce((sum: number, p: NewsPlace) => sum + p.latitude, 0) / data.places.length;
        const avgLng = data.places.reduce((sum: number, p: NewsPlace) => sum + p.longitude, 0) / data.places.length;
        setMapCenter({ lat: avgLat, lng: avgLng });
        setMapZoom(13);
        setActiveTab("search");
      } else {
        throw new Error("해당 지역의 보도검증 장소를 찾지 못했습니다.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "장소 탐색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    const trimmed = tempApiKey.trim();
    if (trimmed) {
      localStorage.setItem("locus_gemini_api_key", trimmed);
      setGeminiApiKey(trimmed);
    } else {
      localStorage.removeItem("locus_gemini_api_key");
      setGeminiApiKey("");
    }
    setShowKeyModal(false);
    // Auto re-search with the updated key
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  return (
    <div className="flex flex-col h-screen bg-[#FCFAF7] text-[#1A1A1A] font-sans overflow-hidden">
      
      {/* 1. Insanely Simple Header Bar */}
      <header className="bg-white border-b border-[#1A1A1A]/10 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FF6B00] text-white font-serif font-black text-xl flex items-center justify-center border-2 border-[#1A1A1A] rounded-xs shadow-[2px_2px_0px_0px_#1A1A1A]">
            T
          </div>
          <div>
            <h1 className="text-xl font-serif font-black text-[#1A1A1A] tracking-tight">
              Trended<span className="text-[#FF6B00]">.</span>
            </h1>
            <p className="text-[9px] font-mono font-bold text-[#FF6B00] uppercase tracking-wider hidden sm:block">
              100% PRESS VERIFIED
            </p>
          </div>
        </div>

        {/* Central Single Search Input Bar */}
        <div className="flex-1 max-w-xl relative">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="지역 또는 주제 검색 (예: K-POP 광야, 아이돌 생일카페, 홍대 애니메이트, 성수 팝업)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="w-full bg-[#FCFAF7] border-2 border-[#1A1A1A] py-2 pl-9 pr-20 text-xs font-bold text-[#1A1A1A] focus:outline-none focus:border-[#FF6B00] shadow-[3px_3px_0px_0px_#1A1A1A] rounded-xs transition-all"
            />
            <Search className="w-4 h-4 text-[#FF6B00] absolute left-3" />
            
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="absolute right-1 top-1 bottom-1 bg-[#1A1A1A] hover:bg-[#FF6B00] text-white text-[11px] font-bold px-3 transition-colors cursor-pointer rounded-xs flex items-center gap-1"
            >
              {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>검색</span>}
            </button>
          </div>
        </div>

        {/* Optional Settings / Api Key Modal trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyModal(true)}
            className="p-2 border border-[#1A1A1A]/15 hover:border-[#1A1A1A] bg-[#FCFAF7] text-[10px] font-mono font-bold text-[#1A1A1A]/70 hover:text-[#1A1A1A] rounded-xs transition-all flex items-center gap-1"
            title="Gemini API 설정 (선택 사항)"
          >
            <Key className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span className="hidden md:inline">{geminiApiKey ? "API 키 적용됨" : "설정"}</span>
          </button>
        </div>

      </header>

      {/* Quick Search Chips Row */}
      <div className="bg-[#1A1A1A] text-white px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs shrink-0 select-none">
        <span className="text-[10px] font-mono text-[#FF6B00] font-bold shrink-0 uppercase tracking-wider">
          FAST HOTSPOTS:
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => {
                setSearchQuery(chip.query);
                handleSearch(chip.query);
              }}
              className="bg-white/10 hover:bg-[#FF6B00] text-white text-[11px] font-medium py-0.5 px-2.5 rounded-xs transition-colors whitespace-nowrap cursor-pointer border border-white/10"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Two-Column Clean Layout */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-100px)]">
        
        {/* Left List Pane */}
        <aside className="w-full md:w-[380px] border-b md:border-b-0 md:border-r border-[#1A1A1A]/10 bg-[#FCFAF7] flex flex-col h-full shrink-0">
          
          {/* Simple Tab Header */}
          <div className="grid grid-cols-2 bg-white border-b border-[#1A1A1A]/10 p-1.5 gap-1 shrink-0">
            <button
              onClick={() => setActiveTab("search")}
              className={`py-2 text-xs font-bold uppercase transition-all rounded-xs cursor-pointer ${
                activeTab === "search"
                  ? "bg-[#1A1A1A] text-white shadow-2xs"
                  : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              }`}
            >
              보도 검증 장소 ({places.length})
            </button>

            <button
              onClick={() => setActiveTab("bucket")}
              className={`py-2 text-xs font-bold uppercase transition-all rounded-xs cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "bucket"
                  ? "bg-[#FF6B00] text-white shadow-2xs"
                  : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>저장목록 ({bucketList.length})</span>
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            
            {loading && (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-[#FF6B00] animate-spin mx-auto" />
                <p className="text-xs font-serif italic text-[#1A1A1A]/70">
                  언론 보도 검증 기사 실시간 매핑 중...
                </p>
              </div>
            )}

            {errorMsg && !loading && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center justify-between gap-2">
                <span>{errorMsg}</span>
                <button
                  onClick={() => setShowKeyModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 rounded-xs text-[10px] shrink-0"
                >
                  API Key 입력
                </button>
              </div>
            )}

            {geminiWorking === false && !loading && (
              <div className="bg-[#FCFAF7] border border-[#1A1A1A]/15 p-2.5 rounded-xs flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-[#FF6B00] shrink-0"></span>
                  <p className="text-[#1A1A1A]/90 text-[11px] font-medium truncate">
                    스마트 로컬 검색 모드 작동 중 (개인 Gemini API Key 등록 시 실시간 AI 뉴스 연동 탐색)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTempApiKey(geminiApiKey);
                    setShowKeyModal(true);
                  }}
                  className="bg-[#1A1A1A] hover:bg-[#FF6B00] text-white font-bold text-[10px] px-2.5 py-1 rounded-xs shrink-0 transition-colors cursor-pointer whitespace-nowrap"
                >
                  API Key 등록
                </button>
              </div>
            )}

            {!loading && activeTab === "search" && (
              <div className="space-y-3">
                {places.length === 0 ? (
                  <div className="text-center py-12 px-4 border-2 border-dashed border-[#1A1A1A]/20 bg-white rounded-xs space-y-3">
                    <div className="w-10 h-10 bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 rounded-full flex items-center justify-center mx-auto">
                      <Search className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-serif font-black text-[#1A1A1A]">
                        검색어를 입력해보세요
                      </h4>
                      <p className="text-xs font-serif text-[#1A1A1A]/60 leading-relaxed">
                        상단 검색창에 원하시는 지역(예: 대전, 부산, 제주, 여수)이나 핫플레이스를 입력하시면 언론 검증 장소를 탐색합니다.
                      </p>
                    </div>
                  </div>
                ) : (
                  places.map((place, idx) => {
                  const isSelected = selectedPlace?.id === place.id;
                  const isSaved = bucketList.some(b => b.id === place.id);

                  return (
                    <div
                      key={place.id}
                      onClick={() => {
                        setSelectedPlace(place);
                        setMapCenter({ lat: place.latitude, lng: place.longitude });
                        setMapZoom(15);
                      }}
                      className={`p-3.5 border transition-all cursor-pointer rounded-xs space-y-2 ${
                        isSelected
                          ? "bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A]"
                          : "bg-white border-[#1A1A1A]/15 hover:border-[#1A1A1A]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="bg-[#FF6B00] text-white font-bold px-1.5 py-0.2 rounded-xs">
                          {place.category.toUpperCase()}
                        </span>
                        
                        <div className="flex items-center gap-1 text-[#1A1A1A]/60">
                          <span>{place.mediaBuzzScore || 95}% HOT</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBucketList(place);
                            }}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star className={`w-4 h-4 ${isSaved ? "fill-[#FF6B00] text-[#FF6B00]" : "text-[#1A1A1A]/30"}`} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-serif font-black text-[#1A1A1A]">
                        {place.name}
                      </h3>

                      <p className="text-xs font-serif italic text-[#1A1A1A]/80 line-clamp-2 leading-relaxed">
                        "{place.newsTitle}"
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-[#1A1A1A]/10 text-[10px] font-mono">
                        <span className="text-[#1A1A1A]/60 truncate max-w-[170px]">
                          📍 {place.address}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlace(place);
                            setMapCenter({ lat: place.latitude, lng: place.longitude });
                            setRightViewMode("proof_card");
                            setShowProofModal(true);
                          }}
                          className="bg-[#FF6B00] hover:bg-[#1A1A1A] text-white font-bold px-2 py-1 rounded-xs transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                        >
                          <span>증명서 보기 📜</span>
                        </button>
                      </div>
                    </div>
                  );
                })
                )}
              </div>
            )}

            {!loading && activeTab === "bucket" && (
              <div className="space-y-3">
                {bucketList.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-[#1A1A1A]/20 p-4 rounded-xs space-y-1">
                    <Star className="w-5 h-5 text-[#1A1A1A]/30 mx-auto" />
                    <p className="text-xs font-serif text-[#1A1A1A]/60">저장된 장소가 없습니다.</p>
                  </div>
                ) : (
                  bucketList.map((place) => (
                    <div
                      key={place.id}
                      onClick={() => {
                        setSelectedPlace(place);
                        setMapCenter({ lat: place.latitude, lng: place.longitude });
                        setMapZoom(15);
                      }}
                      className="p-3 bg-white border border-[#1A1A1A]/15 hover:border-[#1A1A1A] cursor-pointer rounded-xs space-y-1"
                    >
                      <div className="flex justify-between items-center text-[9px] font-mono text-[#1A1A1A]/50">
                        <span>★ {place.addedAt || "저장됨"}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBucketList(place);
                          }}
                          className="text-red-500 hover:scale-110 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="text-sm font-serif font-bold text-[#1A1A1A]">{place.name}</h4>
                      <p className="text-[10px] text-[#1A1A1A]/60 truncate">{place.address}</p>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

        </aside>

        {/* Right Map & Details View Pane */}
        <section className="flex-1 bg-[#FCFAF7] relative flex flex-col h-full overflow-hidden">
          
          {/* Top Toggle Mode Bar */}
          <div className="bg-white border-b border-[#1A1A1A]/10 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRightViewMode("map")}
                className={`text-xs font-bold py-1 px-3 rounded-xs border transition-all cursor-pointer flex items-center gap-1 ${
                  rightViewMode === "map"
                    ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                    : "bg-transparent text-[#1A1A1A]/60 border-[#1A1A1A]/15"
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>지도</span>
              </button>

              <button
                onClick={() => setRightViewMode("proof_card")}
                className={`text-xs font-bold py-1 px-3 rounded-xs border transition-all cursor-pointer flex items-center gap-1 ${
                  rightViewMode === "proof_card"
                    ? "bg-[#FF6B00] text-white border-[#FF6B00]"
                    : "bg-transparent text-[#1A1A1A]/60 border-[#1A1A1A]/15"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>언론 보도 증명서</span>
              </button>
            </div>

            {selectedPlace && (
              <span className="text-xs font-serif font-bold text-[#1A1A1A] truncate max-w-[200px]">
                {selectedPlace.name}
              </span>
            )}
          </div>

          {/* View Container */}
          <div className="flex-1 relative overflow-hidden">
            {rightViewMode === "map" ? (
              <MapView
                places={places}
                selectedPlace={selectedPlace}
                onSelectPlace={(p) => setSelectedPlace(p)}
                onViewProofCard={(p) => {
                  setSelectedPlace(p);
                  setRightViewMode("proof_card");
                  setShowProofModal(true);
                }}
                mapCenter={mapCenter}
                mapZoom={mapZoom}
                onToggleBucket={toggleBucketList}
                bucketList={bucketList}
              />
            ) : selectedPlace ? (
              <div className="p-4 sm:p-6 overflow-y-auto h-full">
                <MediaProofCard
                  place={selectedPlace}
                  onClose={() => setRightViewMode("map")}
                  onToggleBucket={toggleBucketList}
                  isSavedInBucket={bucketList.some(b => b.id === selectedPlace.id)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs font-serif italic text-[#1A1A1A]/50">
                장소를 선택하면 언론 보도 증명서가 출력됩니다.
              </div>
            )}
          </div>

        </section>

      </main>

      {/* Press Proof Certificate Full Modal Overlay */}
      {showProofModal && selectedPlace && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto relative my-auto">
            <MediaProofCard
              place={selectedPlace}
              onClose={() => setShowProofModal(false)}
              onToggleBucket={toggleBucketList}
              isSavedInBucket={bucketList.some(b => b.id === selectedPlace.id)}
            />
          </div>
        </div>
      )}

      {/* Optional API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#1A1A1A] p-6 max-w-md w-full space-y-4 shadow-[6px_6px_0px_0px_#1A1A1A] relative">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-3">
              <h3 className="text-base font-serif font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <Key className="w-4 h-4 text-[#FF6B00]" />
                <span>Gemini API Key 설정 (선택 사항)</span>
              </h3>
              <button onClick={() => setShowKeyModal(false)} className="p-1 hover:bg-[#1A1A1A]/5 cursor-pointer">
                <X className="w-5 h-5 text-[#1A1A1A]" />
              </button>
            </div>

            <div className="bg-[#FCFAF7] p-3.5 border border-[#1A1A1A]/10 rounded-xs space-y-2">
              <p className="text-xs text-[#1A1A1A]/85 leading-relaxed font-sans">
                ⚠️ <strong>Gemini API가 작동하지 않는 경우:</strong><br />
                Google AI Studio에서 무료로 발급받은 개인 Gemini API Key를 등록하시면 실시간 언론 보도검증 핫플레이스 탐색 기능이 즉시 100% 정상 작동합니다.
              </p>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B00] hover:underline"
              >
                <span>Google AI Studio 무료 API Key 발급받기 ↗</span>
              </a>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono font-bold text-[#1A1A1A]/60">
                개인 Gemini API Key (선택 입력)
              </label>
              <input
                type="password"
                placeholder="AIzaSy... 키 입력"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="w-full text-xs bg-[#FCFAF7] border border-[#1A1A1A]/20 py-2 px-3 font-mono focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setTempApiKey("");
                  localStorage.removeItem("locus_gemini_api_key");
                  setGeminiApiKey("");
                  setShowKeyModal(false);
                }}
                className="px-3 py-1.5 border border-[#1A1A1A]/20 text-xs font-bold text-[#1A1A1A]"
              >
                초기화
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-1.5 bg-[#1A1A1A] text-white text-xs font-bold hover:bg-[#FF6B00]"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
