import React, { useState } from 'react';
import { ShieldCheck, Newspaper, Sparkles, X, Check, ArrowRight, Zap, Award, Compass, BarChart3 } from 'lucide-react';

export const DifferentiatorBanner: React.FC = () => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  return (
    <>
      {/* Top Value Proposition Banner */}
      <div className="bg-[#1A1A1A] text-white border-b border-[#333333] px-4 sm:px-8 py-3 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Main Differentiator Tagline */}
          <div className="flex items-center gap-3">
            <span className="bg-[#FF6B00] text-white text-[10px] font-black uppercase px-2 py-1 tracking-wider rounded-xs flex items-center gap-1 shrink-0 animate-pulse">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% PRESS VERIFIED</span>
            </span>
            <p className="text-xs sm:text-sm font-sans font-medium text-[#FCFAF7] leading-tight">
              <strong className="text-[#FF6B00] font-bold">광고성 협찬 블로그 0%!</strong> 최근 7일간 주요 일간지 및 방송 뉴스에 실제 보도된 핫플레이스만 AI가 검증 매핑합니다.
            </p>
          </div>

          {/* Action Button & Quick Pills */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono opacity-80 border-r border-white/20 pr-4">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                협찬 광고 필터링
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                언론 보도 원문 제공
              </span>
            </div>

            <button
              onClick={() => setShowDetailModal(true)}
              className="bg-[#FCFAF7]/10 hover:bg-[#FF6B00] text-white border border-white/20 hover:border-[#FF6B00] text-[11px] font-bold py-1.5 px-3 transition-all rounded-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>일반 맛집 앱과 차별점 보기</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>

      {/* Comparison Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="bg-[#FCFAF7] text-[#1A1A1A] border-2 border-[#1A1A1A] max-w-2xl w-full p-6 sm:p-8 space-y-6 relative shadow-[8px_8px_0px_0px_#1A1A1A]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#1A1A1A]/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-[0.2em] text-[#FF6B00] block mb-1">
                  CORE DIFFERENTIATOR ANALYSIS
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#1A1A1A]">
                  왜 <span className="text-[#FF6B00] underline decoration-[#FF6B00]/30">Trended</span> 인가?
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-[#1A1A1A]/10 rounded-xs transition-colors cursor-pointer"
              >
                <X className="w-6 h-6 text-[#1A1A1A]" />
              </button>
            </div>

            {/* Introductory Text */}
            <p className="text-xs sm:text-sm text-[#1A1A1A]/80 leading-relaxed font-sans">
              기존의 지도·맛집 추천 서비스는 대가성 협찬 블로그 리뷰나 포인트를 노린 광고성 포스팅에 의존하는 경우가 많습니다. <strong>Trended</strong>는 신뢰할 수 있는 <strong>언론 보도 및 뉴스 빅데이터</strong>만을 공간 지능 AI로 실시간 추출하여 진짜 트렌드를 제공합니다.
            </p>

            {/* Comparison Table / Grid */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/50 block">
                비교 분석 표 (COMPARISON MATRIX)
              </span>

              <div className="border border-[#1A1A1A] divide-y divide-[#1A1A1A]/10 text-xs">
                
                {/* Header Row */}
                <div className="grid grid-cols-12 bg-[#1A1A1A] text-white p-3 font-bold font-mono">
                  <div className="col-span-4">구분 항목</div>
                  <div className="col-span-4 text-slate-300">일반 블로그/리뷰 앱</div>
                  <div className="col-span-4 text-[#FF6B00] flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>Trended AI</span>
                  </div>
                </div>

                {/* Row 1 */}
                <div className="grid grid-cols-12 p-3 items-center bg-white">
                  <div className="col-span-4 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>추천 출처 신뢰도</span>
                  </div>
                  <div className="col-span-4 text-[#1A1A1A]/60">
                    대가성 블로그 협찬, SNS 광고 포스팅 혼재
                  </div>
                  <div className="col-span-4 font-bold text-[#FF6B00] bg-[#FF6B00]/5 p-1.5 rounded-xs border border-[#FF6B00]/20">
                    ✓ 공신 언론 보도 & 신문/방송 100% 검증
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-12 p-3 items-center bg-[#FCFAF7]">
                  <div className="col-span-4 font-bold flex items-center gap-1.5">
                    <Newspaper className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>트렌드 신선도</span>
                  </div>
                  <div className="col-span-4 text-[#1A1A1A]/60">
                    오래된 누적 리뷰, 폐업 매장 방치 위험
                  </div>
                  <div className="col-span-4 font-bold text-[#1A1A1A] bg-[#1A1A1A]/5 p-1.5 rounded-xs">
                    ✓ 최근 7일 이내 타임스탬프 뉴스 실시간 수집
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-12 p-3 items-center bg-white">
                  <div className="col-span-4 font-bold flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>추천 이유 맥락</span>
                  </div>
                  <div className="col-span-4 text-[#1A1A1A]/60">
                    단순 별점(★) 및 짧은 감상평
                  </div>
                  <div className="col-span-4 font-bold text-[#1A1A1A] bg-[#1A1A1A]/5 p-1.5 rounded-xs">
                    ✓ 기자/저널리스트의 보도 기사 요약 헤드라인
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-12 p-3 items-center bg-[#FCFAF7]">
                  <div className="col-span-4 font-bold flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>위치 연동성</span>
                  </div>
                  <div className="col-span-4 text-[#1A1A1A]/60">
                    자체 주소 데이터 사용, 경로 검색 제한
                  </div>
                  <div className="col-span-4 font-bold text-[#03C75A] bg-emerald-50 p-1.5 rounded-xs border border-emerald-200">
                    ✓ 네이버 지도 길찾기 1초 즉시 연결
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Call to Action */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="bg-[#1A1A1A] hover:bg-[#FF6B00] text-white font-bold py-2.5 px-6 text-xs uppercase tracking-wider transition-colors rounded-xs cursor-pointer"
              >
                확인하고 뉴스 핫플 탐색하기
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
