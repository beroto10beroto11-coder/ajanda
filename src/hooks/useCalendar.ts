'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export interface CalendarDay {
  date: Date;
  year: number;
  month: number; // 0-indexed
  day: number;
  dateKey: string;
  isToday: boolean;
  dayOfWeek: number; // 1: Pzt, ..., 7: Paz
  isOtherMonth?: boolean;
}

// Bir tarihin ait olduğu haftanın Pazartesi gününü bulur
function getMonday(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  // Pazar = 0 -> diff = -6, Pzt = 1 -> diff = 0, Sal = 2 -> diff = -1 vb.
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(y: number, m: number, d: number): string {
  const mm = String(m + 1).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

// Statik derleme (SSR/Prerender) için güvenli başlangıç Pazartesi günü
const STATIC_DEFAULT_MONDAY = new Date(2026, 9, 26);

export function useCalendar() {
  const [mounted, setMounted] = useState(false);
  const [todayKey, setTodayKey] = useState('');
  const [viewMode, setViewMode] = useState<'three-weeks' | 'month'>('three-weeks');

  // Prerender sırasında new Date() çağrısını engellemek için sabit değerle başla
  const [startMonday, setStartMonday] = useState<Date>(STATIC_DEFAULT_MONDAY);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // Ekim

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    const tKey = formatDate(now.getFullYear(), now.getMonth(), now.getDate());
    setTodayKey(tKey);
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());

    const thisMonday = getMonday(now);
    setStartMonday(thisMonday);
  }, []);

  // 3 Haftalık günler listesi: 3 x 7 = tam 21 gün
  const threeWeeksDays: CalendarDay[] = useMemo(() => {
    const days: CalendarDay[] = [];
    const base = new Date(startMonday);

    for (let i = 0; i < 21; i++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      const y = d.getFullYear();
      const m = d.getMonth();
      const dateNum = d.getDate();
      const key = formatDate(y, m, dateNum);
      const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();

      days.push({
        date: d,
        year: y,
        month: m,
        day: dateNum,
        dateKey: key,
        isToday: key === todayKey,
        dayOfWeek,
      });
    }
    return days;
  }, [startMonday, todayKey]);

  // 3 haftalık görünüm başlığı (örn: "Ekim 2026" veya "Ekim - Kasım 2026")
  const headerTitle = useMemo(() => {
    if (viewMode === 'month') {
      return `${MONTH_NAMES[currentMonth]} ${currentYear}`;
    }

    if (threeWeeksDays.length === 0) return 'Ajanda';
    const firstDay = threeWeeksDays[0];
    const lastDay = threeWeeksDays[20];

    if (firstDay.month === lastDay.month) {
      return `${MONTH_NAMES[firstDay.month]} ${firstDay.year}`;
    }
    if (firstDay.year === lastDay.year) {
      return `${MONTH_NAMES[firstDay.month]} - ${MONTH_NAMES[lastDay.month]} ${firstDay.year}`;
    }
    return `${MONTH_NAMES[firstDay.month]} ${firstDay.year} - ${MONTH_NAMES[lastDay.month]} ${lastDay.year}`;
  }, [viewMode, currentMonth, currentYear, threeWeeksDays]);

  // Hafta Kaydırma: 1 hafta (veya 3 hafta) ileri / geri
  const prevPeriod = useCallback(() => {
    if (viewMode === 'three-weeks') {
      setStartMonday((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() - 7); // 1 hafta geri
        return next;
      });
    } else {
      setCurrentMonth((m) => {
        if (m === 0) {
          setCurrentYear((y) => y - 1);
          return 11;
        }
        return m - 1;
      });
    }
  }, [viewMode]);

  const nextPeriod = useCallback(() => {
    if (viewMode === 'three-weeks') {
      setStartMonday((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() + 7); // 1 hafta ileri
        return next;
      });
    } else {
      setCurrentMonth((m) => {
        if (m === 11) {
          setCurrentYear((y) => y + 1);
          return 0;
        }
        return m + 1;
      });
    }
  }, [viewMode]);

  const jumpToToday = useCallback(() => {
    const now = new Date();
    setStartMonday(getMonday(now));
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  }, []);

  const isToday = useCallback(
    (dateKey: string) => dateKey === todayKey,
    [todayKey]
  );

  return {
    mounted,
    viewMode,
    setViewMode,
    startMonday,
    threeWeeksDays,
    headerTitle,
    todayKey,
    prevPeriod,
    nextPeriod,
    jumpToToday,
    isToday,
    formatDateKey: formatDate,
    currentYear,
    currentMonth,
    monthName: MONTH_NAMES[currentMonth],
  };
}
