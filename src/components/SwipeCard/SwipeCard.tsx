'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { WatchmodeTitle } from '@/types';
import styles from './SwipeCard.module.scss';

interface SwipeCardProps {
  title: WatchmodeTitle;
  onLike: () => void;
  onSkip: () => void;
  memberName: string;
}

export default function SwipeCard({ title, onLike, onSkip, memberName }: SwipeCardProps) {
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 80;

  function handleMouseDown(e: React.MouseEvent) {
    setDragging(true);
    startX.current = e.clientX;
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setOffset(e.clientX - startX.current);
  }

  function handleMouseUp() {
    if (!dragging) return;
    setDragging(false);
    if (offset > SWIPE_THRESHOLD) {
      onLike();
    } else if (offset < -SWIPE_THRESHOLD) {
      onSkip();
    }
    setOffset(0);
  }

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
  }

  function handleTouchMove(e: React.TouchEvent) {
    setOffset(e.touches[0].clientX - startX.current);
  }

  function handleTouchEnd() {
    if (offset > SWIPE_THRESHOLD) {
      onLike();
    } else if (offset < -SWIPE_THRESHOLD) {
      onSkip();
    }
    setOffset(0);
  }

  const rotation = offset / 15;
  const likeOpacity = Math.min(offset / SWIPE_THRESHOLD, 1);
  const skipOpacity = Math.min(-offset / SWIPE_THRESHOLD, 1);

  const ratingColor =
    title.imdb_rating >= 8
      ? '#46d369'
      : title.imdb_rating >= 6
      ? '#f5c518'
      : '#e87c86';

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${dragging ? styles.dragging : ''}`}
      style={{
        transform: `translateX(${offset}px) rotate(${rotation}deg)`,
        transition: dragging ? 'none' : 'transform 300ms ease',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.likeOverlay} style={{ opacity: likeOpacity }}>
        <span>❤️ LIKE</span>
      </div>
      <div className={styles.skipOverlay} style={{ opacity: skipOpacity }}>
        <span>✕ SKIP</span>
      </div>

      <div className={styles.poster}>
        {title.poster ? (
          <Image
            src={title.poster}
            alt={title.title}
            fill
            className={styles.posterImg}
            sizes="(max-width: 480px) 100vw, 380px"
            priority
          />
        ) : (
          <div className={styles.posterPlaceholder}>
            <span className={styles.placeholderIcon}>🎬</span>
            <span className={styles.placeholderText}>{title.title}</span>
          </div>
        )}
        <div className={styles.posterGradient} />
      </div>

      <div className={styles.info}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.titleText}>{title.title}</h2>
            <div className={styles.meta}>
              <span className={styles.year}>{title.year}</span>
              {title.us_rating && (
                <span className={styles.rating}>{title.us_rating}</span>
              )}
              <span className={styles.type}>
                {title.type === 'movie' ? '🎬 Movie' : '📺 Series'}
              </span>
            </div>
          </div>
          {title.imdb_rating > 0 && (
            <div className={styles.imdbRating} style={{ color: ratingColor }}>
              <span className={styles.star}>⭐</span>
              <span>{title.imdb_rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {title.genre_names.length > 0 && (
          <div className={styles.genres}>
            {title.genre_names.slice(0, 3).map(g => (
              <span key={g} className={styles.genre}>{g}</span>
            ))}
          </div>
        )}

        {title.plot_overview && (
          <div className={styles.plot}>
            <p
              className={`${styles.plotText} ${expanded ? styles.plotExpanded : ''}`}
              onClick={() => setExpanded(p => !p)}
            >
              {title.plot_overview}
            </p>
            {!expanded && title.plot_overview.length > 120 && (
              <button
                className={styles.readMore}
                onClick={() => setExpanded(true)}
                type="button"
              >
                Read more
              </button>
            )}
          </div>
        )}

        <p className={styles.swipingFor}>
          <strong>{memberName}</strong> is voting
        </p>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${styles.skipBtn}`}
          onClick={onSkip}
          aria-label="Skip"
          type="button"
        >
          ✕
        </button>
        <button
          className={`${styles.actionBtn} ${styles.likeBtn}`}
          onClick={onLike}
          aria-label="Like"
          type="button"
        >
          ❤️
        </button>
      </div>
    </div>
  );
}
