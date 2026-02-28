import { useCalendarStore } from '@/store/calendarStore';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Cpu } from 'lucide-react';
import { SmartInput } from './SmartInput';
import { DayTimeline } from './DayTimeline';
import { Sidebar } from './Sidebar';
import { HealDialog } from './HealDialog';

export function CalendarApp() {
  const { selectedDate, setSelectedDate } = useCalendarStore();

  const goToday = () => setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  const goPrev = () => setSelectedDate(format(subDays(new Date(selectedDate + 'T12:00:00'), 1), 'yyyy-MM-dd'));
  const goNext = () => setSelectedDate(format(addDays(new Date(selectedDate + 'T12:00:00'), 1), 'yyyy-MM-dd'));

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Cpu className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Chronos</h1>
            <p className="text-xs text-muted-foreground">Active Calendar Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="rounded-lg p-2 transition-colors hover:bg-accent">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={goToday}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            Today
          </button>
          <button onClick={goNext} className="rounded-lg p-2 transition-colors hover:bg-accent">
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
