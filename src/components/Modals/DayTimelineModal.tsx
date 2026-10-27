'use client';

import { useMemo, useState } from 'react';
import { ScheduledEvent, Task } from '@/types';
import styles from './DayTimelineModal.module.css';

interface DayTimelineModalProps {
  dateKey: string;
  isToday: boolean;
  events: ScheduledEvent[];
  tasks: Task[];
  onClose: () => void;
  onToggleEvent: (id: string) => void;
  onToggleTask: (id: string) => void;
  onRemoveEvent: (id: string) => void;
  onRemoveTask: (id: string) => void;
  onAddAtHour: (hourStr: string) => void;
}

export default function DayTimelineModal({
  dateKey,
  isToday,
  events,
  tasks,
  onClose,
  onToggleEvent,
  onToggleTask,
  onRemoveEvent,
  onRemoveTask,
  onAddAtHour,
}: DayTimelineModalProps) {
  const [quickTitle, setQuickTitle] = useState('');
  const [selectedSlotHour, setSelectedSlotHour] = useState<string | null>(null);

  // Tarih Başlığı Formatlama (örn: "27 Ekim 2026, Salı")
  const formattedDate = useMemo(() => {
    if (!dateKey) return '';
    const [y, m, d] = dateKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return `${d} ${months[m - 1]} ${y}, ${days[dateObj.getDay()]}`;
  }, [dateKey]);

  // Şu anki saat ve dakika (Eğer gün bugünse)
  const currentNow = new Date();
  const currentHour = currentNow.getHours();
  const currentMinute = currentNow.getMinutes();

  // Esnek (saatsiz) etkinlik ve görevler
  const flexibleEvents = events.filter((e) => !e.time);
  const flexibleTasks = tasks.filter((t) => !t.time);

  // 24 saatlik slotlar (00:00 - 23:00)
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

  // Her saat dilimindeki etkinlikleri grupla
  const getItemsForHour = (hourStr: string) => {
    const matchedEvents = events.filter((e) => e.time && e.time.startsWith(`${hourStr}:`));
    const matchedTasks = tasks.filter((t) => t.time && t.time.startsWith(`${hourStr}:`));
    return { events: matchedEvents, tasks: matchedTasks };
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Üst Başlık */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>{formattedDate}</h2>
              {isToday && <span className={styles.todayBadge}>Bugün</span>}
            </div>
            <span className={styles.subTitle}>24 Saatlik Günlük Akış Programı</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>

        {/* Esnek / Gün Boyu Görevler */}
        {(flexibleEvents.length > 0 || flexibleTasks.length > 0) && (
          <div className={styles.flexibleSection}>
            <div className={styles.sectionTitle}>Esnek & Gün Boyu</div>
            <div className={styles.flexibleList}>
              {flexibleEvents.map((ev) => (
                <div
                  key={ev.id}
                  className={`${styles.flexChip} ${ev.completed ? styles.completed : ''}`}
                  style={{ borderLeftColor: ev.color, borderLeftWidth: 3 }}
                >
                  <button
                    className={`${styles.tickBtn} ${ev.completed ? styles.ticked : ''}`}
                    onClick={() => onToggleEvent(ev.id)}
                    style={{ borderColor: ev.color }}
                  >
                    {ev.completed ? '✓' : ''}
                  </button>
                  <span>{ev.emoji}</span>
                  <span>{ev.name}</span>
                  <button className={styles.deleteBtn} onClick={() => onRemoveEvent(ev.id)}>
                    ×
                  </button>
                </div>
              ))}
              {flexibleTasks.map((t) => (
                <div
                  key={t.id}
                  className={`${styles.flexChip} ${t.completed ? styles.completed : ''}`}
                >
                  <button
                    className={`${styles.tickBtn} ${t.completed ? styles.ticked : ''}`}
                    onClick={() => onToggleTask(t.id)}
                  >
                    {t.completed ? '✓' : ''}
                  </button>
                  <span>{t.title}</span>
                  <button className={styles.deleteBtn} onClick={() => onRemoveTask(t.id)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 24 Saatlik Zaman Çizelgesi */}
        <div className={styles.timelineScroll}>
          {hours.map((hourStr) => {
            const hNum = parseInt(hourStr, 10);
            const { events: hourEvents, tasks: hourTasks } = getItemsForHour(hourStr);
            const hasItems = hourEvents.length > 0 || hourTasks.length > 0;
            const isCurrentSlot = isToday && currentHour === hNum;

            return (
              <div key={hourStr} className={styles.hourRow}>
                <div className={styles.hourLabel}>{hourStr}:00</div>

                {/* Eğer şu anki saat dilimiyse kırmızı çizgi göster */}
                {isCurrentSlot && (
                  <div
                    className={styles.nowLine}
                    style={{ top: `${(currentMinute / 60) * 100}%` }}
                  >
                    <div className={styles.nowDot} />
                    <div className={styles.nowBar} />
                    <span className={styles.nowTag}>Şimdi</span>
                  </div>
                )}

                <div
                  className={styles.hourSlot}
                  onClick={() => onAddAtHour(`${hourStr}:00`)}
                  title="Bu saate etkinlik/görev eklemek için tıkla"
                >
                  {hasItems ? (
                    <>
                      {hourEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className={`${styles.timelineItem} ${ev.completed ? styles.completed : ''}`}
                          style={{
                            borderLeftColor: ev.color,
                            background: ev.completed ? '#f5f5f5' : `${ev.color}14`,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={styles.itemLeft}>
                            <button
                              className={`${styles.tickBtn} ${ev.completed ? styles.ticked : ''}`}
                              onClick={() => onToggleEvent(ev.id)}
                              style={{ borderColor: ev.color }}
                              aria-label="Tamamla"
                            >
                              {ev.completed ? '✓' : ''}
                            </button>
                            <span className={styles.itemEmoji}>{ev.emoji}</span>
                            <span className={`${styles.itemTitle} ${ev.completed ? styles.lineThrough : ''}`}>
                              {ev.name}
                            </span>
                          </div>
                          <div className={styles.itemRight}>
                            <span className={styles.timeTag}>{ev.time}</span>
                            <button
                              className={styles.deleteBtn}
                              onClick={() => onRemoveEvent(ev.id)}
                              aria-label="Sil"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}

                      {hourTasks.map((t) => (
                        <div
                          key={t.id}
                          className={`${styles.timelineItem} ${t.completed ? styles.completed : ''}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={styles.itemLeft}>
                            <button
                              className={`${styles.tickBtn} ${t.completed ? styles.ticked : ''}`}
                              onClick={() => onToggleTask(t.id)}
                              aria-label="Tamamla"
                            >
                              {t.completed ? '✓' : ''}
                            </button>
                            <span className={`${styles.itemTitle} ${t.completed ? styles.lineThrough : ''}`}>
                              {t.title}
                            </span>
                          </div>
                          <div className={styles.itemRight}>
                            <span className={styles.timeTag}>{t.time}</span>
                            <button
                              className={styles.deleteBtn}
                              onClick={() => onRemoveTask(t.id)}
                              aria-label="Sil"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className={styles.emptySlotHint}>+ Saate ekle</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Alt Butonlar */}
        <div className={styles.footer}>
          <button
            className={styles.addBtn}
            onClick={() => onAddAtHour(isToday ? `${String(currentHour).padStart(2, '0')}:00` : '09:00')}
          >
            + Bu Güne Yeni Görev Ekle
          </button>
        </div>
      </div>
    </div>
  );
}
