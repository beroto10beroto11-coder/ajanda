'use client';

import { useState } from 'react';
import { ScheduledEvent, Task } from '@/types';
import styles from './TodayWidget.module.css';

interface TodayWidgetProps {
  todayDateKey: string;
  readableDate: string;
  timeStr: string;
  events: ScheduledEvent[];
  tasks: Task[];
  onToggleEvent: (id: string) => void;
  onToggleTask: (id: string) => void;
  onRemoveEvent: (id: string) => void;
  onRemoveTask: (id: string) => void;
  onQuickAddTask: (title: string) => void;
  onOpenTimeline: () => void;
}

export default function TodayWidget({
  todayDateKey,
  readableDate,
  timeStr,
  events,
  tasks,
  onToggleEvent,
  onToggleTask,
  onRemoveEvent,
  onRemoveTask,
  onQuickAddTask,
  onOpenTimeline,
}: TodayWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [quickInput, setQuickInput] = useState('');

  const totalCount = events.length + tasks.length;
  const completedEvents = events.filter((e) => e.completed).length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completedCount = completedEvents + completedTasks;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleQuickAdd = () => {
    if (!quickInput.trim()) return;
    onQuickAddTask(quickInput.trim());
    setQuickInput('');
  };

  return (
    <div className={styles.widget}>
      {/* Widget Üst Başlık */}
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBadge} onClick={(e) => { e.stopPropagation(); onOpenTimeline(); }} title="24 Saatlik Programı Aç">
            📋
          </div>
          <div className={styles.titleBlock}>
            <span className={styles.widgetTitle}>Bugünün Yapılacakları</span>
            <span className={styles.dateSub}>{readableDate}</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.liveClock}>{timeStr}</span>
          <button className={styles.toggleBtn} aria-label="Aç / Kapat">
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* İlerleme Çubuğu */}
          <div className={styles.progressContainer}>
            <div className={styles.progressInfo}>
              <span>İlerleme: {completedCount} / {totalCount} Tamamlandı</span>
              <span>%{percent}</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${percent}%` }} />
            </div>
          </div>

          {/* Görev & Etkinlik Listesi */}
          <div className={styles.list}>
            {totalCount === 0 && (
              <div className={styles.emptyState}>Bugün için henüz bir görev veya rutin yok.</div>
            )}

            {events.map((ev) => (
              <div
                key={ev.id}
                className={`${styles.item} ${ev.completed ? styles.completed : ''}`}
                style={{ borderLeftColor: ev.color }}
              >
                <div className={styles.itemLeft}>
                  <button
                    className={`${styles.tick} ${ev.completed ? styles.ticked : ''}`}
                    onClick={() => onToggleEvent(ev.id)}
                    style={{ borderColor: ev.color }}
                  >
                    {ev.completed ? '✓' : ''}
                  </button>
                  <span>{ev.emoji}</span>
                  <span className={`${styles.itemText} ${ev.completed ? styles.lineThrough : ''}`}>
                    {ev.name}
                  </span>
                </div>
                <div className={styles.itemRight}>
                  {ev.time && <span className={styles.timeBadge}>{ev.time}</span>}
                  <button className={styles.removeBtn} onClick={() => onRemoveEvent(ev.id)}>
                    ×
                  </button>
                </div>
              </div>
            ))}

            {tasks.map((t) => (
              <div
                key={t.id}
                className={`${styles.item} ${t.completed ? styles.completed : ''}`}
                style={{ borderLeftColor: '#4ecdc4' }}
              >
                <div className={styles.itemLeft}>
                  <button
                    className={`${styles.tick} ${t.completed ? styles.ticked : ''}`}
                    onClick={() => onToggleTask(t.id)}
                  >
                    {t.completed ? '✓' : ''}
                  </button>
                  <span className={`${styles.itemText} ${t.completed ? styles.lineThrough : ''}`}>
                    {t.title}
                  </span>
                </div>
                <div className={styles.itemRight}>
                  {t.time && <span className={styles.timeBadge}>{t.time}</span>}
                  <button className={styles.removeBtn} onClick={() => onRemoveTask(t.id)}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Hızlı Görev Ekleme Kutusu */}
          <div className={styles.quickInputRow}>
            <input
              className={styles.quickInput}
              type="text"
              placeholder="+ Bugüne hızlı görev yaz..."
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            />
            <button className={styles.quickAddBtn} onClick={handleQuickAdd} title="Ekle">
              +
            </button>
          </div>
        </>
      )}
    </div>
  );
}
