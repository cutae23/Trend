import React from 'react';
import { Newspaper, Sparkles, TrendingUp } from 'lucide-react';

export const NewsTicker: React.FC = () => {
  const tickerItems = [
    "🔥 [속보] 최근 7일간 주요 일간지 보도 맛집 언급량 전주 대비 210% 급증",
    "📺 [TV 방송] 생방송투데이 & 생활의 달인 방영 맛집 실시간 좌표 매핑 완료",
    "📍 [성수·용산] 카페 및 디저트 베이커리 핫스팟 언론 취재 열기 고조",
    "🌊 [부산·제주] 해안가 핫플레이스 및 미식 다이닝 기사 보도 지수 상위 등극",
    "✨ [100% 검증] 대가성 협찬 블로그 광고 자동 필터링 적용 완료"
  ];

  return (
    <div className="bg-[#1A1A1A] text-white border-b border-[#333333] px-4 py-2 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-[#FF6B00] font-bold shrink-0 bg-[#FF6B00]/10 px-2 py-0.5 rounded-xs border border-[#FF6B00]/30">
          <TrendingUp className="w-3.5 h-3.5 animate-pulse" />
          <span className="uppercase tracking-wider">LIVE MEDIA INTEL</span>
        </div>

        <div className="overflow-hidden relative flex-1">
          <div className="whitespace-nowrap animate-marquee flex gap-8 text-[#FCFAF7]/90 font-serif italic text-xs">
            {tickerItems.map((item, idx) => (
              <span key={idx} className="hover:text-[#FF6B00] transition-colors cursor-default">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
