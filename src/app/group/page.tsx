'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import GroupPanel from '@/components/GroupPanel/GroupPanel';
import styles from './page.module.scss';

export default function GroupPage() {
  const { profile, group } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!profile) router.push('/');
    else if (group) router.push('/swipe');
  }, [profile, group, router]);

  if (!profile || group) return null;

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => router.push('/')} type="button">
          ← Back
        </button>
        <div className={styles.logo}>
          <span>❤️</span>
          <span className={styles.logoText}>ShowMatch</span>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.welcome}>
          <h1 className={styles.title}>Hey, {profile.name}! 👋</h1>
          <p className={styles.subtitle}>
            Create a group or join one to start finding shows to watch together.
          </p>
        </div>
        <GroupPanel />
      </div>
    </main>
  );
}
