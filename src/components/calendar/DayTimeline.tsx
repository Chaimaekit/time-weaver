import { useCalendarStore, timeToMinutes, minutesToTime } from '@/store/calendarStore';
import { TimeBlock } from './TimeBlock';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { Coffee, Sparkles } from 'lucide-react';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);
const PX_PER_MINUTE = 1.2;
const GAP_THRESHOLD = 30; // minutes

export function DayTimeline() {
  const { selectedDate, getTasksForDate, getConflicts, addTask } = useCalendarStore();
  const tasks = getTasksForDate(selectedDate);
  const conflicts = getConflicts(selectedDate);
  const totalHeight = HOURS.length * 60 * PX_PER_MINUTE;

  const conflictIds = new Set(conflicts.flatMap(([a, b]) => [a.id, b.id]));

  // Current time indicator
  const now = new Date();
  const isToday = format(now, 'yyyy-MM-dd') === selectedDate;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMinutes - 7 * 60) * PX_PER_MINUTE;

  // Find gaps > 30 min for empty state suggestions
  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'delegated');
  const gaps: { start: number; end: number }[] = [];
  let lastEnd = 9 * 60;
  for (const task of activeTasks) {
    const taskStart = timeToMinutes(task.startTime);
    if (taskStart - lastEnd >= GAP_THRESHOLD) {
      gaps.push({ start: lastEnd, end: taskStart });
    }
    lastEnd = Math.max(lastEnd, timeToMinutes(task.endTime));
  }
  // Check gap after last task until 18:00
  if (18 * 60 - lastEnd >= GAP_THRESHOLD) {
    gaps.push({ start: lastEnd, end: Math.min(lastEnd + 60, 18 * 60) });
  }

  const handleAddBreak = (gapStart: number) => {
    const duration = 15;
    addTask({
      title: 'Quick Break',
      date: selectedDate,
      startTime: minutesToTime(gapStart),
      endTime: minutesToTime(gapStart + duration),
      durationMinutes: duration,
      type: 'rest',
      energyCost: 'low',
      flexibility: 'shiftable',
      status: 'pending',
      dependencies: [],
      priority: 1,
      tags: ['break'],
      recurrence: 'none',
    });
  };

  return (
    <div className="relative overflow-y-auto scrollbar-thin rounded-2xl" style={{ height: 'calc(100vh - 220px)' }}>
      <div className="relative" style={{ height: totalHeight }}>
        {/* Hour lines */}
        {HOURS.map((hour) => {
          const top = (hour - 7) * 60 * PX_PER_MINUTE;
          return (
            <div key={hour} className="absolute left-0 right-0" style={{ top }}>
              <div className="flex items-start">
                <span className="time-mono w-14 shrink-0 pr-3 text-right text-xs text-muted-foreground">
                  {String(hour).padStart(2, '0')}:00
                </span>
                <div className="flex-1 border-t border-border/30" />
              </div>
            </div>
          );
        })}

        {/* Current time line */}
        {isToday && nowTop > 0 && nowTop < totalHeight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute left-14 right-0 z-20 flex items-center"
            style={{ top: nowTop }}
          >
            <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-lg shadow-primary/30" />
            <div className="h-px flex-1 bg-primary/40" />
          </motion.div>
        )}

        {/* Gap suggestions */}
        {gaps.slice(0, 3).map((gap) => {
          const top = (gap.start - 7 * 60) * PX_PER_MINUTE;
          const height = Math.min((gap.end - gap.start), 60) * PX_PER_MINUTE;
          return (
            <motion.div
              key={`gap-${gap.start}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ top, height: Math.max(height, 28) }}
              className="absolute left-16 right-2 flex items-center justify-center rounded-2xl border border-dashed border-border/50 bg-accent/30 cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => handleAddBreak(gap.start)}
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Coffee className="h-3.5 w-3.5" />
                <span>Suggested break · {gap.end - gap.start}m free</span>
              </div>
            </motion.div>
          );
        })}

        {/* Time blocks */}
        <AnimatePresence>
          {tasks.map((task) => (
            <TimeBlock
              key={task.id}
              task={task}
              pixelsPerMinute={PX_PER_MINUTE}
              hasConflict={conflictIds.has(task.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
