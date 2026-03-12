import { useCalendarStore } from '@/store/calendarStore';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Cpu, Wand2, AlertCircle, Download } from 'lucide-react';
import { SmartInput } from './SmartInput';
import { DayTimeline } from './DayTimeline';
import { Sidebar } from './Sidebar';
import { HealDialog } from './HealDialog';
import { motion, AnimatePresence } from 'framer-motion';

export function CalendarApp() {
  const { selectedDate, setSelectedDate, getConflicts, resolveConflicts, optimizeDay, getTasksForDate } = useCalendarStore();

  const goToday = () => setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  const goPrev = () => setSelectedDate(format(subDays(new Date(selectedDate + 'T12:00:00'), 1), 'yyyy-MM-dd'));
  const goNext = () => setSelectedDate(format(addDays(new Date(selectedDate + 'T12:00:00'), 1), 'yyyy-MM-dd'));

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const conflicts = getConflicts(selectedDate);

  const downloadSchedule = () => {
    const tasks = getTasksForDate(selectedDate);
    const dateLabel = format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy');
    
    let content = `CHRONOS — Day Schedule\n`;
    content += `${'='.repeat(40)}\n`;
    content += `Date: ${dateLabel}\n`;
    content += `Generated: ${format(new Date(), 'PPpp')}\n`;
    content += `${'='.repeat(40)}\n\n`;

    if (tasks.length === 0) {
      content += 'No tasks scheduled for this day.\n';
    } else {
      tasks.forEach((task, i) => {
        content += `${i + 1}. [${task.startTime} – ${task.endTime}] ${task.title}\n`;
        content += `   Type: ${task.type.charAt(0).toUpperCase() + task.type.slice(1)} | Energy: ${task.energyCost} | Status: ${task.status}\n`;
        content += `   Flexibility: ${task.flexibility} | Priority: ${task.priority}/5\n`;
        if (task.description) content += `   Notes: ${task.description}\n`;
        content += '\n';
      });

      const totalMin = tasks.reduce((s, t) => s + t.durationMinutes, 0);
      content += `${'—'.repeat(40)}\n`;
      content += `Total scheduled: ${Math.floor(totalMin / 60)}h ${totalMin % 60}m\n`;
      content += `Tasks: ${tasks.length} | Completed: ${tasks.filter(t => t.status === 'completed').length}\n`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronos-schedule-${selectedDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/50 px-6 py-4 glass-strong">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/15">
            <Cpu className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Chronos</h1>
            <p className="text-xs text-muted-foreground">Active Calendar Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Conflict indicator */}
          <AnimatePresence>
            {conflicts.length > 0 && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => resolveConflicts(selectedDate)}
                className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} · Resolve
              </motion.button>
            )}
          </AnimatePresence>

          {/* Optimize button */}
          <button
            onClick={() => optimizeDay(selectedDate)}
            className="flex items-center gap-2 rounded-2xl bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Optimize Day
          </button>

          {/* Download button */}
          <button
            onClick={downloadSchedule}
            className="flex items-center gap-2 rounded-2xl bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/80"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>

          <div className="mx-2 h-5 w-px bg-border" />

          <button onClick={goPrev} className="rounded-xl p-2 transition-colors hover:bg-accent">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={goToday}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
              isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            Today
          </button>
          <button onClick={goNext} className="rounded-xl p-2 transition-colors hover:bg-accent">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col gap-4 overflow-hidden p-5">
          <SmartInput />
          <DayTimeline />
        </main>
      </div>

      <HealDialog />
    </div>
  );
}
