import { useCalendarStore } from '@/store/calendarStore';
import { TimeBlock } from './TimeBlock';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 - 21:00
const PX_PER_MINUTE = 1.2;

export function DayTimeline() {
  const { selectedDate, getTasksForDate } = useCalendarStore();
  const tasks = getTasksForDate(selectedDate);
  const totalHeight = HOURS.length * 60 * PX_PER_MINUTE;

  // Current time indicator
  const now = new Date();
  const isToday = format(now, 'yyyy-MM-dd') === selectedDate;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMinutes - 7 * 60) * PX_PER_MINUTE;

  return (
    <div className="relative overflow-y-auto scrollbar-thin" style={{ height: 'calc(100vh - 220px)' }}>
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
                <div className="flex-1 border-t border-border/40" />
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
            <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-lg" />
            <div className="h-px flex-1 bg-primary/60" />
          </motion.div>
        )}

        {/* Time blocks */}
        <AnimatePresence>
          {tasks.map((task) => (
            <TimeBlock key={task.id} task={task} pixelsPerMinute={PX_PER_MINUTE} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
