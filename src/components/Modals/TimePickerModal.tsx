'use client';

import { useState } from 'react';
import styles from './TimePickerModal.module.css';

interface TimePickerModalProps {
  onConfirm: (time: string | null) => void;
  onCancel: () => void;
}

export default function TimePickerModal({ onConfirm, onCancel }: TimePickerModalProps) {
  const [wantsTime, setWantsTime] = useState<boolean | null>(null);
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');

  const handleConfirm = () => {
    if (wantsTime) {
      onConfirm(`${hour}:${minute}`);
    } else {
      onConfirm(null);
    }
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Saat belirlemek ister misin?</h3>

        <div className={styles.options}>
          <button
            className={`${styles.optionBtn} ${wantsTime === true ? styles.active : ''}`}
            onClick={() => setWantsTime(true)}
          >
            ⏰ Saat Belirle
          </button>
          <button
            className={`${styles.optionBtn} ${wantsTime === false ? styles.active : ''}`}
            onClick={() => setWantsTime(false)}
          >
            🔄 Esnek Bırak
          </button>
        </div>

        {wantsTime === true && (
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
            disabled={wantsTime === null}
          >
            Ekle
          </button>
        </div>
      </div>
    </div>
  );
}
