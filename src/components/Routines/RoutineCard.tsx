'use client';

import { useDraggable } from '@dnd-kit/core';
import { Routine } from '@/types';
import styles from './RoutineCard.module.css';

interface RoutineCardProps {
  routine: Routine;
  onRemove: (id: string) => void;
  onClick?: (routine: Routine) => void;
}

const DAY_SHORT = ['', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function RoutineCard({ routine, onRemove, onClick }: RoutineCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `routine-${routine.id}`,
    data: { routine },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  // Günlerin özeti (örn: "Pzt, Çar, Cum" veya "Her Gün")
  const getDaysSummary = () => {
    if (!routine.daysOfWeek || routine.daysOfWeek.length === 0) return null;
    if (routine.daysOfWeek.length === 7) return 'Her Gün';
    if (
      routine.daysOfWeek.length === 5 &&
      [1, 2, 3, 4, 5].every((d) => routine.daysOfWeek?.includes(d))
    ) {
      return 'Hafta İçi';
    }
    return routine.daysOfWeek.map((d) => DAY_SHORT[d]).join(', ');
  };

  const daysSummary = getDaysSummary();

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: routine.color + '18',
        borderColor: routine.color + '55',
      }}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      onClick={() => {
        if (!isDragging) {
          onClick?.(routine);
        }
      }}
      {...listeners}
      {...attributes}
    >
      <span className={styles.emoji}>{routine.emoji}</span>
      <div className={styles.infoCol}>
        <span className={styles.name}>{routine.name}</span>
        {(daysSummary || routine.time) && (
          <span className={styles.metaText}>
            {daysSummary}
            {daysSummary && routine.time ? ' • ' : ''}
            {routine.time}
          </span>
        )}
      </div>

      <button
        className={styles.removeBtn}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(routine.id);
        }}
        aria-label="Kaldır"
      >
        ×
      </button>
    </div>
  );
}
