'use client';

import DayCell from './DayCell';
import { CalendarDay } from '@/hooks/useCalendar';
import { ScheduledEvent, Task } from '@/types';
import styles from './CalendarGrid.module.css';

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

interface CalendarGridProps {
  days: CalendarDay[];
  selectedDates: Set<string>;
  isMultiSelectMode: boolean;
  getEventsForDate: (dateKey: string) => ScheduledEvent[];
  getTasksForDate: (dateKey: string) => Task[];
  onAddTask: (dateKey: string) => void;
  onLongPress: (dateKey: string) => void;
  onSelectToggle: (dateKey: string) => void;
  onRemoveEvent: (id: string) => void;
  onRemoveTask: (id: string) => void;
  onToggleEvent: (id: string) => void;
  onToggleTask: (id: string) => void;
  onOpenTimeline: (dateKey: string) => void;
}

export default function CalendarGrid({
  days,
  selectedDates,
  isMultiSelectMode,
  getEventsForDate,
  getTasksForDate,
  onAddTask,
  onLongPress,
  onSelectToggle,
  onRemoveEvent,
  onRemoveTask,
  onToggleEvent,
  onToggleTask,
  onOpenTimeline,
}: CalendarGridProps) {
  return (
    <div className={styles.grid}>
      {/* Gün başlıkları (Pazartesiden Pazara) */}
      {DAY_LABELS.map((label) => (
        <div key={label} className={styles.dayLabel}>
          {label}
        </div>
      ))}

      {/* 3 Satırlık Gün Hücreleri (7 x 3 = 21 Gün) */}
      {days.map((dayObj) => {
        const { dateKey, day, isToday } = dayObj;
        return (
          <DayCell
            key={dateKey}
            dateKey={dateKey}
            day={day}
            isToday={isToday}
            isSelected={selectedDates.has(dateKey)}
            isMultiSelectMode={isMultiSelectMode}
            events={getEventsForDate(dateKey)}
            tasks={getTasksForDate(dateKey)}
            onAddTask={onAddTask}
            onLongPress={onLongPress}
            onSelectToggle={onSelectToggle}
            onRemoveEvent={onRemoveEvent}
            onRemoveTask={onRemoveTask}
            onToggleEvent={onToggleEvent}
            onToggleTask={onToggleTask}
            onOpenTimeline={onOpenTimeline}
          />
        );
      })}
    </div>
  );
}
