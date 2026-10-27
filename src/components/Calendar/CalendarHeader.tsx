'use client';

import styles from './CalendarHeader.module.css';

interface CalendarHeaderProps {
  title: string;
  subTitle?: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isAlarmEnabled?: boolean;
  onToggleAlarm?: () => void;
}

export default function CalendarHeader({
  title,
  subTitle = '3 Haftalık Görünüm',
  onPrev,
  onNext,
  onToday,
  isAlarmEnabled = true,
  onToggleAlarm,
}: CalendarHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.leftControls}>
        <button className={styles.navBtn} onClick={onPrev} aria-label="Önceki hafta">
          ‹
        </button>
      </div>

      <div className={styles.titleBlock}>
        <span className={styles.month}>{title}</span>
        <span className={styles.viewBadge}>{subTitle}</span>
      </div>

      <div className={styles.rightControls}>
        <button className={styles.todayBtn} onClick={onToday} title="Bu haftaya git">
          Bugün
        </button>
        {onToggleAlarm && (
          <button
            className={`${styles.alarmBtn} ${isAlarmEnabled ? styles.active : ''}`}
            onClick={onToggleAlarm}
            title={isAlarmEnabled ? 'Bildirim ve Sesler Açık' : 'Bildirimleri Aç'}
            aria-label="Alarm Durumu"
          >
            {isAlarmEnabled ? '🔔' : '🔕'}
          </button>
        )}
        <button className={styles.navBtn} onClick={onNext} aria-label="Sonraki hafta">
          ›
        </button>
      </div>
    </div>
  );
}
