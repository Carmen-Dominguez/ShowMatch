'use client';

import Image from 'next/image';
import { WatchmodeTitle } from '@/types';
import styles from './MatchCard.module.scss';

interface MatchCardProps {
  title: WatchmodeTitle;
}

export default function MatchCard({ title }: MatchCardProps) {
  const watchUrl = title.sources?.[0]?.web_url ?? null;

  return (
    <div className={styles.card}>
      <div className={styles.poster}>
        {title.poster ? (
          <Image
            src={title.poster}
            alt={title.title}
            fill
            className={styles.posterImg}
            sizes="(max-width: 480px) 50vw, 200px"
          />
        ) : (
          <div className={styles.posterPlaceholder}>
            <span>{title.type === 'movie' ? '🎬' : '📺'}</span>
          </div>
        )}
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{title.title}</h3>
        <div className={styles.meta}>
          <span className={styles.year}>{title.year}</span>
          {title.imdb_rating > 0 && (
            <span className={styles.rating}>⭐ {title.imdb_rating.toFixed(1)}</span>
          )}
        </div>
        {title.genre_names.length > 0 && (
          <p className={styles.genres}>{title.genre_names.slice(0, 2).join(' · ')}</p>
        )}
        {watchUrl && (
          <a href={watchUrl} target="_blank" rel="noopener noreferrer" className={styles.watchBtn}>
            Watch Now →
          </a>
        )}
      </div>
    </div>
  );
}
