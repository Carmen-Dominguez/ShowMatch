'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import MatchCard from '@/components/MatchCard/MatchCard';
import { Group, SwipeSession, WatchmodeTitle } from '@/types';
import {
  getStoredProfile,
  getStoredGroup,
  getStoredGroupsHistory,
  getStoredSession,
  getStoredSessionsHistory,
} from '@/lib/storage';
import { MOCK_TITLES } from '@/lib/mockData';
import { fetchTitleDetails } from '@/lib/watchmode';
import styles from './page.module.scss';

type TitleMap = Record<number, WatchmodeTitle>;

function uniqSorted(nums: number[]): number[] {
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

export default function ProfilePage() {
  const router = useRouter();
  const { profile } = useApp();

  const [groupsHistory, setGroupsHistory] = useState<Group[]>([]);
  const [sessionsHistory, setSessionsHistory] = useState<SwipeSession[]>([]);

  const [titleById, setTitleById] = useState<TitleMap>({});
  const [isLoadingTitles, setIsLoadingTitles] = useState(false);
  const [titlesError, setTitlesError] = useState<string | null>(null);

  useEffect(() => {
    // `profile` from context may be `null` on the first render while `AppProvider`
    // hydrates from localStorage. Check localStorage first to avoid redirect loops.
    const storedProfile = getStoredProfile();
    if (!storedProfile) {
      router.push('/');
      return;
    }

    const storedGroups = getStoredGroupsHistory();
    const activeGroup = getStoredGroup();
    const mergedGroups = activeGroup && !storedGroups.some(g => g.code === activeGroup.code)
      ? [...storedGroups, activeGroup]
      : storedGroups;

    const storedSessions = getStoredSessionsHistory();
    const activeSession = getStoredSession();
    const mergedSessions =
      activeSession && !storedSessions.some(s => (activeSession.id ? s.id === activeSession.id : s.groupCode === activeSession.groupCode))
        ? [...storedSessions, activeSession]
        : storedSessions;

    setGroupsHistory(mergedGroups);
    setSessionsHistory(mergedSessions);
  }, [profile, router]);

  const isDemoMode = !process.env.NEXT_PUBLIC_WATCHMODE_API_KEY;

  const derived = useMemo(() => {
    if (!profile) {
      return {
        userGroups: [] as Group[],
        soloLikeIds: [] as number[],
        groupMatchesByCode: {} as Record<string, number[]>,
        allTitleIds: [] as number[],
      };
    }

    const userId = profile.id;

    const userGroups = groupsHistory.filter(g => g.members.some(m => m.userId === userId));
    const groupMap = new Map(groupsHistory.map(g => [g.code, g]));

    const soloLikeIdSet = new Set<number>();
    for (const session of sessionsHistory) {
      if (session.userId !== userId) continue;
      const group = groupMap.get(session.groupCode);
      if (!group) continue;
      if (group.members.length !== 1) continue;

      const votesForUser = session.votes[userId] ?? {};
      for (const [titleKey, vote] of Object.entries(votesForUser)) {
        if (vote !== 'like') continue;
        const titleId = Number(titleKey);
        if (!Number.isNaN(titleId)) soloLikeIdSet.add(titleId);
      }
    }

    const groupMatchesByCode: Record<string, number[]> = {};
    const allTitleIdsSet = new Set<number>();

    for (const group of userGroups) {
      if (group.members.length <= 1) continue;

      const matchIdSet = new Set<number>();
      const groupSessions = sessionsHistory.filter(
        s => s.groupCode === group.code && s.userId === userId,
      );

      for (const session of groupSessions) {
        const candidateTitleKeys = new Set<string>();
        for (const member of group.members) {
          const memberVotes = session.votes[member.userId] ?? {};
          for (const titleKey of Object.keys(memberVotes)) {
            candidateTitleKeys.add(titleKey);
          }
        }

        for (const titleKey of candidateTitleKeys) {
          const isMatch = group.members.every(
            member => session.votes[member.userId]?.[titleKey] === 'like',
          );
          if (!isMatch) continue;

          const titleId = Number(titleKey);
          if (!Number.isNaN(titleId)) matchIdSet.add(titleId);
        }
      }

      const matchIds = uniqSorted(Array.from(matchIdSet));
      groupMatchesByCode[group.code] = matchIds;
      for (const id of matchIds) allTitleIdsSet.add(id);
    }

    for (const id of soloLikeIdSet) allTitleIdsSet.add(id);

    const soloLikeIds = uniqSorted(Array.from(soloLikeIdSet));
    const allTitleIds = Array.from(allTitleIdsSet);

    return { userGroups, soloLikeIds, groupMatchesByCode, allTitleIds };
  }, [profile, groupsHistory, sessionsHistory]);

  useEffect(() => {
    if (!profile) return;
    const location = profile.location;

    const ids = derived.allTitleIds;
    if (ids.length === 0) {
      setTitleById({});
      setTitlesError(null);
      return;
    }

    let cancelled = false;
    async function load() {
      setIsLoadingTitles(true);
      setTitlesError(null);

      try {
        if (isDemoMode) {
          const allowed = new Set(ids);
          const map: TitleMap = {};
          for (const t of MOCK_TITLES) {
            if (allowed.has(t.id)) map[t.id] = t;
          }
          if (!cancelled) setTitleById(map);
          return;
        }

        const map: TitleMap = {};
        const results = await Promise.all(
          ids.map(async id => {
            try {
              const details = await fetchTitleDetails(id, location);
              return [id, details] as const;
            } catch {
              return null;
            }
          }),
        );

        for (const r of results) {
          if (!r) continue;
          map[r[0]] = r[1];
        }

        if (!cancelled) setTitleById(map);
      } catch (err) {
        if (cancelled) return;
        setTitlesError(err instanceof Error ? err.message : 'Failed to load title details');
      } finally {
        if (!cancelled) setIsLoadingTitles(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [derived.allTitleIds, isDemoMode, profile]);

  const soloLikeTitles = derived.soloLikeIds
    .map(id => titleById[id])
    .filter((t): t is WatchmodeTitle => Boolean(t));

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push('/')} type="button">
          ← Back
        </button>
        <div className={styles.logo}>
          <span>❤️</span>
          <span className={styles.logoText}>ShowMatch</span>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h1 className={styles.title}>Your Profile</h1>
          <div className={styles.profileCard}>
            <div className={styles.profileRow}>
              <div>
                <p className={styles.profileLabel}>Name</p>
                <p className={styles.profileValue}>{profile?.name ?? ''}</p>
              </div>
              <div>
                <p className={styles.profileLabel}>Region</p>
                <p className={styles.profileValue}>{profile?.location ?? ''}</p>
              </div>
            </div>
            <div className={styles.servicesRow}>
              {profile?.services.map(s => (
                <span key={s.id} className={styles.servicePill} style={{ borderColor: s.color }}>
                  <span className={styles.serviceLogo} style={{ color: s.color }}>
                    {s.logo}
                  </span>
                  <span className={styles.serviceName}>{s.name}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Groups</h2>
          </div>

          {derived.userGroups.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>👥</span>
              <p>You are not part of any groups yet.</p>
            </div>
          ) : (
            <div className={styles.groupsList}>
              {derived.userGroups.map(group => {
                const matchIds = group.members.length > 1 ? derived.groupMatchesByCode[group.code] ?? [] : [];
                const matchTitles = matchIds.map(id => titleById[id]).filter((t): t is WatchmodeTitle => Boolean(t));

                return (
                  <div key={group.code} className={styles.groupCard}>
                    <div className={styles.groupHeader}>
                      <div>
                        <p className={styles.groupCode}>{group.code}</p>
                        <p className={styles.groupMeta}>
                          {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {group.members.length <= 1 ? (
                      <div className={styles.groupEmpty}>
                        <span className={styles.emptyIcon}>🫶</span>
                        <p>No Matches</p>
                        <p className={styles.muted}>Your likes from this group appear in Solo Likes.</p>
                      </div>
                    ) : matchTitles.length > 0 ? (
                      <div className={styles.grid}>
                        {matchTitles.map(title => (
                          <MatchCard key={title.id} title={title} />
                        ))}
                      </div>
                    ) : (
                      <div className={styles.groupEmpty}>
                        <span className={styles.emptyIcon}>🍿</span>
                        <p>No matches for this group</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Solo Likes</h2>
          </div>

          {titlesError && <p className={styles.error}>{titlesError}</p>}
          {isLoadingTitles ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Loading titles…</p>
            </div>
          ) : soloLikeTitles.length > 0 ? (
            <div className={styles.grid}>
              {soloLikeTitles.map(title => (
                <MatchCard key={title.id} title={title} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>💭</span>
              <p>No solo likes yet</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

