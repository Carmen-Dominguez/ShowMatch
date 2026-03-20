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
} from '@/lib/storage';
import {
  createGroup as createGroupFn,
  joinGroup as joinGroupFn,
  getOverlappingServices,
} from '@/lib/group';
import { fetchTitlesWithDetails } from '@/lib/watchmode';
import { MOCK_TITLES } from '@/lib/mockData';

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
  voteOnTitle: (titleId: number, vote: 'like' | 'skip') => void;
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

  const setProfile = useCallback((profile: UserProfile) => {
    saveProfile(profile);
    dispatch({ type: 'SET_PROFILE', payload: profile });
  }, []);

  const createNewGroup = useCallback(() => {
    if (!state.profile) return;
    const group = createGroupFn(state.profile);
    const updatedProfile = { ...state.profile, groupCode: group.code };
    saveProfile(updatedProfile);
    saveGroup(group);
    dispatch({ type: 'SET_PROFILE', payload: updatedProfile });
    dispatch({ type: 'SET_GROUP', payload: group });
  }, [state.profile]);

  const joinExistingGroup = useCallback(
    (code: string, existingGroupData: Group) => {
      if (!state.profile) return;
      const updatedGroup = joinGroupFn(existingGroupData, state.profile);
      const updatedProfile = { ...state.profile, groupCode: code };
      saveProfile(updatedProfile);
      saveGroup(updatedGroup);
      dispatch({ type: 'SET_PROFILE', payload: updatedProfile });
      dispatch({ type: 'SET_GROUP', payload: updatedGroup });
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

        const session: SwipeSession = {
          groupCode: state.group.code,
          userId: state.profile.id,
          votes: {},
          filters,
          currentMemberId: state.group.members[0]?.userId ?? state.profile.id,
        };

        saveSession(session);
        dispatch({ type: 'SET_TITLES', payload: titles });
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
    (titleId: number, vote: 'like' | 'skip') => {
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

      let isMatch = false;
      if (vote === 'like' && state.group.members.length > 1) {
        isMatch = state.group.members.every(member => {
          if (member.userId === currentMemberId) return true;
          return updatedVotes[member.userId]?.[titleKey] === 'like';
        });
      }

      const updatedSession: SwipeSession = {
        ...state.session,
        votes: updatedVotes,
      };

      saveSession(updatedSession);
      dispatch({ type: 'SET_SESSION', payload: updatedSession });

      if (isMatch) {
        const matchedTitle = state.titles.find(t => t.id === titleId);
        if (matchedTitle) {
          dispatch({ type: 'ADD_MATCH', payload: matchedTitle });
        }
      }
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
      dispatch({ type: 'SET_SESSION', payload: updatedSession });
    },
    [state.session]
  );

  const clearAll = useCallback(() => {
    clearProfile();
    clearGroup();
    clearSession();
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

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
