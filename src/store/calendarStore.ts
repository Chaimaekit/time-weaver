import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TimeObject, TaskStatus, ParsedNLInput, TaskType, EnergyCost, Recurrence } from '@/types/calendar';
import { format, addDays } from 'date-fns';

function generateId() {
  return crypto.randomUUID();
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// NLP parser for natural language input
export function parseNaturalLanguage(input: string): ParsedNLInput {
  const lower = input.toLowerCase();

  let durationMinutes = 60;
  const hourMatch = lower.match(/(\d+)\s*hours?/);
  const minMatch = lower.match(/(\d+)\s*min(?:ute)?s?/);
  if (hourMatch) durationMinutes = parseInt(hourMatch[1]) * 60;
  if (minMatch) durationMinutes += parseInt(minMatch[1]);

  let deadline: string | undefined;
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date();
  for (const [i, name] of dayNames.entries()) {
    if (lower.includes(name) || lower.includes(name.slice(0, 3))) {
      const currentDay = today.getDay();
      const daysUntil = (i - currentDay + 7) % 7 || 7;
      deadline = format(addDays(today, daysUntil), 'yyyy-MM-dd');
      break;
    }
  }
  if (lower.includes('tomorrow')) deadline = format(addDays(today, 1), 'yyyy-MM-dd');
  if (lower.includes('today')) deadline = format(today, 'yyyy-MM-dd');

  let type: TaskType = 'focus';
  if (/meeting|call|standup|sync|1[:-]1/i.test(lower)) type = 'social';
  else if (/email|invoice|report|expense|admin/i.test(lower)) type = 'admin';
  else if (/clean|organize|update|fix|maintain/i.test(lower)) type = 'maintenance';
  else if (/break|lunch|rest|walk|meditat/i.test(lower)) type = 'rest';

  let energyCost: EnergyCost = 'medium';
  if (/presentation|pitch|design|architect|strateg|complex|deep|coding|code/i.test(lower)) energyCost = 'high';
  else if (/review|check|simple|quick|easy/i.test(lower)) energyCost = 'low';

  let title = input
    .replace(/(\d+)\s*hours?\s*/gi, '')
    .replace(/(\d+)\s*min(?:ute)?s?\s*/gi, '')
    .replace(/by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)/gi, '')
    .replace(/\b(i need|for|the)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!title) title = input;

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    durationMinutes,
    deadline,
    type,
    energyCost,
    flexibility: deadline ? 'shiftable' : 'autoschedule',
    priority: energyCost === 'high' ? 4 : energyCost === 'medium' ? 3 : 2,
  };
}

interface CalendarState {
  tasks: TimeObject[];
  selectedDate: string;
  healPrompt: TimeObject | null;

  setSelectedDate: (date: string) => void;
  addTask: (task: Omit<TimeObject, 'id' | 'createdAt' | 'updatedAt'>) => TimeObject;
  addFromNaturalLanguage: (input: string) => TimeObject;
  updateTask: (id: string, updates: Partial<TimeObject>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, newStartTime: string) => void;
  completeTask: (id: string) => void;
  triggerHeal: (task: TimeObject) => void;
  dismissHeal: () => void;
  handleHealAction: (action: 'reevaluate' | 'snooze' | 'delegate') => void;
  getTasksForDate: (date: string) => TimeObject[];
  findNextAvailableSlot: (date: string, durationMinutes: number) => string;
  getConflicts: (date: string) => [TimeObject, TimeObject][];
  resolveConflicts: (date: string) => void;
  optimizeDay: (date: string) => void;
  pullForward: (date: string) => void;
}

function createDemoTasks(): TimeObject[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date();
  return [
    {
      id: generateId(),
      title: 'Morning Stand-up',
      date: today,
      startTime: '09:00',
      endTime: '09:30',
      durationMinutes: 30,
      type: 'social',
      energyCost: 'low',
      flexibility: 'fixed',
      status: timeToMinutes(format(now, 'HH:mm')) > timeToMinutes('09:30') ? 'completed' : 'pending',
      dependencies: [],
      priority: 3,
      tags: ['team', 'recurring'],
      recurrence: 'daily',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: generateId(),
      title: 'Deep Work: System Architecture',
      description: 'Design the event-driven architecture for the new microservices layer',
      date: today,
      startTime: '10:00',
      endTime: '12:00',
      durationMinutes: 120,
      type: 'focus',
      energyCost: 'high',
      flexibility: 'shiftable',
      status: 'in_progress',
      dependencies: [],
      priority: 5,
      tags: ['architecture', 'q1-goal'],
      recurrence: 'none',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: generateId(),
      title: 'Lunch Break',
      date: today,
      startTime: '12:00',
      endTime: '13:00',
      durationMinutes: 60,
      type: 'rest',
      energyCost: 'low',
      flexibility: 'shiftable',
      status: 'pending',
      dependencies: [],
      priority: 2,
      tags: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: generateId(),
      title: 'Code Review: PR #847',
      date: today,
      startTime: '13:00',
      endTime: '14:00',
      durationMinutes: 60,
      type: 'admin',
      energyCost: 'medium',
      flexibility: 'shiftable',
      status: 'pending',
      dependencies: [],
      priority: 3,
      tags: ['review'],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: generateId(),
      title: 'Investor Pitch Deck',
      description: 'Finalize slides for Series B pitch',
      date: today,
      startTime: '14:00',
      endTime: '16:30',
      durationMinutes: 150,
      type: 'focus',
      energyCost: 'high',
      flexibility: 'shiftable',
      status: 'pending',
      dependencies: [],
      deadline: format(addDays(now, 2), 'yyyy-MM-dd'),
      priority: 5,
      tags: ['pitch', 'urgent'],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: generateId(),
      title: 'Team Retro',
      date: today,
      startTime: '17:00',
      endTime: '17:45',
      durationMinutes: 45,
      type: 'social',
      energyCost: 'medium',
      flexibility: 'fixed',
      status: 'pending',
      dependencies: [],
      priority: 3,
      tags: ['team'],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      tasks: [] as TimeObject[],
      selectedDate: format(new Date(), 'yyyy-MM-dd'),
      healPrompt: null,

      setSelectedDate: (date) => set({ selectedDate: date }),

      addTask: (taskData) => {
        const task: TimeObject = {
          ...taskData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return task;
      },

      addFromNaturalLanguage: (input) => {
        const parsed = parseNaturalLanguage(input);
        const date = parsed.deadline || get().selectedDate;
        const startTime = get().findNextAvailableSlot(date, parsed.durationMinutes);
        const endMinutes = timeToMinutes(startTime) + parsed.durationMinutes;

        return get().addTask({
          title: parsed.title,
          date,
          startTime,
          endTime: minutesToTime(endMinutes),
          durationMinutes: parsed.durationMinutes,
          type: parsed.type,
          energyCost: parsed.energyCost,
          flexibility: parsed.flexibility,
          status: 'pending',
          dependencies: [],
          priority: parsed.priority,
          tags: [],
          recurrence: 'none',
          naturalLanguageInput: input,
        });
      },

      updateTask: (id, updates) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },

      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
        // Pull forward after deletion
        const task = get().tasks.find(t => t.id === id);
        if (task) {
          setTimeout(() => get().pullForward(task.date), 50);
        }
      },

      moveTask: (id, newStartTime) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        const newEndMinutes = timeToMinutes(newStartTime) + task.durationMinutes;
        get().updateTask(id, {
          startTime: newStartTime,
          endTime: minutesToTime(newEndMinutes),
        });

        const dayTasks = get()
          .getTasksForDate(task.date)
          .filter((t) => t.id !== id)
          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        const movedEnd = newEndMinutes;
        for (const other of dayTasks) {
          if (other.flexibility === 'fixed') continue;
          const otherStart = timeToMinutes(other.startTime);
          if (otherStart >= timeToMinutes(newStartTime) && otherStart < movedEnd) {
            const pushed = minutesToTime(movedEnd);
            get().updateTask(other.id, {
              startTime: pushed,
              endTime: minutesToTime(movedEnd + other.durationMinutes),
            });
          }
        }
      },

      completeTask: (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;
        if (task.status === 'completed') {
          // Undo completion
          get().updateTask(id, { status: 'pending', completedAt: undefined });
        } else {
          get().updateTask(id, { status: 'completed', completedAt: new Date().toISOString() });
          setTimeout(() => get().pullForward(task.date), 50);
        }
      },

      triggerHeal: (task) => set({ healPrompt: task }),
      dismissHeal: () => set({ healPrompt: null }),

      handleHealAction: (action) => {
        const task = get().healPrompt;
        if (!task) return;

        if (action === 'snooze') {
          const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
          get().updateTask(task.id, { date: tomorrow, status: 'snoozed' });
        } else if (action === 'delegate') {
          get().updateTask(task.id, { status: 'delegated' });
        } else {
          get().updateTask(task.id, { status: 'pending' });
        }
        set({ healPrompt: null });
      },

      getTasksForDate: (date) =>
        get()
          .tasks.filter((t) => t.date === date)
          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),

      findNextAvailableSlot: (date, durationMinutes) => {
        const dayTasks = get().getTasksForDate(date);
        let candidate = 9 * 60;
        for (const task of dayTasks) {
          const taskStart = timeToMinutes(task.startTime);
          const taskEnd = timeToMinutes(task.endTime);
          if (candidate + durationMinutes <= taskStart) break;
          candidate = Math.max(candidate, taskEnd);
        }
        return minutesToTime(candidate);
      },

      // Conflict detection: find overlapping task pairs
      getConflicts: (date) => {
        const dayTasks = get().getTasksForDate(date).filter(t => t.status !== 'completed' && t.status !== 'delegated');
        const conflicts: [TimeObject, TimeObject][] = [];
        for (let i = 0; i < dayTasks.length; i++) {
          for (let j = i + 1; j < dayTasks.length; j++) {
            const a = dayTasks[i], b = dayTasks[j];
            if (timeToMinutes(a.endTime) > timeToMinutes(b.startTime) &&
                timeToMinutes(b.endTime) > timeToMinutes(a.startTime)) {
              conflicts.push([a, b]);
            }
          }
        }
        return conflicts;
      },

      // Auto-resolve: push shiftable tasks to next available slot
      resolveConflicts: (date) => {
        const dayTasks = get().getTasksForDate(date)
          .filter(t => t.status !== 'completed' && t.status !== 'delegated')
          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
        
        let cursor = 0;
        for (const task of dayTasks) {
          const taskStart = timeToMinutes(task.startTime);
          if (task.flexibility === 'fixed') {
            cursor = Math.max(cursor, timeToMinutes(task.endTime));
            continue;
          }
          const newStart = Math.max(taskStart, cursor);
          if (newStart !== taskStart) {
            get().updateTask(task.id, {
              startTime: minutesToTime(newStart),
              endTime: minutesToTime(newStart + task.durationMinutes),
            });
          }
          cursor = newStart + task.durationMinutes;
        }
      },

      // Optimize: high energy morning, low energy afternoon
      optimizeDay: (date) => {
        const dayTasks = get().getTasksForDate(date)
          .filter(t => t.status !== 'completed' && t.status !== 'delegated');
        
        const fixed = dayTasks.filter(t => t.flexibility === 'fixed');
        const shiftable = dayTasks.filter(t => t.flexibility !== 'fixed');
        
        // Sort: high energy first, then medium, then low
        const energyOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        shiftable.sort((a, b) => energyOrder[a.energyCost] - energyOrder[b.energyCost]);

        // Build occupied slots from fixed tasks
        const occupied = fixed.map(t => ({
          start: timeToMinutes(t.startTime),
          end: timeToMinutes(t.endTime),
        }));

        let cursor = 9 * 60; // start at 9am
        for (const task of shiftable) {
          // Find next slot that doesn't overlap with fixed tasks
          let placed = false;
          while (!placed && cursor + task.durationMinutes <= 21 * 60) {
            const end = cursor + task.durationMinutes;
            const overlaps = occupied.some(o => cursor < o.end && end > o.start);
            if (!overlaps) {
              get().updateTask(task.id, {
                startTime: minutesToTime(cursor),
                endTime: minutesToTime(end),
              });
              occupied.push({ start: cursor, end });
              cursor = end;
              placed = true;
            } else {
              // Jump past the overlapping fixed task
              const blocker = occupied.find(o => cursor < o.end && end > o.start);
              if (blocker) cursor = blocker.end;
              else cursor += 15;
            }
          }
        }
      },

      // Pull forward: close gaps after completion/deletion
      pullForward: (date) => {
        const dayTasks = get().getTasksForDate(date)
          .filter(t => t.status !== 'completed' && t.status !== 'delegated');
        
        const fixed = dayTasks.filter(t => t.flexibility === 'fixed');
        const shiftable = dayTasks.filter(t => t.flexibility !== 'fixed')
          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        const occupied = fixed.map(t => ({
          start: timeToMinutes(t.startTime),
          end: timeToMinutes(t.endTime),
        }));

        let cursor = 9 * 60;
        for (const task of shiftable) {
          while (cursor + task.durationMinutes <= 21 * 60) {
            const end = cursor + task.durationMinutes;
            const overlaps = occupied.some(o => cursor < o.end && end > o.start);
            if (!overlaps) {
              const currentStart = timeToMinutes(task.startTime);
              if (cursor < currentStart) {
                get().updateTask(task.id, {
                  startTime: minutesToTime(cursor),
                  endTime: minutesToTime(end),
                });
              }
              occupied.push({ start: cursor, end: Math.max(end, timeToMinutes(task.endTime)) });
              cursor = end;
              break;
            } else {
              const blocker = occupied.find(o => cursor < o.end && end > o.start);
              if (blocker) cursor = blocker.end;
              else cursor += 15;
            }
          }
        }
      },
    }),
    {
      name: 'chronos-calendar-storage',
      partialize: (state) => ({ tasks: state.tasks, selectedDate: state.selectedDate }),
      onRehydrateStorage: () => (state) => {
        if (state && state.tasks.length === 0) {
          state.tasks = createDemoTasks();
        }
      },
    }
  )
);
