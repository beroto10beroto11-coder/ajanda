'use client';

import { useDroppable } from '@dnd-kit/core';
import { useLongPress } from '@/hooks/useLongPress';
import { ScheduledEvent, Task } from '@/types';
import styles from './DayCell.module.css';

interface DayCellProps {
  dateKey: string;
  day: number;
  isToday: boolean;
  isSelected: boolean;
  isMultiSelectMode: boolean;
  events: ScheduledEvent[];
  tasks: Task[];
  onAddTask: (dateKey: string) => void;
  onLongPress: (dateKey: string) => void;
  onSelectToggle: (dateKey: string) => void;
  onRemoveEvent: (id: string) => void;
  onRemoveTask: (id: string) => void;
  onToggleEvent: (id: string) => void;
  onToggleTask: (id: string) => void;
  onOpenTimeline: (dateKey: string) => void;
}

export default function DayCell({
  dateKey,
  day,
  isToday,
  isSelected,
  isMultiSelectMode,
  events,
  tasks,
  onAddTask,
  onLongPress,
  onSelectToggle,
  onRemoveEvent,
  onRemoveTask,
  onToggleEvent,
  onToggleTask,
  onOpenTimeline,
}: DayCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: dateKey });

  const longPressHandlers = useLongPress({
    onLongPress: () => onLongPress(dateKey),
    onClick: () => {
      if (isMultiSelectMode) {
        onSelectToggle(dateKey);
      }
    },
    delay: 450,
  });

  const hasContent = events.length > 0 || tasks.length > 0;

  return (
    <div
      ref={setNodeRef}
      className={`
        ${styles.cell}
        ${isToday ? styles.today : ''}
        ${isSelected ? styles.selected : ''}
        ${isOver ? styles.dropOver : ''}
        ${isMultiSelectMode ? styles.selectionMode : ''}
      `}
      {...longPressHandlers}
    >
      {/* Gün numarası + 24 Saatlik İkon + Ekle butonu */}
      <div className={styles.top}>
        <span className={`${styles.dayNum} ${isToday ? styles.todayNum : ''}`}>{day}</span>

        {!isMultiSelectMode && (
          <div className={styles.topActions}>
            {/* 24 Saatlik Saatlik Program İkonu */}
            <button
              className={styles.timelineIconBtn}
              onClick={(e) => {
                e.stopPropagation();
                onOpenTimeline(dateKey);
              }}
              title="24 Saatlik Saatlik Programı Aç"
              aria-label="24 Saatlik Program"
            >
              🕒
            </button>

            {/* Görev Ekle Butonu */}
            <button
              className={styles.addBtn}
              onClick={(e) => {
                e.stopPropagation();
                onAddTask(dateKey);
              }}
              aria-label="Görev ekle"
              title="Görev Ekle"
            >
              +
            </button>
          </div>
        )}

        {isMultiSelectMode && isSelected && (
          <span className={styles.checkmark}>✓</span>
        )}
      </div>

      {/* İçerik (Etkinlikler & Görevler) */}
      {hasContent && (
        <div className={styles.content}>
          {events.map((ev) => (
            <div
              key={ev.id}
              className={`${styles.eventChip} ${ev.completed ? styles.completed : ''}`}
              style={{
                background: ev.completed ? '#f0f0f0' : `${ev.color}18`,
                borderLeftColor: ev.color,
              }}
              onDoubleClick={() => onRemoveEvent(ev.id)}
            >
              {/* Tik Butonu */}
              <button
                className={`${styles.tickBox} ${ev.completed ? styles.checked : ''}`}
                style={{ borderColor: ev.color }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleEvent(ev.id);
                }}
                title={ev.completed ? 'Tamamlanmadı yap' : 'Tamamlandı işaretle'}
              >
                {ev.completed ? '✓' : ''}
              </button>

              <span className={styles.chipEmoji}>{ev.emoji}</span>
              <span
                className={`${styles.chipText} ${ev.completed ? styles.completedText : ''}`}
                title={ev.name}
              >
                {ev.name}
              </span>
              {ev.time && <span className={styles.chipTime}>{ev.time}</span>}
            </div>
          ))}

          {tasks.map((task) => (
            <div
              key={task.id}
              className={`${styles.taskChip} ${task.completed ? styles.completed : ''}`}
              onDoubleClick={() => onRemoveTask(task.id)}
            >
              {/* Tik Butonu */}
              <button
                className={`${styles.tickBox} ${task.completed ? styles.checked : ''}`}
                style={{ borderColor: '#6c63ff' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTask(task.id);
                }}
                title={task.completed ? 'Tamamlanmadı yap' : 'Tamamlandı işaretle'}
              >
                {task.completed ? '✓' : ''}
              </button>

              <span
                className={`${styles.chipText} ${task.completed ? styles.completedText : ''}`}
                title={task.title}
              >
                {task.title}
              </span>
              {task.time && <span className={styles.chipTime}>{task.time}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
