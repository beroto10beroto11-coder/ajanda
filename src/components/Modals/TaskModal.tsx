'use client';

import { useState } from 'react';
import styles from './TaskModal.module.css';

interface TaskModalProps {
  dateLabel: string;
  initialTime?: string | null;
  onConfirm: (title: string, time: string | null) => void;
  onCancel: () => void;
}

export default function TaskModal({
  dateLabel,
  initialTime = null,
  onConfirm,
  onCancel,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [wantsTime, setWantsTime] = useState(Boolean(initialTime));
  const [hour, setHour] = useState(() => (initialTime ? initialTime.split(':')[0] : '09'));
  const [minute, setMinute] = useState(() => (initialTime ? initialTime.split(':')[1] || '00' : '00'));

  const handleConfirm = () => {
    if (!title.trim()) return;
    const time = wantsTime ? `${hour}:${minute}` : null;
    onConfirm(title.trim(), time);
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <p className={styles.dateLabel}>{dateLabel}</p>
        <h3 className={styles.title}>Görev Ekle</h3>

        <input
          className={styles.input}
          type="text"
          placeholder="Görev başlığı..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          maxLength={60}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
        />

        <div className={styles.timeToggle}>
          <span className={styles.toggleLabel}>Saat belirle</span>
          <button
            className={`${styles.toggle} ${wantsTime ? styles.on : ''}`}
            onClick={() => setWantsTime(!wantsTime)}
            aria-label="Saat ekle"
          >
            <span className={styles.thumb} />
          </button>
        </div>

        {wantsTime && (
          <div className={styles.timePicker}>
            <select
              className={styles.select}
              value={hour}
              onChange={(e) => setHour(e.target.value)}
            >
              {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <span className={styles.colon}>:</span>
            <select
              className={styles.select}
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
            >
              {['00', '15', '30', '45'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>İptal</button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!title.trim()}
          >
            Ekle
          </button>
        </div>
      </div>
    </div>
  );
}
