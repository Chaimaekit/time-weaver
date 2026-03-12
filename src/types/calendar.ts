export type TaskType = 'focus' | 'admin' | 'social' | 'maintenance' | 'rest';
export type EnergyCost = 'high' | 'medium' | 'low';
export type Flexibility = 'fixed' | 'shiftable' | 'autoschedule';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'snoozed' | 'delegated';
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface TimeObject {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  type: TaskType;
  energyCost: EnergyCost;
  flexibility: Flexibility;
  status: TaskStatus;
  dependencies: string[]; // IDs of tasks this depends on
  deadline?: string; // ISO date
  priority: number; // 1-5
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  naturalLanguageInput?: string;
}

export interface ParsedNLInput {
  title: string;
  durationMinutes: number;
  deadline?: string;
  type: TaskType;
  energyCost: EnergyCost;
  flexibility: Flexibility;
  priority: number;
}

export interface HealAction {
  taskId: string;
  action: 'reevaluate' | 'snooze' | 'delegate';
  snoozeMinutes?: number;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  focus: 'Focus',
  admin: 'Admin',
  social: 'Social',
  maintenance: 'Maintenance',
  rest: 'Rest',
};

export const ENERGY_LABELS: Record<EnergyCost, string> = {
  high: 'High Energy',
  medium: 'Medium Energy',
  low: 'Low Energy',
};

export const TYPE_ICONS: Record<TaskType, string> = {
  focus: '⚡',
  admin: '📋',
  social: '👥',
  maintenance: '🔧',
  rest: '🌿',
};
