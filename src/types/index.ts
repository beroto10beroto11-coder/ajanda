export interface Routine {
  id: string;
  name: string;
  emoji: string;
  color: string;
  daysOfWeek?: number[]; // 1: Pazartesi, ..., 7: Pazar
  time?: string | null;
}

export interface ScheduledEvent {
  id: string;
  routineId?: string;
  name: string;
  emoji: string;
  color: string;
  time: string | null; // null = esnek
  dateKey: string; // "YYYY-MM-DD"
  completed?: boolean;
  isRecurring?: boolean;
}

export interface Task {
  id: string;
  title: string;
  time: string | null;
  dateKey: string;
  completed?: boolean;
}

export type CalendarData = {
  events: ScheduledEvent[];
  tasks: Task[];
  routines: Routine[];
};
