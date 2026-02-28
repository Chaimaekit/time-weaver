import { create } from 'zustand';
import { TimeObject, TaskStatus, ParsedNLInput, TaskType, EnergyCost } from '@/types/calendar';
import { format, addDays, parse, isAfter, isBefore } from 'date-fns';

function generateId() {
  return crypto.randomUUID();
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// NLP parser for natural language input
export function parseNaturalLanguage(input: string): ParsedNLInput {
  const lower = input.toLowerCase();

  // Extract duration
  let durationMinutes = 60;
  const hourMatch = lower.match(/(\d+)\s*hours?/);
  const minMatch = lower.match(/(\d+)\s*min(?:ute)?s?/);
  if (hourMatch) durationMinutes = parseInt(hourMatch[1]) * 60;
  if (minMatch) durationMinutes += parseInt(minMatch[1]);

  // Extract deadline
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

  // Auto-categorize type
  let type: TaskType = 'focus';
  if (/meeting|call|standup|sync|1[:-]1/i.test(lower)) type = 'social';
  else if (/email|invoice|report|expense|admin/i.test(lower)) type = 'admin';
  else if (/clean|organize|update|fix|maintain/i.test(lower)) type = 'maintenance';
  else if (/break|lunch|rest|walk|meditat/i.test(lower)) type = 'rest';

  // Auto energy cost
  let energyCost: EnergyCost = 'medium';
  if (/presentation|pitch|design|architect|strateg|complex|deep/i.test(lower)) energyCost = 'high';
  else if (/review|check|simple|quick|easy/i.test(lower)) energyCost = 'low';

  // Strip time/day references to get title
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
}

// Demo data
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

export const useCalendarStore = create<CalendarState>((set, get) => ({
  tasks: createDemoTasks(),
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
  },

  moveTask: (id, newStartTime) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const newEndMinutes = timeToMinutes(newStartTime) + task.durationMinutes;
    get().updateTask(id, {
      startTime: newStartTime,
      endTime: minutesToTime(newEndMinutes),
    });

    // Ripple effect: push overlapping shiftable tasks
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
    get().updateTask(id, { status: 'completed', completedAt: new Date().toISOString() });
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
    let candidate = 9 * 60; // Start at 9:00
    for (const task of dayTasks) {
      const taskStart = timeToMinutes(task.startTime);
      const taskEnd = timeToMinutes(task.endTime);
      if (candidate + durationMinutes <= taskStart) break;
      candidate = Math.max(candidate, taskEnd);
    }
    return minutesToTime(candidate);
  },
}));
