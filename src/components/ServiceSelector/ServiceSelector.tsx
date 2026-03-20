'use client';

import { STREAMING_SERVICES } from '@/lib/services';
import styles from './ServiceSelector.module.scss';

interface ServiceSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function ServiceSelector({ selected, onChange }: ServiceSelectorProps) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className={styles.grid}>
      {STREAMING_SERVICES.map(service => {
        const isSelected = selected.includes(service.id);
        return (
          <button
            key={service.id}
            type="button"
            className={`${styles.service} ${isSelected ? styles.selected : ''}`}
            style={isSelected ? { borderColor: service.color, boxShadow: `0 0 12px ${service.color}40` } : {}}
            onClick={() => toggle(service.id)}
            aria-pressed={isSelected}
          >
            <span className={styles.logo}>{service.logo}</span>
            <span className={styles.name}>{service.name}</span>
            {isSelected && <span className={styles.check}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}
