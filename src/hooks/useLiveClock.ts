'use client';

import { useState, useEffect } from 'react';

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export function useLiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // İstemci tarafında hemen gerçek saati al
    setNow(new Date());

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!now) {
    return {
      now: null,
      timeStr: '',
      fullTimeStr: '',
      todayKey: '2026-10-27',
      readableDate: '27 Ekim 2026, Salı',
      shortDate: '27 Ekim Salı',
      hours: 20,
      minutes: 0,
    };
  }

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  const fullTimeStr = `${hours}:${minutes}:${seconds}`;

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayKey = `${year}-${month}-${day}`;

  const dayName = DAYS[now.getDay()];
  const monthName = MONTHS[now.getMonth()];
  const readableDate = `${now.getDate()} ${monthName} ${year}, ${dayName}`;
  const shortDate = `${now.getDate()} ${monthName} ${dayName}`;

  return {
    now,
    timeStr,
    fullTimeStr,
    todayKey,
    readableDate,
    shortDate,
    hours: now.getHours(),
    minutes: now.getMinutes(),
  };
}
