import { UserProfile, Group, SwipeSession } from '@/types';

const KEYS = {
  PROFILE: 'showmatch_profile',
  GROUP: 'showmatch_group',
  SESSION: 'showmatch_session',
} as const;

export function getStoredProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEYS.PROFILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.PROFILE);
}

export function getStoredGroup(): Group | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEYS.GROUP);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Group;
  } catch {
    return null;
  }
}

export function saveGroup(group: Group): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.GROUP, JSON.stringify(group));
}

export function clearGroup(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.GROUP);
}

export function getStoredSession(): SwipeSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEYS.SESSION);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SwipeSession;
  } catch {
    return null;
  }
}

export function saveSession(session: SwipeSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.SESSION);
}
