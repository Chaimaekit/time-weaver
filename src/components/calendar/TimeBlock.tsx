import { useState } from 'react';
import { TimeObject, TYPE_ICONS } from '@/types/calendar';
import { useCalendarStore } from '@/store/calendarStore';
import { motion } from 'framer-motion';
import { Check, Trash2, AlertTriangle, Pencil, Undo2 } from 'lucide-react';
import { TaskDialog } from './TaskDialog';
import { format } from 'date-fns';

interface TimeBlockProps {
  task: TimeObject;
  pixelsPerMinute: number;
  hasConflict?: boolean;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

const energyDots: Record<string, string> = {
  high: 'bg-energy-high',
  medium: 'bg-energy-medium',
  low: 'bg-energy-low',
};

export function TimeBlock({ task, pixelsPerMinute, hasConflict }: TimeBlockProps) {
  const { completeTask, deleteTask, triggerHeal } = useCalendarStore();
  const [editOpen, setEditOpen] = useState(false);
  const top = (timeToMinutes(task.startTime) - 7 * 60) * pixelsPerMinute;
  const height = Math.max(task.durationMinutes * pixelsPerMinute, 28);
  const isCompact = height < 50;

  const categoryClass = `category-${task.type}` as string;
  const isOverdue = task.status === 'overdue';
  const isCompleted = task.status === 'completed';

  // Determine if this task is in the past (end time has passed today)
  const now = new Date();
  const isToday = task.date === format(now, 'yyyy-MM-dd');
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isPast = isToday && timeToMinutes(task.endTime) < nowMinutes && !isCompleted;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isCompleted ? 0.4 : isPast ? 0.5 : 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, x: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{ top, height }}
        className={`absolute left-16 right-2 rounded-2xl px-3 py-1.5 ${categoryClass} cursor-pointer group transition-all hover:brightness-105 soft-shadow ${
          isOverdue ? 'animate-pulse-glow' : ''
        } ${isCompleted ? 'line-through opacity-40' : ''} ${
          hasConflict ? 'ring-2 ring-destructive ring-offset-2 ring-offset-background' : ''
        }`}
        onClick={() => setEditOpen(true)}
      >
        <div className="flex h-full items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">{TYPE_ICONS[task.type]}</span>
              <span className={`truncate font-medium ${isCompact ? 'text-xs' : 'text-sm'}`}>
                {task.title}
              </span>
            </div>
            {!isCompact && (
              <div className="mt-0.5 flex items-center gap-2 text-xs opacity-70">
                <span className="time-mono">
                  {task.startTime}–{task.endTime}
                </span>
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${energyDots[task.energyCost]}`} />
                <span className="capitalize">{task.energyCost}</span>
              </div>
            )}
            {!isCompact && task.description && (
              <p className="mt-1 truncate text-xs opacity-50">{task.description}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {isOverdue && (
              <button
                onClick={(e) => { e.stopPropagation(); triggerHeal(task); }}
                className="rounded-lg p-1 transition-colors hover:bg-destructive/20"
                title="Heal"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
              className="rounded-lg p-1 transition-colors hover:bg-accent"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); completeTask(task.id); }}
              className="rounded-lg p-1 transition-colors hover:bg-accent"
              title="Complete"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
              className="rounded-lg p-1 transition-colors hover:bg-destructive/20"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
      <TaskDialog open={editOpen} onClose={() => setEditOpen(false)} editTask={task} />
    </>
  );
}
