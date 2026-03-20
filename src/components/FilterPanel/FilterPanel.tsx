'use client';

import { useState } from 'react';
import { ContentFilters } from '@/types';
import { GENRES } from '@/lib/services';
import styles from './FilterPanel.module.scss';

interface FilterPanelProps {
  onStart: (filters: ContentFilters) => void;
  isLoading: boolean;
}

export default function FilterPanel({ onStart, isLoading }: FilterPanelProps) {
  const [genres, setGenres] = useState<number[]>([]);
  const [contentType, setContentType] = useState<'movie' | 'tv_series' | 'all'>('all');
  const [minRating, setMinRating] = useState(0);

  function toggleGenre(id: number) {
    setGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  }

  function handleStart() {
    onStart({ genres, contentType, minRating });
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Filters</h3>

      <div className={styles.section}>
        <label className={styles.sectionLabel}>Content Type</label>
        <div className={styles.radioGroup}>
          {(['all', 'movie', 'tv_series'] as const).map(type => (
            <label key={type} className={styles.radioLabel}>
              <input
                type="radio"
                name="contentType"
                value={type}
                checked={contentType === type}
                onChange={() => setContentType(type)}
                className={styles.radioInput}
              />
              <span className={styles.radioText}>
                {type === 'all' ? 'All' : type === 'movie' ? 'Movies' : 'TV Shows'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.sectionLabel}>
          Minimum Rating: <span className={styles.ratingValue}>{minRating > 0 ? `${minRating}+` : 'Any'}</span>
        </label>
        <input
          type="range"
          min={0}
          max={9}
          step={0.5}
          value={minRating}
          onChange={e => setMinRating(Number(e.target.value))}
          className={styles.slider}
        />
        <div className={styles.sliderLabels}>
          <span>Any</span>
          <span>9.0</span>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.sectionLabel}>Genres (optional)</label>
        <div className={styles.genreGrid}>
          {GENRES.map(genre => (
            <button
              key={genre.id}
              type="button"
              className={`${styles.genreBtn} ${genres.includes(genre.id) ? styles.genreSelected : ''}`}
              onClick={() => toggleGenre(genre.id)}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>

      <button
        className={styles.startBtn}
        onClick={handleStart}
        disabled={isLoading}
        type="button"
      >
        {isLoading ? 'Loading titles…' : 'Start Swiping ❤️'}
      </button>
    </div>
  );
}
