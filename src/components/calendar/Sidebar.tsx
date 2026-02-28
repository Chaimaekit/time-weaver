import { useCalendarStore } from '@/store/calendarStore';
import { TASK_TYPE_LABELS, TYPE_ICONS, TaskType } from '@/types/calendar';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Activity, Battery, Clock, Zap } from 'lucide-react';

export function Sidebar() {
  const { selectedDate, getTasksForDate, tasks } = useCalendarStore();
  const dayTasks = getTasksForDate(selectedDate);

  const totalMinutes = dayTasks.reduce((sum, t) => sum + t.durationMinutes, 0);
  const completedCount = dayTasks.filter((t) => t.status === 'completed').length;
  const focusMinutes = dayTasks
    .filter((t) => t.type === 'focus')
    .reduce((sum, t) => sum + t.durationMinutes, 0);
  const highEnergyCount = dayTasks.filter((t) => t.energyCost === 'high').length;

  const typeDistribution = (['focus', 'admin', 'social', 'maintenance', 'rest'] as TaskType[]).map((type) => {
    const mins = dayTasks.filter((t) => t.type === type).reduce((s, t) => s + t.durationMinutes, 0);
    return { type, mins, pct: totalMinutes ? Math.round((mins / totalMinutes) * 100) : 0 };
  });

  const stats = [
    { icon: Clock, label: 'Scheduled', value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` },
    { icon: Zap, label: 'Focus Time', value: `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m` },
    { icon: Activity, label: 'Completed', value: `${completedCount}/${dayTasks.length}` },
    { icon: Battery, label: 'High Energy', value: `${highEnergyCount} blocks` },
  ];

  return (
    <aside className="flex w-72 flex-col gap-5 border-r border-border p-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {format(new Date(selectedDate + 'T12:00:00'), 'EEEE')}
        </h2>
        <p className="time-mono text-sm text-muted-foreground">
          {format(new Date(selectedDate + 'T12:00:00'), 'MMM d, yyyy')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map(({ icon: Icon, label, value }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-secondary/30 p-3"
          >
            <Icon className="mb-1 h-4 w-4 text-muted-foreground" />
            <p className="time-mono text-sm font-semibold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Type Distribution */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Time Distribution
        </h3>
        {/* Bar */}
        <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-secondary">
          {typeDistribution
            .filter((d) => d.pct > 0)
            .map((d) => (
              <motion.div
                key={d.type}
                initial={{ width: 0 }}
                animate={{ width: `${d.pct}%` }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`h-full bg-category-${d.type}`}
              />
            ))}
        </div>
        <div className="space-y-1.5">
          {typeDistribution.map((d) => (
            <div key={d.type} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span>{TYPE_ICONS[d.type]}</span>
                {TASK_TYPE_LABELS[d.type]}
              </span>
              <span className="time-mono text-foreground">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Upcoming Deadlines
        </h3>
        <div className="space-y-2">
          {tasks
            .filter((t) => t.deadline && t.status !== 'completed')
            .sort((a, b) => (a.deadline! > b.deadline! ? 1 : -1))
            .slice(0, 4)
            .map((t) => (
              <div key={t.id} className="rounded-lg bg-secondary/30 px-3 py-2">
                <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                <p className="time-mono text-xs text-muted-foreground">
                  Due {format(new Date(t.deadline! + 'T12:00:00'), 'EEE, MMM d')}
                </p>
              </div>
            ))}
          {tasks.filter((t) => t.deadline && t.status !== 'completed').length === 0 && (
            <p className="text-xs text-muted-foreground">No upcoming deadlines</p>
          )}
        </div>
      </div>
    </aside>
  );
}
