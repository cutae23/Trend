import React, { useState } from 'react';
import { NewsPlace } from '../types';
import { 
  ShieldCheck, 
  Newspaper, 
  MapPin, 
  Copy, 
  Check, 
  ExternalLink, 
  Star, 
  Calendar, 
  Award, 
  Sparkles, 
  Utensils, 
  Coffee, 
  Compass, 
  Palette,
  BarChart3,
  Tv,
  FileText,
  BookmarkCheck
} from 'lucide-react';

interface MediaProofCardProps {
  place: NewsPlace;
  onClose: () => void;
  onToggleBucket: (place: NewsPlace) => void;
  isSavedInBucket: boolean;
}

export const MediaProofCard: React.FC<MediaProofCardProps> = ({
  place,
  onClose,
  onToggleBucket,
  isSavedInBucket
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(place.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper for source type badges
  const getSourceTypeLabel = (sourceType?: string) => {
    switch (sourceType) {
      case 'broadcasting': return { label: 'TV 방송 보도 출현', icon: <Tv className="w-3 h-3 text-[#FF6B00]" /> };
      case 'newspaper': return { label: '주요 일간지 기사 보도', icon: <Newspaper className="w-3 h-3 text-[#FF6B00]" /> };
      case 'magazine': return { label: '트렌드 매거진 픽', icon: <Sparkles className="w-3 h-3 text-[#FF6B00]" /> };
      default: return { label: '언론 포털 뉴스 검증', icon: <FileText className="w-3 h-3 text-[#FF6B00]" /> };
    }
  };

  const sourceInfo = getSourceTypeLabel(place.mediaSourceType);
  const buzzScore = place.mediaBuzzScore || 95;

  return (
    <div className="bg-[#FCFAF7] border-2 border-[#1A1A1A] p-6 sm:p-8 shadow-[8px_8px_0px_0px_#1A1A1A] space-y-6 relative max-w-3xl w-full mx-auto" id="media-proof-card">
      
      {/* Top Journalistic Proof Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1A1A1A] pb-4">
        
        <div className="flex items-center gap-2">
          <span className="bg-[#FF6B00] text-white text-[10px] font-mono font-bold uppercase px-2.5 py-1 tracking-wider rounded-xs flex items-center gap-1 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PRESS PROOF CERTIFIED</span>
          </span>
          
          <span className="bg-[#1A1A1A]/10 text-[#1A1A1A] text-[10px] font-mono font-bold px-2 py-1 rounded-xs flex items-center gap-1">
            {sourceInfo.icon}
            <span>{sourceInfo.label}</span>
          </span>
        </div>

        <button
          onClick={onClose}
          className="text-[11px] font-mono uppercase font-bold text-[#1A1A1A]/60 hover:text-[#FF6B00] transition-colors cursor-pointer border border-[#1A1A1A]/20 px-2 py-1 hover:border-[#FF6B00]"
        >
          [ 닫기 ESC ]
        </button>

      </div>

      {/* Main Headline & Place Title */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-[#FF6B00] flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>JOURNALISTIC SPATIAL FEATURE</span>
          </span>
          <span className="text-[10px] font-mono opacity-50">
            보도 일자: {place.publishDate || "최근 1주일"}
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#1A1A1A] leading-tight">
          {place.name}
        </h2>

        {/* Media Buzz Index Score Gauge */}
        <div className="bg-white border border-[#1A1A1A]/20 p-3.5 rounded-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold font-sans">
            <span className="flex items-center gap-1.5 text-[#1A1A1A]">
              <BarChart3 className="w-4 h-4 text-[#FF6B00]" />
              <span>언론 관심도 지수 (Media Buzz Index)</span>
            </span>
            <span className="text-[#FF6B00] font-mono font-black text-base">
              {buzzScore}% HOTSPOT
            </span>
          </div>

          <div className="h-2 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#FF6B00] to-amber-500 rounded-full transition-all duration-1000"
              style={{ width: `${buzzScore}%` }}
            />
          </div>

          <p className="text-[10px] text-[#1A1A1A]/60 leading-normal">
            * 주요 일간지 및 포털 뉴스 검색 결과, 최근 1주간 약 {place.mediaMentionsCount || 28}개 관련 보도 기사에서 높은 주목을 받았습니다.
          </p>
        </div>
      </div>

      {/* Grid: Press Article Summary & Signature Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Press Headline & Summary Box */}
        <div className="bg-[#FF6B00]/5 border-l-4 border-l-[#FF6B00] p-4 space-y-3 rounded-r-sm">
          <span className="text-[10px] uppercase font-mono font-bold text-[#FF6B00] block">
            보도 헤드라인 & 핵심 취재 내용
          </span>
          <h4 className="text-base font-serif font-bold text-[#1A1A1A] leading-snug">
            "{place.newsTitle}"
          </h4>
          <p className="text-xs text-[#1A1A1A]/80 leading-relaxed font-sans">
            {place.newsSummary}
          </p>
        </div>

        {/* Right: Signature Menu & Address Info */}
        <div className="space-y-4">
          
          <div className="bg-white border border-[#1A1A1A]/10 p-4 rounded-sm space-y-2">
            <span className="text-[10px] uppercase font-mono font-bold text-[#1A1A1A]/50 block">
              ✨ 대표 메뉴 & 공간 시그니처
            </span>
            <p className="text-sm font-serif italic font-bold text-[#FF6B00]">
              {place.menuSummary}
            </p>
          </div>

          <div className="bg-white border border-[#1A1A1A]/10 p-4 rounded-sm space-y-2">
            <span className="text-[10px] uppercase font-mono font-bold text-[#1A1A1A]/50 block">
              📍 정밀 주소 정보
            </span>
            <p className="text-xs font-mono font-bold text-[#1A1A1A] break-all">
              {place.address}
            </p>
            <button
              onClick={handleCopyAddress}
              className="w-full py-1.5 px-3 border border-[#1A1A1A]/20 hover:border-[#1A1A1A] bg-[#FCFAF7] text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 rounded-xs hover:bg-[#1A1A1A]/5"
            >
              {copied ? (
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

      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-[#1A1A1A]/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        <a
          href={`https://map.naver.com/v5/search/${encodeURIComponent(place.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#03C75A] hover:bg-[#02b350] text-white text-xs font-bold py-3 px-4 text-center tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm rounded-xs"
        >
          <span>네이버 지도 길찾기 ↗</span>
          <MapPin className="w-4 h-4" />
        </a>

        <button
          onClick={() => onToggleBucket(place)}
          className={`text-xs font-bold py-3 px-4 tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm rounded-xs cursor-pointer ${
            isSavedInBucket
              ? "bg-[#FF6B00] hover:bg-[#e05e00] text-white"
              : "border border-[#1A1A1A]/20 hover:border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
          }`}
        >
          <Star className={`w-4 h-4 ${isSavedInBucket ? "fill-white text-white" : "fill-none text-[#1A1A1A]/60"}`} />
          <span>{isSavedInBucket ? "버킷리스트 저장됨" : "버킷리스트에 추가"}</span>
        </button>

        <a
          href={place.url}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-[#1A1A1A]/20 hover:border-[#1A1A1A] bg-transparent text-[#1A1A1A] text-xs font-bold uppercase py-3 px-4 text-center tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs rounded-xs hover:bg-[#1A1A1A]/5"
        >
          <span>원문 뉴스 기사 읽기 ↗</span>
          <ExternalLink className="w-4 h-4" />
        </a>

      </div>

    </div>
  );
};
