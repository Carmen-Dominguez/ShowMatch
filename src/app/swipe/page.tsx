'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import FilterPanel from '@/components/FilterPanel/FilterPanel';
import SwipeCard from '@/components/SwipeCard/SwipeCard';
import { ContentFilters } from '@/types';
import styles from './page.module.scss';

export default function SwipePage() {
  const { profile, group, session, titles, matches, isLoading, error, currentMemberId, startSession, voteOnTitle, switchMember, clearAll } = useApp();
  const router = useRouter();
  const [showMemberSwitch, setShowMemberSwitch] = useState(false);

  useEffect(() => {
    if (!profile) router.push('/');
    else if (!group) router.push('/group');
  }, [profile, group, router]);

  if (!profile || !group) return null;

  const currentMember = group.members.find(m => m.userId === currentMemberId) ?? group.members[0];

  const currentMemberVotes = session?.votes[currentMemberId ?? ''] ?? {};
  const unvotedTitles = titles.filter(t => !currentMemberVotes[String(t.id)]);
  const currentTitle = unvotedTitles[0] ?? null;

  const allDone = session && titles.length > 0 && unvotedTitles.length === 0;

  async function handleStart(filters: ContentFilters) {
    await startSession(filters);
  }

  function handleLike() {
    if (!currentTitle) return;
    voteOnTitle(currentTitle.id, 'like');
  }

  function handleSkip() {
    if (!currentTitle) return;
    voteOnTitle(currentTitle.id, 'skip');
  }

  function handleSwitchMember(userId: string) {
    switchMember(userId);
    setShowMemberSwitch(false);
  }

  const membersNotDone = group.members.filter(m => {
    const votes = session?.votes[m.userId] ?? {};
    return titles.some(t => !votes[String(t.id)]);
  });

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push('/group')} type="button">
          ← Back
        </button>
        <div className={styles.logo}>
          <span>❤️</span>
          <span className={styles.logoText}>ShowMatch</span>
        </div>
        <div className={styles.headerRight}>
          {matches.length > 0 && (
            <button className={styles.matchesBtn} onClick={() => router.push('/matches')} type="button">
              ❤️ {matches.length} Matches
            </button>
          )}
          <button className={styles.resetBtn} onClick={clearAll} type="button" title="Reset all">
            ⟳
          </button>
        </div>
      </header>

      {!session ? (
        <div className={styles.setupSection}>
          <h1 className={styles.setupTitle}>Ready to find something to watch?</h1>
          <p className={styles.setupSubtitle}>
            Group: <strong>{group.code}</strong> · {group.members.length} member{group.members.length !== 1 ? 's' : ''}
          </p>
          {error && <p className={styles.error}>{error}</p>}
          {!process.env.NEXT_PUBLIC_WATCHMODE_API_KEY && (
            <div className={styles.demoNotice}>
              🎬 Demo Mode — Add <code>NEXT_PUBLIC_WATCHMODE_API_KEY</code> to .env.local for real content
            </div>
          )}
          <FilterPanel onStart={handleStart} isLoading={isLoading} />
        </div>
      ) : (
        <div className={styles.swipeSection}>
          {group.members.length > 1 && (
            <div className={styles.memberBar}>
              <span className={styles.memberLabel}>Voting as:</span>
              <button
                className={styles.memberBtn}
                onClick={() => setShowMemberSwitch(p => !p)}
                type="button"
              >
                {currentMember?.name ?? 'Unknown'} ▾
              </button>
              {showMemberSwitch && (
                <div className={styles.memberDropdown}>
                  {group.members.map(m => {
                    const memberVotes = session.votes[m.userId] ?? {};
                    const remaining = titles.filter(t => !memberVotes[String(t.id)]).length;
                    return (
                      <button
                        key={m.userId}
                        className={`${styles.memberOption} ${m.userId === currentMemberId ? styles.activeMember : ''}`}
                        onClick={() => handleSwitchMember(m.userId)}
                        type="button"
                      >
                        <span>{m.name}</span>
                        <span className={styles.remaining}>{remaining} left</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Finding titles…</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <p>{error}</p>
              <button onClick={() => router.push('/swipe')} className={styles.retryBtn} type="button">
                Try Again
              </button>
            </div>
          ) : allDone ? (
            <div className={styles.doneState}>
              <h2 className={styles.doneTitle}>
                {currentMember?.name} is all done! 🎉
              </h2>
              {membersNotDone.length > 0 ? (
                <>
                  <p className={styles.doneSubtitle}>
                    Still waiting on: {membersNotDone.map(m => m.name).join(', ')}
                  </p>
                  <div className={styles.switchButtons}>
                    {membersNotDone.map(m => (
                      <button
                        key={m.userId}
                        className={styles.switchBtn}
                        onClick={() => handleSwitchMember(m.userId)}
                        type="button"
                      >
                        Switch to {m.name}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className={styles.doneSubtitle}>Everyone has voted!</p>
              )}
              {matches.length > 0 && (
                <button
                  className={styles.viewMatchesBtn}
                  onClick={() => router.push('/matches')}
                  type="button"
                >
                  View {matches.length} Match{matches.length !== 1 ? 'es' : ''} ❤️
                </button>
              )}
            </div>
          ) : currentTitle ? (
            <div className={styles.cardStack}>
              <div className={styles.progress}>
                <span className={styles.progressText}>
                  {titles.length - unvotedTitles.length + 1} / {titles.length}
                </span>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${((titles.length - unvotedTitles.length) / titles.length) * 100}%` }}
                  />
                </div>
              </div>
              <SwipeCard
                title={currentTitle}
                onLike={handleLike}
                onSkip={handleSkip}
                memberName={currentMember?.name ?? 'You'}
              />
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No titles found. Try different filters.</p>
              <button onClick={() => router.push('/swipe')} className={styles.retryBtn} type="button">
                Change Filters
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
