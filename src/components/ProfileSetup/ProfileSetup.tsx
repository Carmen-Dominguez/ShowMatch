'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { UserProfile } from '@/types';
import { STREAMING_SERVICES, REGIONS } from '@/lib/services';
import ServiceSelector from '@/components/ServiceSelector/ServiceSelector';
import styles from './ProfileSetup.module.scss';

export default function ProfileSetup() {
  const { setProfile } = useApp();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('US');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (selectedServiceIds.length === 0) {
      setError('Please select at least one streaming service.');
      return;
    }
    setError('');

    const services = STREAMING_SERVICES.filter(s => selectedServiceIds.includes(s.id));
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      location,
      services,
      groupCode: null,
      createdAt: new Date().toISOString(),
    };
    setProfile(profile);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Set Up Your Profile</h2>
      <div className={styles.field}>
        <label htmlFor="name" className={styles.label}>Your Name</label>
        <input
          id="name"
          type="text"
          className={styles.input}
          placeholder="Enter your name"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={50}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="location" className={styles.label}>Your Region</label>
        <select
          id="location"
          className={styles.select}
          value={location}
          onChange={e => setLocation(e.target.value)}
        >
          {REGIONS.map(r => (
            <option key={r.code} value={r.code}>{r.name}</option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <p className={styles.label}>Your Streaming Services</p>
        <ServiceSelector
          selected={selectedServiceIds}
          onChange={setSelectedServiceIds}
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={styles.submit}>
        Continue →
      </button>
    </form>
  );
}
