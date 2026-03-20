'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import {
  UserProfile,
  Group,
  SwipeSession,
  WatchmodeTitle,
  ContentFilters,
} from '@/types';
import {
  getStoredProfile,
  saveProfile,
  getStoredGroup,
  saveGroup,
  getStoredSession,
  saveSession,
  clearProfile,
  clearGroup,
  clearSession,
  upsertGroupInHistory,
  upsertSessionInHistory,
  clearGroupsHistory,
  clearSessionsHistory,
} from '@/lib/storage';
import {
  getOverlappingServices,
} from '@/lib/group';
import { fetchTitlesWithDetails } from '@/lib/watchmode';
import { MOCK_TITLES } from '@/lib/mockData';
import {
  createGroupApi,
  fetchActiveSessionApi,
  fetchGroupApi,
  createSessionApi,
  voteInSessionApi,
  joinGroupApi,
} from '@/lib/api';

interface AppContextType {
  profile: UserProfile | null;
  group: Group | null;
  session: SwipeSession | null;
  titles: WatchmodeTitle[];
  matches: WatchmodeTitle[];
  isLoading: boolean;
  error: string | null;
  currentMemberId: string | null;
  setProfile: (profile: UserProfile) => void;
  createNewGroup: () => void;
  joinExistingGroup: (code: string, existingGroupData: Group) => void;
  startSession: (filters: ContentFilters) => Promise<void>;
  voteOnTitle: (titleId: number, vote: 'like' | 'skip') => Promise<void>;
  switchMember: (userId: string) => void;
  clearAll: () => void;
}

interface AppStateInternal {
  profile: UserProfile | null;
  group: Group | null;
  session: SwipeSession | null;
  titles: WatchmodeTitle[];
  matches: WatchmodeTitle[];
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_PROFILE'; payload: UserProfile }
  | { type: 'SET_GROUP'; payload: Group }
  | { type: 'SET_SESSION'; payload: SwipeSession }
  | { type: 'SET_TITLES'; payload: WatchmodeTitle[] }
  | { type: 'ADD_MATCH'; payload: WatchmodeTitle }
  | { type: 'SET_MATCHES'; payload: WatchmodeTitle[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ALL' }
  | { type: 'HYDRATE'; payload: Partial<AppStateInternal> };

function reducer(state: AppStateInternal, action: AppAction): AppStateInternal {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'SET_GROUP':
      return { ...state, group: action.payload };
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'SET_TITLES':
      return { ...state, titles: action.payload };
    case 'ADD_MATCH':
      return { ...state, matches: [...state.matches, action.payload] };
    case 'SET_MATCHES':
      return { ...state, matches: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ALL':
      return {
        profile: null,
        group: null,
        session: null,
        titles: [],
        matches: [],
        isLoading: false,
        error: null,
      };
    case 'HYDRATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    profile: null,
    group: null,
    session: null,
    titles: [],
    matches: [],
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const profile = getStoredProfile();
    const group = getStoredGroup();
    const session = getStoredSession();
    const hydratePayload: Partial<AppStateInternal> = {};
    if (profile) hydratePayload.profile = profile;
    if (group) hydratePayload.group = group;
    if (session) hydratePayload.session = session;
    dispatch({ type: 'HYDRATE', payload: hydratePayload });
  }, []);

  useEffect(() => {
    if (!state.profile?.groupCode) return;

    const groupCode = state.profile.groupCode;
    let cancelled = false;

    async function syncFromServer() {
      try {
        const groupFromServer = await fetchGroupApi(groupCode);
        if (cancelled) return;
        dispatch({ type: 'SET_GROUP', payload: groupFromServer });

        const active = await fetchActiveSessionApi(groupCode);
        if (cancelled) return;
        if (!active.session) return;

        const activeSession = active.session;
        const shouldFetchTitles = state.session?.id !== activeSession.id || state.titles.length === 0;

        const sessionFromServer: SwipeSession = {
          id: activeSession.id,
          createdAt: activeSession.createdAt,
          groupCode: activeSession.groupCode,
          userId: state.profile!.id,
          titleIds: activeSession.titleIds,
          votes: activeSession.votesByUserId,
          filters: activeSession.filters,
          currentMemberId: state.profile!.id,
        };

        dispatch({ type: 'SET_SESSION', payload: sessionFromServer });

        if (!shouldFetchTitles) return;

        const isDemoMode = !process.env.NEXT_PUBLIC_WATCHMODE_API_KEY;
        if (isDemoMode) {
          const allowed = new Set(activeSession.titleIds);
          const titles = MOCK_TITLES.filter(t => allowed.has(t.id));
          dispatch({ type: 'SET_TITLES', payload: titles });
          dispatch({ type: 'SET_MATCHES', payload: computeMatches(titles, groupFromServer.members, activeSession.votesByUserId) });
          saveSession(sessionFromServer);
          upsertSessionInHistory(sessionFromServer);
          return;
        }

        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        try {
          const { fetchTitleDetails } = await import('@/lib/watchmode');
          const results = await Promise.all(
            activeSession.titleIds.map(async id => {
              try {
                const details = await fetchTitleDetails(id, state.profile!.location);
                return details;
              } catch {
                return null;
              }
            }),
          );
          const titles = results.filter((t): t is WatchmodeTitle => Boolean(t));
          dispatch({ type: 'SET_TITLES', payload: titles });
          dispatch({ type: 'SET_MATCHES', payload: computeMatches(titles, groupFromServer.members, activeSession.votesByUserId) });
          saveSession(sessionFromServer);
          upsertSessionInHistory(sessionFromServer);
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (err) {
        // Don't hard-fail; allow app to keep working in local mode.
      }
    }

    syncFromServer();

    return () => {
      cancelled = true;
    };
  }, [state.profile?.groupCode]);

  const setProfile = useCallback((profile: UserProfile) => {
    saveProfile(profile);
    dispatch({ type: 'SET_PROFILE', payload: profile });
  }, []);

  const createNewGroup = useCallback(() => {
    if (!state.profile) return;
    (async () => {
      const group = await createGroupApi({
        userId: state.profile!.id,
        name: state.profile!.name,
        services: state.profile!.services,
      });
      const updatedProfile = { ...state.profile!, groupCode: group.code };
      saveProfile(updatedProfile);
      saveGroup(group);
      upsertGroupInHistory(group);
      dispatch({ type: 'SET_PROFILE', payload: updatedProfile });
      dispatch({ type: 'SET_GROUP', payload: group });
    })();
  }, [state.profile]);

  const joinExistingGroup = useCallback(
    (code: string, existingGroupData: Group) => {
      if (!state.profile) return;
      void existingGroupData;
      (async () => {
        const updatedGroup = await joinGroupApi({
          code,
          userId: state.profile!.id,
          name: state.profile!.name,
          services: state.profile!.services,
        });
        const updatedProfile = { ...state.profile!, groupCode: code.toUpperCase() };
        saveProfile(updatedProfile);
        saveGroup(updatedGroup);
        upsertGroupInHistory(updatedGroup);
        dispatch({ type: 'SET_PROFILE', payload: updatedProfile });
        dispatch({ type: 'SET_GROUP', payload: updatedGroup });
      })();
    },
    [state.profile]
  );

  const startSession = useCallback(
    async (filters: ContentFilters) => {
      if (!state.profile || !state.group) return;
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const apiKey = process.env.NEXT_PUBLIC_WATCHMODE_API_KEY;
        let titles: WatchmodeTitle[];

        if (!apiKey) {
          titles = MOCK_TITLES;
        } else {
          const overlapping = getOverlappingServices(state.group);
          const sourceIds = overlapping.length > 0
            ? overlapping
            : state.group.members.flatMap(m => m.services.map(s => s.watchmodeSourceId));
          titles = await fetchTitlesWithDetails(
            sourceIds,
            state.profile.location,
            filters,
            filters.minRating
          );
        }

        const titleIds = titles.map(t => t.id);
        const created = await createSessionApi({
          groupCode: state.group.code,
          titleIds,
          filters,
        });

        const session: SwipeSession = {
          id: created.session.id,
          createdAt: created.session.createdAt,
          groupCode: state.group.code,
          userId: state.profile.id,
          titleIds,
          votes: {},
          filters,
          currentMemberId: state.profile.id,
        };

        saveSession(session);
        upsertSessionInHistory(session);
        dispatch({ type: 'SET_TITLES', payload: titles });
        dispatch({ type: 'SET_MATCHES', payload: [] });
        dispatch({ type: 'SET_SESSION', payload: session });
      } catch (err) {
        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Failed to fetch titles',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [state.profile, state.group]
  );

  const voteOnTitle = useCallback(
    async (titleId: number, vote: 'like' | 'skip') => {
      if (!state.session || !state.group) return;
      const currentMemberId = state.session.currentMemberId;
      const titleKey = String(titleId);

      const updatedVotes: Record<string, Record<string, 'like' | 'skip'>> = {
        ...state.session.votes,
        [currentMemberId]: {
          ...(state.session.votes[currentMemberId] ?? {}),
          [titleKey]: vote,
        },
      };
      let nextVotes = updatedVotes;

      if (state.session.id) {
        const server = await voteInSessionApi({
          sessionId: state.session.id,
          voterUserId: currentMemberId,
          titleId,
          vote,
        });
        nextVotes = server.votesByUserId;
      }

      const updatedSession: SwipeSession = {
        ...state.session,
        votes: nextVotes,
      };

      saveSession(updatedSession);
      upsertSessionInHistory(updatedSession);
      dispatch({ type: 'SET_SESSION', payload: updatedSession });
      dispatch({
        type: 'SET_MATCHES',
        payload: computeMatches(state.titles, state.group.members, nextVotes),
      });
    },
    [state.session, state.group, state.titles]
  );

  const switchMember = useCallback(
    (userId: string) => {
      if (!state.session) return;
      const updatedSession: SwipeSession = {
        ...state.session,
        currentMemberId: userId,
      };
      saveSession(updatedSession);
      upsertSessionInHistory(updatedSession);
      dispatch({ type: 'SET_SESSION', payload: updatedSession });
    },
    [state.session]
  );

  const clearAll = useCallback(() => {
    clearProfile();
    clearGroup();
    clearSession();
    clearGroupsHistory();
    clearSessionsHistory();
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const currentMemberId = state.session?.currentMemberId ?? state.profile?.id ?? null;

  return (
    <AppContext.Provider
      value={{
        ...state,
        currentMemberId,
        setProfile,
        createNewGroup,
        joinExistingGroup,
        startSession,
        voteOnTitle,
        switchMember,
        clearAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

function computeMatches(
  titles: WatchmodeTitle[],
  members: Group['members'],
  votes: Record<string, Record<string, 'like' | 'skip'>>,
): WatchmodeTitle[] {
  if (members.length <= 1) return [];
  return titles.filter(t =>
    members.every(m => votes[m.userId]?.[String(t.id)] === 'like'),
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
