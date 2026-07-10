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
