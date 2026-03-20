import { StreamingService } from '@/types';

export const STREAMING_SERVICES: StreamingService[] = [
  { id: 'netflix', name: 'Netflix', watchmodeSourceId: 203, color: '#e50914', logo: '🎬' },
  { id: 'hulu', name: 'Hulu', watchmodeSourceId: 157, color: '#1ce783', logo: '📺' },
  { id: 'disney-plus', name: 'Disney+', watchmodeSourceId: 372, color: '#006e99', logo: '✨' },
  { id: 'hbo-max', name: 'Max', watchmodeSourceId: 387, color: '#5822b4', logo: '🎭' },
  { id: 'amazon-prime', name: 'Prime Video', watchmodeSourceId: 26, color: '#00a8e0', logo: '📦' },
  { id: 'apple-tv-plus', name: 'Apple TV+', watchmodeSourceId: 371, color: '#555555', logo: '🍎' },
  { id: 'peacock', name: 'Peacock', watchmodeSourceId: 384, color: '#e0712e', logo: '🦚' },
  { id: 'paramount-plus', name: 'Paramount+', watchmodeSourceId: 444, color: '#1d5aa0', logo: '⭐' },
];

export const GENRES: { id: number; name: string }[] = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 3, name: 'Animation' },
  { id: 4, name: 'Comedy' },
  { id: 5, name: 'Crime' },
  { id: 8, name: 'Drama' },
  { id: 9, name: 'Fantasy' },
  { id: 10, name: 'History' },
  { id: 11, name: 'Horror' },
  { id: 13, name: 'Mystery' },
  { id: 14, name: 'Romance' },
  { id: 15, name: 'Science Fiction' },
  { id: 18, name: 'Thriller' },
  { id: 19, name: 'War' },
  { id: 20, name: 'Western' },
];

export const REGIONS: { code: string; name: string }[] = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
];
