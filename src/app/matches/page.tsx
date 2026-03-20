'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import MatchCard from '@/components/MatchCard/MatchCard';
import styles from './page.module.scss';

export default function MatchesPage() {
  const { profile, group, matches, session, titles } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!profile) router.push('/');
    else if (!group) router.push('/group');
    else if (!session) router.push('/swipe');
  }, [profile, group, session, router]);

  if (!profile || !group || !session) return null;

  const displayMatches = matches;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push('/swipe')} type="button">
          ← Back to Swiping
        </button>
        <div className={styles.logo}>
          <span>❤️</span>
          <span className={styles.logoText}>ShowMatch</span>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            {displayMatches.length > 0
              ? `You both want to watch these! 🎉`
              : `No matches yet 💭`}
          </h1>
          <p className={styles.subtitle}>
            {displayMatches.length > 0
              ? `${displayMatches.length} title${displayMatches.length !== 1 ? 's' : ''} you agree on`
              : 'Keep swiping to find something you both love'}
          </p>
        </div>

        {displayMatches.length > 0 ? (
          <div className={styles.grid}>
            {displayMatches.map(title => (
              <MatchCard key={title.id} title={title} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🍿</span>
            <p>Head back and swipe some more!</p>
            <button
              className={styles.swipeBtn}
              onClick={() => router.push('/swipe')}
              type="button"
            >
              Keep Swiping →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
