export interface NewsPlace {
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
  addedAt?: string;
  
  // Media Intelligence Differentiators
  mediaBuzzScore?: number; // 85~99% Media Buzz Score
  mediaSourceType?: 'broadcasting' | 'newspaper' | 'magazine' | 'portal';
  mediaMentionsCount?: number; // e.g. 24 mentions in major press
  verificationStatus?: 'verified_press' | 'editorial_pick';
}

export type CategoryFilter = 'all' | 'restaurant' | 'cafe' | 'spot' | 'culture';

export interface SearchFilters {
  query: string;
  region: string;
  category: CategoryFilter;
}

export interface RegionOption {
  value: string;
  label: string;
  lat: number;
  lng: number;
}

export interface FeatureComparisonItem {
  feature: string;
  standardApp: string;
  trendedApp: string;
  badgeText: string;
}
