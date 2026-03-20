import { ContentFilters, Group, StreamingService, SwipeSession } from '@/types';

type Vote = 'like' | 'skip';

type ApiError = { error: string };

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as ApiError | null;
    throw new Error(data?.error ?? `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
}

export async function createGroupApi(args: {
  userId: string;
  name: string;
  services: StreamingService[];
}): Promise<Group> {
  const data = await apiFetch<{
    code: string;
    createdAt: string;
    members: Array<{ userId: string; name: string; services: StreamingService[] }>;
  }>('/api/groups', {
    method: 'POST',
    body: JSON.stringify(args),
  });

  return {
    code: data.code,
    createdAt: data.createdAt,
    members: data.members.map(m => ({
      userId: m.userId,
      name: m.name,
      services: m.services,
    })),
  };
}

export async function joinGroupApi(args: {
  code: string;
  userId: string;
  name: string;
  services: StreamingService[];
}): Promise<Group> {
  const data = await apiFetch<{
    code: string;
    members: Array<{ userId: string; name: string; services: StreamingService[] }>;
  }>(`/api/groups/${encodeURIComponent(args.code)}/join`, {
    method: 'POST',
    body: JSON.stringify({
      userId: args.userId,
      name: args.name,
      services: args.services,
    }),
  });

  // createdAt isn't returned here (we don't need it for current UI).
  return {
    code: data.code,
    createdAt: new Date().toISOString(),
    members: data.members,
  };
}

export async function fetchGroupApi(code: string): Promise<Group> {
  const data = await apiFetch<{
    code: string;
    createdAt: string;
    members: Array<{ userId: string; name: string; services: StreamingService[] }>;
  }>(`/api/groups/${encodeURIComponent(code)}`);

  return {
    code: data.code,
    createdAt: data.createdAt,
    members: data.members,
  };
}

export async function fetchActiveSessionApi(groupCode: string): Promise<{
  session: null | {
    id: string;
    groupCode: string;
    titleIds: number[];
    filters: ContentFilters;
    createdAt: string;
    votesByUserId: Record<string, Record<string, Vote>>;
  };
}> {
  return apiFetch(`/api/groups/${encodeURIComponent(groupCode)}/active-session`);
}

export async function createSessionApi(args: {
  groupCode: string;
  titleIds: number[];
  filters: ContentFilters;
}): Promise<{ session: { id: string; groupCode: string; titleIds: number[]; filters: ContentFilters; createdAt: string } }> {
  return apiFetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({
      groupCode: args.groupCode,
      titleIds: args.titleIds,
      filters: args.filters,
    }),
  });
}

export async function voteInSessionApi(args: {
  sessionId: string;
  voterUserId: string;
  titleId: number;
  vote: Vote;
}): Promise<{ votesByUserId: Record<string, Record<string, Vote>> }> {
  return apiFetch(`/api/sessions/${encodeURIComponent(args.sessionId)}/votes`, {
    method: 'POST',
    body: JSON.stringify({
      voterUserId: args.voterUserId,
      titleId: args.titleId,
      vote: args.vote,
    }),
  });
}

export async function fetchSessionApi(sessionId: string): Promise<{
  session: {
    id: string;
    groupCode: string;
    titleIds: number[];
    filters: ContentFilters;
    createdAt: string;
    votesByUserId: Record<string, Record<string, Vote>>;
  };
}> {
  return apiFetch(`/api/sessions/${encodeURIComponent(sessionId)}`);
}

