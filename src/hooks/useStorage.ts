'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarData, Routine, ScheduledEvent, Task } from '@/types';

const STORAGE_KEY = 'ajanda_data_v2';
const LEGACY_STORAGE_KEY = 'ajanda_data';
const ROUTINES_STORAGE_KEY = 'ajanda_routines';

const defaultData: CalendarData = {
  events: [],
  tasks: [],
  routines: [
    { id: 'r1', name: 'Sabah Sporu', emoji: '🏋️', color: '#6c63ff', daysOfWeek: [1, 3, 5], time: '08:00' },
    { id: 'r2', name: 'Kitap Okuma', emoji: '📚', color: '#4ecdc4', daysOfWeek: [1, 2, 3, 4, 5, 6, 7], time: '21:30' },
    { id: 'r3', name: 'Vitamin / İlaç', emoji: '💊', color: '#ffa64d', daysOfWeek: [1, 2, 3, 4, 5, 6, 7], time: '09:00' },
  ],
};

export function useStorage() {
  const [data, setData] = useState<CalendarData>(defaultData);
  const [loaded, setLoaded] = useState(false);

  // Yükleme & Eski verileri taşıma (Migration)
  useEffect(() => {
    try {
      const rawV2 = localStorage.getItem(STORAGE_KEY);
      if (rawV2) {
        const parsed = JSON.parse(rawV2);
        setData({
          events: parsed.events || [],
          tasks: parsed.tasks || [],
          routines: parsed.routines && parsed.routines.length > 0 ? parsed.routines : defaultData.routines,
        });
      } else {
        // Eski anahtarları kontrol et
        const oldDataRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
        const oldRoutinesRaw = localStorage.getItem(ROUTINES_STORAGE_KEY);
        const oldData = oldDataRaw ? JSON.parse(oldDataRaw) : null;
        const oldRoutines = oldRoutinesRaw ? JSON.parse(oldRoutinesRaw) : null;

        const initial: CalendarData = {
          events: oldData?.events || [],
          tasks: oldData?.tasks || [],
          routines: oldRoutines && oldRoutines.length > 0 ? oldRoutines : defaultData.routines,
        };
        setData(initial);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } catch (e) {
      console.warn('Storage yükleme hatası:', e);
    }
    setLoaded(true);
  }, []);

  const save = useCallback((newData: CalendarData) => {
    setData(newData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.warn('Storage kaydetme hatası:', e);
    }
  }, []);

  // Etkinlik Ekleme
  const addEvent = useCallback((event: ScheduledEvent) => {
    setData((prev) => {
      const next = { ...prev, events: [...prev.events, event] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const addEvents = useCallback((newEvents: ScheduledEvent[]) => {
    setData((prev) => {
      const next = { ...prev, events: [...prev.events, ...newEvents] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeEvent = useCallback((id: string) => {
    setData((prev) => {
      const next = { ...prev, events: prev.events.filter((e) => e.id !== id) };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Tik atma / Tamamlandı durumu değiştirme
  const toggleEventCompleted = useCallback((id: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        events: prev.events.map((e) =>
          e.id === id ? { ...e, completed: !e.completed } : e
        ),
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Görev Yönetimi
  const addTask = useCallback((task: Task) => {
    setData((prev) => {
      const next = { ...prev, tasks: [...prev.tasks, task] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeTask = useCallback((id: string) => {
    setData((prev) => {
      const next = { ...prev, tasks: prev.tasks.filter((t) => t.id !== id) };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const toggleTaskCompleted = useCallback((id: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        ),
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Rutin Yönetimi
  const addRoutine = useCallback((routine: Routine) => {
    setData((prev) => {
      const next = { ...prev, routines: [...prev.routines, routine] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeRoutine = useCallback((id: string) => {
    setData((prev) => {
      // Rutini sil ve varsa onun tekrarlayan etkinliklerini de temizle
      const next = {
        ...prev,
        routines: prev.routines.filter((r) => r.id !== id),
        events: prev.events.filter((e) => e.routineId !== id),
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Haftalık tekrarlayan rutinlerin görünür günlerde otomatik bulunmasını sağlama
  const ensureRecurringEvents = useCallback((dateKeys: string[]) => {
    setData((prev) => {
      const routinesWithDays = prev.routines.filter(
        (r) => r.daysOfWeek && r.daysOfWeek.length > 0
      );
      if (routinesWithDays.length === 0) return prev;

      const newEventsToAdd: ScheduledEvent[] = [];

      dateKeys.forEach((dateKey) => {
        const [y, m, d] = dateKey.split('-').map(Number);
        const dayDate = new Date(y, m - 1, d);
        // JS getDay(): 0 = Pazar, 1 = Pzt, ..., 6 = Cmt -> 1:Pzt ... 7:Pazar
        const dayOfWeek = dayDate.getDay() === 0 ? 7 : dayDate.getDay();

        routinesWithDays.forEach((routine) => {
          if (routine.daysOfWeek?.includes(dayOfWeek)) {
            // Bu gün için bu rutinden zaten etkinlik var mı?
            const alreadyExists = prev.events.some(
              (e) => e.dateKey === dateKey && e.routineId === routine.id
            );
            if (!alreadyExists) {
              newEventsToAdd.push({
                id: `rec-${routine.id}-${dateKey}`,
                routineId: routine.id,
                name: routine.name,
                emoji: routine.emoji,
                color: routine.color,
                time: routine.time || null,
                dateKey,
                completed: false,
                isRecurring: true,
              });
            }
          }
        });
      });

      if (newEventsToAdd.length === 0) return prev;

      const next = {
        ...prev,
        events: [...prev.events, ...newEventsToAdd],
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Tarihe Göre Getiriciler
  const getEventsForDate = useCallback(
    (dateKey: string): ScheduledEvent[] => {
      return data.events.filter((e) => e.dateKey === dateKey);
    },
    [data.events]
  );

  const getTasksForDate = useCallback(
    (dateKey: string): Task[] => {
      return data.tasks.filter((t) => t.dateKey === dateKey);
    },
    [data.tasks]
  );

  // Yedek Dışa Aktarma / İçe Aktarma (Mobil Depolama Güvenliği)
  const exportBackup = useCallback(() => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `ajanda-yedek-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Yedekleme hatası:', e);
    }
  }, [data]);

  const importBackup = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.events) && Array.isArray(parsed.tasks)) {
        save({
          events: parsed.events,
          tasks: parsed.tasks,
          routines: Array.isArray(parsed.routines) ? parsed.routines : defaultData.routines,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [save]);

  return {
    data,
    routines: data.routines,
    loaded,
    addEvent,
    addEvents,
    removeEvent,
    toggleEventCompleted,
    addTask,
    removeTask,
    toggleTaskCompleted,
    addRoutine,
    removeRoutine,
    ensureRecurringEvents,
    getEventsForDate,
    getTasksForDate,
    exportBackup,
    importBackup,
  };
}
