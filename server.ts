import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with API Key if available
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini SDK successfully initialized.");
  } catch (err) {
    console.error("Failed to initialize Gemini SDK:", err);
  }
} else {
  console.log("No GEMINI_API_KEY environment variable found. App will use high-quality simulated/cached news data.");
}

// Interface for extracted place data
interface NewsPlace {
  id: string;
  name: string;
  category: 'restaurant' | 'cafe' | 'spot' | 'culture';
  newsTitle: string;
  newsSummary: string;
  address: string;
  latitude: number;
  longitude: number;
  url: string;
  publishDate: string;
  menuSummary: string;
}

// High-quality simulated default data for various regions in Korea
const MOCK_NEWS_PLACES: Record<string, NewsPlace[]> = {
  "seoul": [
    {
      id: "s1",
      name: "자연도소금빵 성수점",
      category: "cafe",
      newsTitle: "성수동 줄 서는 빵집 '자연도소금빵', 하루 7천개 완판 신화의 비밀",
      newsSummary: "캐나다산 프리미엄 밀가루와 프랑스 버터를 사용하여 갓 구워낸 소금빵으로 SNS에서 큰 화제를 모으고 있는 성수동 대표 베이커리 핫플레이스입니다.",
      address: "서울특별시 성동구 연무장길 56-1",
      latitude: 37.5432,
      longitude: 127.0543,
      url: "https://search.naver.com/search.naver?query=자연도소금빵+성수",
      publishDate: "2026-07-05",
      menuSummary: "버터 풍미 가득한 소금빵 (4개 세트)"
    },
    {
      id: "s2",
      name: "우동 가조쿠",
      category: "restaurant",
      newsTitle: "생방송투데이 방영, 한양대생들이 줄 서서 먹는 생활의 달인 붓카케 우동",
      newsSummary: "직접 제면하는 생면의 쫄깃한 식감과 깊은 쯔유 국물 맛으로 유명한 정통 일본식 우동 전문점으로, 미식가들 사이에서 극찬을 받고 있습니다.",
      address: "서울특별시 성동구 왕십리로 215-1",
      latitude: 37.5587,
      longitude: 127.0422,
      url: "https://search.naver.com/search.naver?query=우동가조쿠+한양대",
      publishDate: "2026-07-03",
      menuSummary: "붓카케우동, 가조쿠우동, 돈카츠"
    },
    {
      id: "s3",
      name: "대림창고",
      category: "culture",
      newsTitle: "문화와 예술이 숨쉬는 복합문화공간, 성수 대림창고 갤러리 신규 전시 오픈",
      newsSummary: "정미소였던 붉은 벽돌 건물을 개조해 대형 예술 작품 전시와 하이엔드 스페셜티 커피를 동시에 즐길 수 있어 내외국인 관광객 모두에게 인기를 끌고 있습니다.",
      address: "서울특별시 성동구 성수이로 78",
      latitude: 37.5414,
      longitude: 127.0560,
      url: "https://search.naver.com/search.naver?query=성수+대림창고",
      publishDate: "2026-07-06",
      menuSummary: "스페셜티 드립커피, 크로플, 시그니처 아인슈페너"
    },
    {
      id: "s4",
      name: "카멜커피 7호점 (서울숲)",
      category: "cafe",
      newsTitle: "빈티지 감성의 정수 '카멜커피', 서울숲 골목길에 새 둥지... 대기 줄 끊이지 않아",
      newsSummary: "유럽 빈티지 인테리어와 시그니처 크림 커피인 '카멜커피'로 유명한 곳으로, 최근 서울숲 산책길 데이트 코스로 연일 인산인해를 이룹니다.",
      address: "서울특별시 성동구 서울숲2길 16-8",
      latitude: 37.5448,
      longitude: 127.0415,
      url: "https://search.naver.com/search.naver?query=카멜커피+서울숲",
      publishDate: "2026-07-04",
      menuSummary: "카멜커피, 미숫가루, 크로와상"
    },
    {
      id: "s5",
      name: "피치스 도원 (Peaches. D8NE)",
      category: "spot",
      newsTitle: "자동차 스트리트 문화의 성지 성수 피치스 도원, 글로벌 자동차 브랜드 협업 행사 성료",
      newsSummary: "스트리트 패션 브랜드 피치스가 만든 오프라인 거점으로 화려한 커스텀 차량들과 힙한 분위기, 젤라또 브랜드와의 협업 디저트로 성수 대표 랜드마크가 되었습니다.",
      address: "서울특별시 성동구 연무장15길 11",
      latitude: 37.5417,
      longitude: 127.0592,
      url: "https://search.naver.com/search.naver?query=피치스+도원",
      publishDate: "2026-07-07",
      menuSummary: "타이어 쉐이프 도넛, 이색 수제 버거"
    }
  ],
  "busan": [
    {
      id: "b1",
      name: "밀락더마켓",
      category: "culture",
      newsTitle: "부산 광안리의 새로운 복합문화공간 '밀락더마켓', 야경 보며 즐기는 푸드와 버스킹 축제",
      newsSummary: "수변공원 옆에 위치해 광안대교 오션뷰를 통유리로 감상하며 다양한 로컬 먹거리와 의류 팝업스토어, 야간 음악 라이브 공연을 함께 즐길 수 있는 핫플레이스입니다.",
      address: "부산광역시 수영구 민락수변로 17번길 56",
      latitude: 35.1557,
      longitude: 129.1332,
      url: "https://search.naver.com/search.naver?query=밀락더마켓",
      publishDate: "2026-07-08",
      menuSummary: "수제 맥주, 이색 도넛, 길거리 타코"
    },
    {
      id: "b2",
      name: "해운대 금수복국 본점",
      category: "restaurant",
      newsTitle: "50년 전통의 맛, 해운대 금수복국 '여름 보양 특별식' 출시로 문전성시",
      newsSummary: "한국 최초로 뚝배기 복국을 개발한 유서 깊은 맛집으로, 시원하고 맑은 국물의 까치복국은 부산을 찾는 전국의 미식가와 해장객들의 필수 코스입니다.",
      address: "부산광역시 해운대구 중동1로43번길 23",
      latitude: 35.1616,
      longitude: 129.1627,
      url: "https://search.naver.com/search.naver?query=금수복국+해운대",
      publishDate: "2026-07-02",
      menuSummary: "은복국, 까치복국, 복튀김, 복무침"
    },
    {
      id: "b3",
      name: "초량1941",
      category: "cafe",
      newsTitle: "부산 동구 산복도로의 숨은 보석 적산가옥 카페 '초량1941' 감성 여행지로 주목",
      newsSummary: "1941년에 지어진 근대식 주택을 감각적으로 개조한 우유 카페로, 부산 전경이 내려다보이는 산동네에서 정갈하고 깊은 맛의 수제 우유를 제공합니다.",
      address: "부산광역시 동구 망양로 533-5",
      latitude: 35.1207,
      longitude: 129.0305,
      url: "https://search.naver.com/search.naver?query=초량1941",
      publishDate: "2026-07-05",
      menuSummary: "바닐라 우유, 말차 우유, 홍차 우유, 타마고 산도"
    }
  ],
  "jeju": [
    {
      id: "j1",
      name: "숙성도 노형본관",
      category: "restaurant",
      newsTitle: "제주 대표 흑돼지 전문점 '숙성도', 720시간 교차 숙성 뼈등심으로 전국 식문화 리드",
      newsSummary: "제주도 하면 가장 먼저 손꼽히는 프리미엄 돼지고기 구이 전문점으로 특허받은 숙성 공법을 통한 극강의 육즙과 부드러운 육질로 상시 대기시간만 2시간 이상을 자랑합니다.",
      address: "제주특별자치도 제주시 원노형로 41",
      latitude: 33.4844,
      longitude: 126.4862,
      url: "https://search.naver.com/search.naver?query=숙성도+노형본관",
      publishDate: "2026-07-07",
      menuSummary: "960 숙성 뼈등심, 720 숙성 삼겹살"
    },
    {
      id: "j2",
      name: "카페 런던베이글뮤지엄 제주점",
      category: "cafe",
      newsTitle: "구좌 해안가에 들어선 '런던베이글뮤지엄 제주', 파란 바다를 배경으로 맛보는 소금 베이글",
      newsSummary: "서울 최고의 베이글 핫플이 제주 구좌읍 바닷가에 문을 열어, 이국적인 돌담 뷰와 멋진 바다를 배경으로 신선하고 쫄깃한 영국식 베이글을 즐길 수 있어 관광 필수 코스가 되었습니다.",
      address: "제주특별자치도 제주시 구좌읍 동복로 85",
      latitude: 33.5518,
      longitude: 126.7118,
      url: "https://search.naver.com/search.naver?query=런던베이글뮤지엄+제주",
      publishDate: "2026-07-06",
      menuSummary: "포테이토 치즈 베이글, 브릭레인 베이글"
    }
  ],
  "gangwon": [
    {
      id: "g1",
      name: "양양 서피비치 (SURFYY BEACH)",
      category: "spot",
      newsTitle: "해외 휴양지 감성 그대로... 양양 서피비치, 젊은 세대의 서핑 페스티벌 개최로 북새통",
      newsSummary: "서핑 전용 해변으로 이국적인 짚풀 파라솔, 비치바, 모래사장 위의 포토존이 어우러져 한국에서 가장 트렌디한 해변 휴양지로 매년 여름 뉴스 1면을 장식하고 있습니다.",
      address: "강원특별자치도 양양군 현북면 하조대해안길 119",
      latitude: 38.0267,
      longitude: 128.7183,
      url: "https://search.naver.com/search.naver?query=양양+서피비치",
      publishDate: "2026-07-08",
      menuSummary: "서피 시그니처 칵테일, 코로나 맥주, 비치 칠리 버거"
    },
    {
      id: "g2",
      name: "강릉 툇마루",
      category: "cafe",
      newsTitle: "강릉 커피 골목의 전설 '카페 툇마루', 흑임자라떼 원조 맛보려 전국에서 몰려들어",
      newsSummary: "쌉싸름한 에스프레소와 부드러운 우유, 고소한 흑임자 크림의 완벽한 밸런스로 '흑임자라떼' 트렌드를 이끈 강릉의 명실상부한 대표 카페입니다.",
      address: "강원특별자치도 강릉시 난설헌로 232",
      latitude: 37.7915,
      longitude: 128.9168,
      url: "https://search.naver.com/search.naver?query=강릉+툇마루",
      publishDate: "2026-07-04",
      menuSummary: "툇마루 커피 (흑임자라떼), 초당두부 케이크"
    }
  ]
};

// API Route to check if a system-level Gemini API key is configured
app.get("/api/config-status", (req, res) => {
  res.json({
    hasSystemKey: !!process.env.GEMINI_API_KEY
  });
});

// API Route to fetch places from news using Gemini Search Grounding
app.post("/api/news-places", async (req, res) => {
  const { query, region, category, customApiKey } = req.body;
  const clientApiKey = req.headers['x-gemini-key'] || customApiKey;
  
  console.log(`Received request: query='${query}', region='${region}', category='${category}', hasCustomKey=${!!clientApiKey}`);

  // Determine which active AI client instance to use
  let activeAi = ai;
  let isCustomClient = false;

  if (clientApiKey) {
    try {
      activeAi = new GoogleGenAI({
        apiKey: clientApiKey as string,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      isCustomClient = true;
      console.log("Using user-provided custom Gemini API Key for this request.");
    } catch (err) {
      console.error("Failed to initialize dynamic custom Gemini client:", err);
    }
  }

  // Define full prompt depending on inputs
  let searchQuery = "최근 1주간 대한민국 인기 뉴스 맛집";
  if (region) {
    searchQuery = `최근 1주간 ${region} 인기 뉴스 맛집 핫플레이스 여행지`;
  }
  if (query) {
    searchQuery = `최근 1주간 ${query} 인기 뉴스 장소 맛집 명소`;
  }
  if (category) {
    const categoryMap: Record<string, string> = {
      "restaurant": "맛집 요리 식당 미식",
      "cafe": "카페 빵집 디저트 베이커리",
      "spot": "인기 명소 포토존 핫플레이스 가볼만한곳",
      "culture": "전시 미술관 박물관 팝업스토어 복합문화공간"
    };
    searchQuery += ` (${categoryMap[category] || category})`;
  }

  // Fallback check
  const regionLower = (region || "").toLowerCase();
  const matchedKey = Object.keys(MOCK_NEWS_PLACES).find(key => regionLower.includes(key) || key.includes(regionLower));
  
  if (!activeAi) {
    console.log("Gemini SDK not initialized, returning mock/pre-cached data for:", region || query || "default");
    
    // Return high-quality mock data based on query matching
    let placesToReturn: NewsPlace[] = [];
    if (matchedKey && MOCK_NEWS_PLACES[matchedKey]) {
      placesToReturn = MOCK_NEWS_PLACES[matchedKey];
    } else {
      // Return a mixture of all mock data
      placesToReturn = Object.values(MOCK_NEWS_PLACES).flat().slice(0, 8);
    }
    
    return res.json({ 
      success: true, 
      source: "cached_simulation",
      places: placesToReturn,
      message: "Gemini API Key가 설정되지 않아 사전 수집된 인기 뉴스 매핑 데이터가 제공됩니다. (설정을 통해 활성화할 수 있습니다)"
    });
  }

  try {
    console.log(`Calling Gemini API (Search Grounding) with prompt: "${searchQuery}"${isCustomClient ? ' (Custom Key)' : ' (System Key)'}`);
    
    const prompt = `
      대한민국의 최근 1주간(현재 시점 2026년 7월경) 언론 및 뉴스 매체에서 큰 인기를 끌었거나 핫플레이스로 언급된 구체적인 장소(식당, 카페, 빵집, 복합문화공간, 관광명소 등)를 5개에서 최대 8개 추출해 주세요.
      
      반드시 다음 조건들을 지키며 검색 결과에 기반해 응답해 주세요:
      1. 반드시 실제로 존재하는 대한민국 내의 구체적인 매장 상호명이나 장소명이어야 합니다.
      2. 해당 장소가 언급된 구체적인 뉴스 보도 내용을 요약하여 'newsTitle'과 'newsSummary'에 적어주세요.
      3. 실제 해당 매장/장소의 한국 도로명 또는 지번 주소('address')를 구체적으로 작성해 주세요. (예: 서울특별시 성동구 연무장길 56-1)
      4. 해당 주소지의 정확한 위도('latitude')와 경도('longitude') 좌표값(예: 위도 37.xxxx, 경도 127.xxxx)을 정밀하게 계산 또는 추정해서 제공해 주세요. 지도에 실시간 마커로 배치할 것이므로 좌표가 한국 영토 내에 있어야 합니다.
      5. 'category'는 'restaurant' (음식점), 'cafe' (카페/빵집/디저트), 'spot' (관광지/포토존/해변 등 야외 명소), 'culture' (미술관/전시관/팝업스토어 등 실내 복합 문화공간) 중 하나로 분류해 주세요.
      6. 원래 뉴스 기사 출처 URL이나 네이버/구글 검색 결과를 확인할 수 있는 링크를 'url' 필드에 정확히 담아주세요.
      7. 대표 메뉴 또는 주요 특징을 'menuSummary'에 담아주세요.

      검색 키워드: ${searchQuery}
    `;

    const response = await activeAi.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional South Korean geographic data extractor. Your job is to search the web using googleSearch tool to find actual, highly-trending, newly featured hotspots or eateries in Korean news articles, extract their real addresses, look up or calculate their precise latitude and longitude, and map them to the structured JSON schema. Always answer in Korean. Return a valid JSON array of objects conforming to the provided schema.",
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of highly trending hotspots extracted from recent news",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Unique string id (e.g., place_1, place_2)" },
              name: { type: Type.STRING, description: "Name of the restaurant, cafe, or venue" },
              category: { 
                type: Type.STRING, 
                description: "Must be one of: 'restaurant', 'cafe', 'spot', 'culture'" 
              },
              newsTitle: { type: Type.STRING, description: "Real or highly relevant recent news headline mentioning this place" },
              newsSummary: { type: Type.STRING, description: "1-2 sentence summary of what the news article reported about this place" },
              address: { type: Type.STRING, description: "The full official South Korean address (Road-name or Jibun)" },
              latitude: { type: Type.NUMBER, description: "Latitude of the place in South Korea (between 33.0 and 39.0)" },
              longitude: { type: Type.NUMBER, description: "Longitude of the place in South Korea (between 124.0 and 132.0)" },
              url: { type: Type.STRING, description: "The exact news article URL, Naver Search URL, or source link" },
              publishDate: { type: Type.STRING, description: "Approximate news publication date (e.g. 2026-07-05)" },
              menuSummary: { type: Type.STRING, description: "Specialty, core menu, or featured items" }
            },
            required: ["id", "name", "category", "newsTitle", "newsSummary", "address", "latitude", "longitude", "url", "menuSummary"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    console.log("Raw Gemini API output received:", text.substring(0, 300) + "...");
    const places = JSON.parse(text.trim());

    // Extract grounding metadata to enrich links if needed
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    console.log(`Found ${chunks?.length || 0} grounding chunks from Google Search.`);

    // Map through parsed places to ensure they conform perfectly and have a valid URL if returned blank
    const processedPlaces = places.map((place: any, idx: number) => {
      // If URL is missing, invalid or empty, use a smart search fallback
      let finalUrl = place.url;
      if (!finalUrl || finalUrl.trim() === "" || finalUrl.includes("example.com")) {
        if (chunks && chunks[idx] && chunks[idx].web?.uri) {
          finalUrl = chunks[idx].web.uri;
        } else {
          finalUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(place.name + " " + place.address)}`;
        }
      }

      // Ensure Lat/Lng is in valid Korea bounds
      let lat = Number(place.latitude);
      let lng = Number(place.longitude);
      
      if (isNaN(lat) || lat < 33 || lat > 39) {
        lat = 37.5665; // Default Seoul
      }
      if (isNaN(lng) || lng < 124 || lng > 132) {
        lng = 126.9780; // Default Seoul
      }

      return {
        ...place,
        id: place.id || `gemini_${idx}_${Date.now()}`,
        latitude: lat,
        longitude: lng,
        url: finalUrl,
        publishDate: place.publishDate || "2026-07-08"
      };
    });

    res.json({
      success: true,
      source: "gemini_grounding_live",
      places: processedPlaces
    });

  } catch (error: any) {
    console.error("Error in news-places endpoint:", error);
    
    // Fallback to mock data on failure so the user gets a working app
    let backupPlaces: NewsPlace[] = [];
    if (matchedKey && MOCK_NEWS_PLACES[matchedKey]) {
      backupPlaces = MOCK_NEWS_PLACES[matchedKey];
    } else {
      backupPlaces = Object.values(MOCK_NEWS_PLACES).flat().slice(0, 8);
    }

    const errStr = String(error?.message || "") + JSON.stringify(error || {});
    const isQuotaError = errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota") || error?.status === 429;
    
    let userFriendlyMsg = `실시간 뉴스 추출 중 일시적인 지연이 발생하여, 사전 수집된 인기 핫플레이스 정보를 제공합니다. (오류: ${error?.message || "Unknown"})`;
    if (isQuotaError) {
      userFriendlyMsg = "⚠️ Gemini API 무료 할당량(Quota)이 만료되었습니다. 좌측 상단의 'GEMINI CORE CONFIG' 패널에 개인 API Key를 입력하시거나, AI Studio 'Secrets'에 새 GEMINI_API_KEY를 등록하시면 즉시 실시간 라이브 뉴스 검색이 활성화됩니다!";
    }

    res.json({
      success: true,
      source: "error_fallback_simulation",
      places: backupPlaces,
      message: userFriendlyMsg
    });
  }
});

// Serve static build in production, otherwise use Vite Dev Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static files from dist directory in production.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
  });
}

startServer();
