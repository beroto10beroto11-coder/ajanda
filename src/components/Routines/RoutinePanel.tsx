'use client';

import { useState } from 'react';
import { Routine } from '@/types';
import RoutineCard from './RoutineCard';
import styles from './RoutinePanel.module.css';

const COLORS = [
  '#6c63ff', '#ff6584', '#4ecdc4', '#ffa64d', '#43d68f',
  '#f7b731', '#fd79a8', '#a29bfe', '#00cec9', '#e17055',
];

const EMOJIS = ['🏋️', '📚', '💊', '🧘', '🚴', '🎵', '✍️', '🍎', '💧', '🌙', '🏃', '🧹', '💻', '🎯', '🌿'];

const DAYS_LIST = [
  { num: 1, label: 'Pzt' },
  { num: 2, label: 'Sal' },
  { num: 3, label: 'Çar' },
  { num: 4, label: 'Per' },
  { num: 5, label: 'Cum' },
  { num: 6, label: 'Cmt' },
  { num: 7, label: 'Paz' },
];

interface RoutinePanelProps {
  routines: Routine[];
  onAdd: (routine: Routine) => void;
  onRemove: (id: string) => void;
  onRoutineClick?: (routine: Routine) => void;
}

export default function RoutinePanel({
  routines,
  onAdd,
  onRemove,
  onRoutineClick,
}: RoutinePanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏋️');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Varsayılan: Pzt, Çar, Cum
  const [time, setTime] = useState('');

  const toggleDay = (dayNum: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum].sort()
    );
  };

  const selectEveryday = () => setSelectedDays([1, 2, 3, 4, 5, 6, 7]);
  const selectWeekdays = () => setSelectedDays([1, 2, 3, 4, 5]);
  const clearDays = () => setSelectedDays([]);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: Date.now().toString(),
      name: name.trim(),
      emoji: selectedEmoji,
      color: selectedColor,
      daysOfWeek: selectedDays.length > 0 ? selectedDays : undefined,
      time: time.trim() ? time.trim() : null,
    });
    setName('');
    setTime('');
    setIsAdding(false);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Rutinler & Haftalık Alışkanlıklar</span>
        <button
          className={styles.panelAddBtn}
          onClick={() => setIsAdding(!isAdding)}
          aria-label="Rutin ekle"
          title={isAdding ? 'Kapat' : 'Yeni Rutin Ekle'}
        >
          {isAdding ? '×' : '+'}
        </button>
      </div>

      {/* Yeni rutin ekleme formu */}
      {isAdding && (
        <div className={styles.addForm}>
          {/* Haftalık Tekrar Günleri */}
          <div>
            <div className={styles.formLabel}>Hangi Günler Tekrarlansın? (Otomatik Eklenir)</div>
            <div className={styles.daysSelector}>
              {DAYS_LIST.map((d) => (
                <button
                  key={d.num}
                  type="button"
                  className={`${styles.dayPill} ${selectedDays.includes(d.num) ? styles.dayActive : ''}`}
                  onClick={() => toggleDay(d.num)}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className={styles.quickDayRow}>
              <button type="button" className={styles.quickDayBtn} onClick={selectEveryday}>
                Tüm Günler
              </button>
              <button type="button" className={styles.quickDayBtn} onClick={selectWeekdays}>
                Hafta İçi
              </button>
              <button type="button" className={styles.quickDayBtn} onClick={clearDays}>
                Sadece Sürükle-Bırak
              </button>
            </div>
          </div>

          {/* Emoji Seçimi */}
          <div className={styles.emojiPicker}>
            {EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                className={`${styles.emojiBtn} ${selectedEmoji === em ? styles.emojiActive : ''}`}
                onClick={() => setSelectedEmoji(em)}
              >
                {em}
              </button>
            ))}
          </div>

          {/* Renk Seçimi */}
          <div className={styles.colorPicker}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.colorDot} ${selectedColor === c ? styles.colorActive : ''}`}
                style={{ background: c }}
                onClick={() => setSelectedColor(c)}
                aria-label={c}
              />
            ))}
          </div>

          {/* İsim & Saat Satırı */}
          <div className={styles.inputRow}>
            <input
              className={styles.nameInput}
              type="text"
              placeholder="Rutin adı (örn: Spor, Kitap, İlaç)..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
              maxLength={30}
            />
            <input
              className={styles.timeInput}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              title="Saat (isteğe bağlı)"
            />
            <button
              className={styles.saveBtn}
              onClick={handleAdd}
              disabled={!name.trim()}
            >
              Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Rutin kartları */}
      <div className={styles.cards}>
        {routines.length === 0 && !isAdding && (
          <p className={styles.emptyHint}>+ ile haftalık rutin ekle veya sürükle-bırak yap</p>
        )}
        {routines.map((r) => (
          <RoutineCard
            key={r.id}
            routine={r}
            onRemove={onRemove}
            onClick={onRoutineClick}
          />
        ))}
      </div>
    </div>
  );
}
