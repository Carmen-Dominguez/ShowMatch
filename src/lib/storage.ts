import { UserProfile, Group, SwipeSession } from '@/types';

const KEYS = {
  PROFILE: 'showmatch_profile',
  GROUP: 'showmatch_group',
  SESSION: 'showmatch_session',
  GROUPS_HISTORY: 'showmatch_groups_history',
  SESSIONS_HISTORY: 'showmatch_sessions_history',
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

export function getStoredGroupsHistory(): Group[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEYS.GROUPS_HISTORY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Group[];
  } catch {
    return [];
  }
}

export function saveGroupsHistory(groups: Group[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.GROUPS_HISTORY, JSON.stringify(groups));
}

export function upsertGroupInHistory(group: Group): void {
  if (typeof window === 'undefined') return;
  if (!group.code) return;

  const existing = getStoredGroupsHistory();
  const idx = existing.findIndex(g => g.code === group.code);
  if (idx >= 0) {
    existing[idx] = group;
    saveGroupsHistory(existing);
  } else {
    saveGroupsHistory([...existing, group]);
  }
}

export function getStoredSessionsHistory(): SwipeSession[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEYS.SESSIONS_HISTORY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SwipeSession[];
  } catch {
    return [];
  }
}

export function saveSessionsHistory(sessions: SwipeSession[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.SESSIONS_HISTORY, JSON.stringify(sessions));
}

export function upsertSessionInHistory(session: SwipeSession): void {
  if (typeof window === 'undefined') return;
  const existing = getStoredSessionsHistory();

  // Prefer stable session IDs when present.
  if (session.id) {
    const idx = existing.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      existing[idx] = session;
      saveSessionsHistory(existing);
    } else {
      saveSessionsHistory([...existing, session]);
    }
    return;
  }

  // Fallback for legacy sessions (no id): just append.
  saveSessionsHistory([...existing, session]);
}

export function clearGroupsHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.GROUPS_HISTORY);
}

export function clearSessionsHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.SESSIONS_HISTORY);
}
