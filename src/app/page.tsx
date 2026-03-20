'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import ProfileSetup from '@/components/ProfileSetup/ProfileSetup';
import styles from './page.module.scss';

export default function HomePage() {
  const { profile, group } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (profile && group) {
      router.push('/swipe');
    } else if (profile && !group) {
      router.push('/group');
    }
  }, [profile, group, router]);

  if (profile) return null;

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>❤️</span>
          <h1 className={styles.logoText}>ShowMatch</h1>
        </div>
        <p className={styles.tagline}>Find what to watch together</p>
      </div>
      <ProfileSetup />
    </main>
  );
}
