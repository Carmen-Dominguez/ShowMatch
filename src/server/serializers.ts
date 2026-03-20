import { Group, SwipeSession, WatchmodeTitle } from '@/types';

export type Vote = 'like' | 'skip';

export function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function serializeJson(value: unknown): string {
  return JSON.stringify(value);
}

export function ensureString(value: unknown): string {
  if (typeof value === 'string') return value;
  return String(value ?? '');
}

export interface SessionVotesResponse {
  votes: Record<string, Record<string, Vote>>;
}

export interface SessionDetailsResponse {
  id: string;
  groupCode: string;
  titleIds: number[];
  filters: SwipeSession['filters'];
  createdAt: string;
  votesByUserId: Record<string, Record<string, Vote>>;
}

export interface GroupDetailsResponse {
  code: string;
  createdAt: string;
  members: Group['members'];
}

export interface ProfileDataResponse {
  profileId: string;
  groups: Group[];
  sessions: Array<{
    id: string;
    groupCode: string;
    createdAt: string;
    titleIds: number[];
    filters: SwipeSession['filters'];
    votesByUserId: Record<string, Record<string, Vote>>;
  }>;
}

// Note: WatchmodeTitle isn't currently serialized; the client fetches details.
export type _WatchmodeTitleUnused = WatchmodeTitle;

