export interface UserProfile {
  id: string;
  name: string;
  location: string;
  services: StreamingService[];
  groupCode: string | null;
  createdAt: string;
}

export type StreamingServiceId =
  | 'netflix' | 'hulu' | 'disney-plus' | 'hbo-max'
  | 'amazon-prime' | 'apple-tv-plus' | 'peacock' | 'paramount-plus';

export interface StreamingService {
  id: StreamingServiceId;
  name: string;
  watchmodeSourceId: number;
  color: string;
  logo: string;
}

export interface Group {
  code: string;
  members: GroupMember[];
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  name: string;
  services: StreamingService[];
}

export interface SwipeSession {
  /**
   * Client-generated identifier used to upsert into swipe session history.
   * Optional for backward compatibility with legacy localStorage entries.
   */
  id?: string;
  createdAt?: string;
  groupCode: string;
  userId: string;
  votes: Record<string, Record<string, 'like' | 'skip'>>;
  filters: ContentFilters;
  currentMemberId: string;
}

export interface ContentFilters {
  genres: number[];
  contentType: 'movie' | 'tv_series' | 'all';
  minRating: number;
}

export interface WatchmodeTitle {
  id: number;
  title: string;
  year: number;
  imdb_id: string;
  tmdb_id: number;
  type: 'movie' | 'tv_series' | 'tv_miniseries' | 'tv_special';
  poster: string | null;
  backdrop: string | null;
  original_language: string;
  imdb_rating: number;
  genre_names: string[];
  us_rating: string;
  plot_overview: string;
  trailer: string | null;
  trailer_thumbnail: string | null;
  relevance_percentile: number;
  sources: WatchmodeSource[];
}

export interface WatchmodeSource {
  source_id: number;
  name: string;
  type: string;
  region: string;
  web_url: string;
  android_url: string;
  ios_url: string;
  format: string;
  price: number | null;
  seasons: number | null;
  episodes: number | null;
}

export interface WatchmodeListResponse {
  titles: WatchmodeListTitle[];
  page: number;
  total_pages: number;
  total_results: number;
}

export interface WatchmodeListTitle {
  id: number;
  title: string;
  year: number;
  imdb_id: string;
  tmdb_id: number;
  type: string;
  relevance_percentile: number;
}

export interface WatchmodeGenre {
  id: number;
  name: string;
}

export interface AppState {
  profile: UserProfile | null;
  group: Group | null;
  session: SwipeSession | null;
  titles: WatchmodeTitle[];
  matches: WatchmodeTitle[];
  isLoading: boolean;
  error: string | null;
}
