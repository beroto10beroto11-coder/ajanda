'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { useCalendar } from '@/hooks/useCalendar';
import { useStorage } from '@/hooks/useStorage';
import { useLiveClock } from '@/hooks/useLiveClock';
import { Routine, ScheduledEvent } from '@/types';
import CalendarHeader from '@/components/Calendar/CalendarHeader';
import CalendarGrid from '@/components/Calendar/CalendarGrid';
import RoutinePanel from '@/components/Routines/RoutinePanel';
import TodayWidget from '@/components/Widget/TodayWidget';
import DayTimelineModal from '@/components/Modals/DayTimelineModal';
import TimePickerModal from '@/components/Modals/TimePickerModal';
import TaskModal from '@/components/Modals/TaskModal';
import { playChime, requestNotificationPermission, sendBrowserNotification } from '@/utils/audioAlarm';
import styles from './page.module.css';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const calendar = useCalendar();
  const storage = useStorage();
  const clock = useLiveClock();

  // Hatırlatıcı / Alarm Durumu
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(true);
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());
  const [activeAlarmToast, setActiveAlarmToast] = useState<{
    id: string;
    title: string;
    time: string;
    emoji: string;
  } | null>(null);

  // 24 Saatlik Akış Modalı
  const [timelineDateKey, setTimelineDateKey] = useState<string | null>(null);

  // Çoklu seçim modu
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const selectedDatesRef = useRef<Set<string>>(new Set());
  const isMultiSelectModeRef = useRef(false);

  useEffect(() => {
    selectedDatesRef.current = selectedDates;
  }, [selectedDates]);

  useEffect(() => {
    isMultiSelectModeRef.current = isMultiSelectMode;
  }, [isMultiSelectMode]);

  // Bekleyen rutin yerleştirme (saat seçimi için)
  const [pendingDrop, setPendingDrop] = useState<{
    routine: Routine;
    dateKeys: string[];
  } | null>(null);

  // Görev ekleme modalı
  const [taskModalDate, setTaskModalDate] = useState<string | null>(null);
  const [taskModalInitialTime, setTaskModalInitialTime] = useState<string | null>(null);

  // Aktif sürüklenen rutin (overlay için)
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);

  // Gizli dosya seçici referansı (Yedek Yükleme için)
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // DnD sensörleri
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Görünür günlerdeki haftalık tekrarlayan rutinleri otomatik eşitle
  const visibleDateKeys = useMemo(() => {
    return calendar.threeWeeksDays.map((d) => d.dateKey);
  }, [calendar.threeWeeksDays]);

  useEffect(() => {
    if (storage.loaded && visibleDateKeys.length > 0) {
      storage.ensureRecurringEvents(visibleDateKeys);
    }
  }, [storage.loaded, visibleDateKeys, storage.ensureRecurringEvents]);

  // Canlı Saat Hatırlatıcı / Alarm Kontrolü
  useEffect(() => {
    if (!isAlarmEnabled || !storage.loaded) return;

    const todayEvents = storage.getEventsForDate(clock.todayKey);
    const todayTasks = storage.getTasksForDate(clock.todayKey);

    const currentTime = clock.timeStr; // "HH:MM"

    // Zamanı şu anki saat ile eşleşen ve henüz bildirilmemiş olanları bul
    todayEvents.forEach((ev) => {
      if (ev.time === currentTime && !notifiedIds.has(ev.id) && !ev.completed) {
        setNotifiedIds((prev) => new Set(prev).add(ev.id));
        playChime();
        sendBrowserNotification(ev.name, `Saat ${ev.time} için planlanan etkinlik zamanı!`, ev.emoji);
        setActiveAlarmToast({
          id: ev.id,
          title: ev.name,
          time: ev.time,
          emoji: ev.emoji,
        });
      }
    });

    todayTasks.forEach((t) => {
      if (t.time === currentTime && !notifiedIds.has(t.id) && !t.completed) {
        setNotifiedIds((prev) => new Set(prev).add(t.id));
        playChime();
        sendBrowserNotification(t.title, `Saat ${t.time} için planlanan görev zamanı!`, '📋');
        setActiveAlarmToast({
          id: t.id,
          title: t.title,
          time: t.time,
          emoji: '📋',
        });
      }
    });
  }, [clock.timeStr, clock.todayKey, isAlarmEnabled, storage, notifiedIds]);

  // Alarm Durumu Değiştirme
  const handleToggleAlarm = async () => {
    if (!isAlarmEnabled) {
      await requestNotificationPermission();
      setIsAlarmEnabled(true);
      playChime();
    } else {
      setIsAlarmEnabled(false);
    }
  };

  // Rutin Ekleme (Haftalık tekrarlayan günleri hemen takvime yayar)
  const handleAddRoutine = useCallback(
    (routine: Routine) => {
      storage.addRoutine(routine);
      setTimeout(() => {
        storage.ensureRecurringEvents(visibleDateKeys);
      }, 50);
    },
    [storage, visibleDateKeys]
  );

  // Long press → çoklu seçim modu
  const handleLongPress = useCallback((dateKey: string) => {
    setIsMultiSelectMode(true);
    isMultiSelectModeRef.current = true;
    setSelectedDates((prev) => {
      const next = new Set(prev);
      next.add(dateKey);
      selectedDatesRef.current = next;
      return next;
    });
  }, []);

  const handleSelectToggle = useCallback((dateKey: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      selectedDatesRef.current = next;
      return next;
    });
  }, []);

  const exitMultiSelect = useCallback(() => {
    setIsMultiSelectMode(false);
    isMultiSelectModeRef.current = false;
    const empty = new Set<string>();
    setSelectedDates(empty);
    selectedDatesRef.current = empty;
  }, []);

  // DnD bitti
  const routinesRef = useRef<Routine[]>([]);
  useEffect(() => {
    routinesRef.current = storage.routines;
  }, [storage.routines]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const routineId = String(active.id).replace('routine-', '');
    const routine = routinesRef.current.find((r) => r.id === routineId);
    if (!routine) return;

    const targetDateKey = String(over.id);

    let dateKeys: string[];
    if (isMultiSelectModeRef.current && selectedDatesRef.current.size > 0) {
      const set = new Set(selectedDatesRef.current);
      set.add(targetDateKey);
      dateKeys = Array.from(set);
    } else {
      dateKeys = [targetDateKey];
    }

    setPendingDrop({ routine, dateKeys });
  }, []);

  // Çoklu seçim modundayken etkinliğe tıklandığında ekleme yap
  const handleRoutineClick = useCallback((routine: Routine) => {
    if (isMultiSelectModeRef.current && selectedDatesRef.current.size > 0) {
      setPendingDrop({
        routine,
        dateKeys: Array.from(selectedDatesRef.current),
      });
    }
  }, []);

  // Saat seçimi onaylandı
  const handleTimeConfirm = useCallback(
    (time: string | null) => {
      if (!pendingDrop) return;
      const { routine, dateKeys } = pendingDrop;

      const newEvents: ScheduledEvent[] = dateKeys.map((dateKey) => ({
        id: `${Date.now()}-${dateKey}-${Math.random().toString(36).slice(2, 7)}`,
        routineId: routine.id,
        name: routine.name,
        emoji: routine.emoji,
        color: routine.color,
        time,
        dateKey,
        completed: false,
      }));

      storage.addEvents(newEvents);
      setPendingDrop(null);
      if (isMultiSelectModeRef.current) exitMultiSelect();
    },
    [pendingDrop, storage, exitMultiSelect]
  );

  // Görev ekleme
  const handleOpenAddTask = useCallback((dateKey: string, initialTime: string | null = null) => {
    setTaskModalDate(dateKey);
    setTaskModalInitialTime(initialTime);
  }, []);

  const handleTaskConfirm = useCallback(
    (title: string, time: string | null) => {
      if (!taskModalDate) return;
      storage.addTask({
        id: Date.now().toString(),
        title,
        time,
        dateKey: taskModalDate,
        completed: false,
      });
      setTaskModalDate(null);
      setTaskModalInitialTime(null);
    },
    [taskModalDate, storage]
  );

  // 24 Saatlik Zaman Çizelgesini Açma
  const handleOpenTimeline = useCallback((dateKey: string) => {
    setTimelineDateKey(dateKey);
  }, []);

  // Yedek Dosyası Seçildiğinde İçe Aktar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = storage.importBackup(content);
        if (success) {
          alert('Ajanda verileriniz başarıyla yüklendi!');
        } else {
          alert('Yedek dosyası geçersiz veya bozuk!');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Tarih etiketi (modal için)
  const getDateLabel = (dateKey: string) => {
    if (!dateKey) return '';
    const [y, m, d] = dateKey.split('-').map(Number);
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${d} ${months[m - 1]} ${y}`;
  };

  // SSR Hydration Uyuşmazlığını önlemek için mount kontrolü
  if (!mounted) {
    return (
      <div className={styles.app}>
        <header className={styles.header}>
          <h1 className={styles.appTitle}>Ajanda</h1>
        </header>
        <main
          className={styles.calendarArea}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            color: '#8e8e93',
            fontSize: '14px',
          }}
        >
          Yükleniyor...
        </main>
      </div>
    );
  }

  // Bugünün görev ve etkinlikleri (Widget için)
  const todayEvents = storage.getEventsForDate(clock.todayKey);
  const todayTasks = storage.getTasksForDate(clock.todayKey);

  return (
    <div className={styles.app}>
      {/* Hatırlatıcı / Alarm Toast Bildirimi */}
      {activeAlarmToast && (
        <div className={styles.alarmToast}>
          <div className={styles.alarmToastContent}>
            <span className={styles.alarmToastIcon}>{activeAlarmToast.emoji}</span>
            <div className={styles.alarmToastText}>
              <span className={styles.alarmToastTitle}>{activeAlarmToast.title}</span>
              <span className={styles.alarmToastSub}>Zamanı geldi! ({activeAlarmToast.time})</span>
            </div>
          </div>
          <button
            className={styles.alarmToastDismiss}
            onClick={() => setActiveAlarmToast(null)}
          >
            Tamam
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={(e) => {
          const routineId = String(e.active.id).replace('routine-', '');
          const r = routinesRef.current.find((r) => r.id === routineId);
          setActiveRoutine(r || null);
        }}
        onDragEnd={(e) => {
          setActiveRoutine(null);
          handleDragEnd(e);
        }}
        onDragCancel={() => setActiveRoutine(null)}
      >
        {/* Sayfa başlığı & Mobil Yedekleme Butonları */}
        <header className={styles.header}>
          <div className={styles.topRow}>
            <h1 className={styles.appTitle}>Ajanda</h1>
            <div className={styles.headerActions}>
              <button
                className={styles.backupBtn}
                onClick={storage.exportBackup}
                title="Tüm ajandayı JSON olarak telefona/bilgisayara indir"
              >
                💾 Yedekle
              </button>
              <button
                className={styles.backupBtn}
                onClick={() => fileInputRef.current?.click()}
                title="Yedek dosyasından verileri geri yükle"
              >
                📂 Yükle
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Çoklu Seçim Bilgilendirme Çubuğu */}
          {isMultiSelectMode && (
            <div className={styles.multiSelectBar}>
              <span className={styles.multiSelectInfo}>
                {selectedDates.size} gün seçili — etkinliğe dokun veya sürükle
              </span>
              <button className={styles.cancelSelectBtn} onClick={exitMultiSelect}>
                İptal
              </button>
            </div>
          )}
        </header>

        {/* Ana Takvim & Widget Alanı */}
        <main className={styles.calendarArea}>
          {/* Günün Widget'ı (To-Do Listesi & İlerleme) */}
          <TodayWidget
            todayDateKey={clock.todayKey}
            readableDate={clock.shortDate}
            timeStr={clock.timeStr}
            events={todayEvents}
            tasks={todayTasks}
            onToggleEvent={storage.toggleEventCompleted}
            onToggleTask={storage.toggleTaskCompleted}
            onRemoveEvent={storage.removeEvent}
            onRemoveTask={storage.removeTask}
            onQuickAddTask={(title) => {
              storage.addTask({
                id: Date.now().toString(),
                title,
                time: null,
                dateKey: clock.todayKey,
                completed: false,
              });
            }}
            onOpenTimeline={() => handleOpenTimeline(clock.todayKey)}
          />

          {/* 3 Haftalık Takvim Başlığı (Gezinme, Bugün, Alarm Butonları) */}
          <CalendarHeader
            title={calendar.headerTitle}
            subTitle="3 Haftalık Görünüm"
            onPrev={calendar.prevPeriod}
            onNext={calendar.nextPeriod}
            onToday={calendar.jumpToToday}
            isAlarmEnabled={isAlarmEnabled}
            onToggleAlarm={handleToggleAlarm}
          />

          {/* 3 Satırlık (21 Günlük) Takvim Grid'i */}
          {storage.loaded && (
            <CalendarGrid
              days={calendar.threeWeeksDays}
              selectedDates={selectedDates}
              isMultiSelectMode={isMultiSelectMode}
              getEventsForDate={storage.getEventsForDate}
              getTasksForDate={storage.getTasksForDate}
              onAddTask={(dateKey) => handleOpenAddTask(dateKey, null)}
              onLongPress={handleLongPress}
              onSelectToggle={handleSelectToggle}
              onRemoveEvent={storage.removeEvent}
              onRemoveTask={storage.removeTask}
              onToggleEvent={storage.toggleEventCompleted}
              onToggleTask={storage.toggleTaskCompleted}
              onOpenTimeline={handleOpenTimeline}
            />
          )}
        </main>

        {/* Rutin Paneli (Alt Kısım - Haftalık Gün Dağıtımı Desteği) */}
        <footer className={styles.footer}>
          <RoutinePanel
            routines={storage.routines}
            onAdd={handleAddRoutine}
            onRemove={storage.removeRoutine}
            onRoutineClick={handleRoutineClick}
          />
        </footer>

        {/* Sürükleme Overlay */}
        <DragOverlay>
          {activeRoutine && (
            <div
              className={styles.dragOverlay}
              style={{
                background: activeRoutine.color + '22',
                borderColor: activeRoutine.color,
              }}
            >
              <span>{activeRoutine.emoji}</span>
              <span>{activeRoutine.name}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* 24 Saatlik Günlük Akış Programı Modalı */}
      {timelineDateKey && (
        <DayTimelineModal
          dateKey={timelineDateKey}
          isToday={timelineDateKey === clock.todayKey}
          events={storage.getEventsForDate(timelineDateKey)}
          tasks={storage.getTasksForDate(timelineDateKey)}
          onClose={() => setTimelineDateKey(null)}
          onToggleEvent={storage.toggleEventCompleted}
          onToggleTask={storage.toggleTaskCompleted}
          onRemoveEvent={storage.removeEvent}
          onRemoveTask={storage.removeTask}
          onAddAtHour={(hourStr) => handleOpenAddTask(timelineDateKey, hourStr)}
        />
      )}

      {/* Rutin Yerleştirme Saat Seçimi Modalı */}
      {pendingDrop && (
        <TimePickerModal
          onConfirm={handleTimeConfirm}
          onCancel={() => setPendingDrop(null)}
        />
      )}

      {/* Görev Ekleme Modalı */}
      {taskModalDate && (
        <TaskModal
          dateLabel={getDateLabel(taskModalDate)}
          initialTime={taskModalInitialTime}
          onConfirm={handleTaskConfirm}
          onCancel={() => {
            setTaskModalDate(null);
            setTaskModalInitialTime(null);
          }}
        />
      )}
    </div>
  );
}
