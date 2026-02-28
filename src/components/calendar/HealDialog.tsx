import { useCalendarStore } from '@/store/calendarStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, RotateCcw, Forward, X } from 'lucide-react';

export function HealDialog() {
  const { healPrompt, dismissHeal, handleHealAction } = useCalendarStore();

  return (
    <AnimatePresence>
      {healPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
          onClick={dismissHeal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <button onClick={dismissHeal} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Time's Up</h3>
                <p className="text-sm text-muted-foreground">"{healPrompt.title}" wasn't completed</p>
              </div>
            </div>

            <p className="mb-5 text-sm text-muted-foreground">
              This task was scheduled for{' '}
              <span className="time-mono text-foreground">{healPrompt.startTime}–{healPrompt.endTime}</span>.
              What would you like to do?
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleHealAction('reevaluate')}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
              >
                <RotateCcw className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Re-evaluate</p>
                  <p className="text-xs text-muted-foreground">Keep it today, I'll get to it</p>
                </div>
              </button>
              <button
                onClick={() => handleHealAction('snooze')}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
              >
                <Clock className="h-4 w-4 text-category-admin" />
                <div>
                  <p className="font-medium text-foreground">Snooze to Tomorrow</p>
                  <p className="text-xs text-muted-foreground">Move to the next available slot</p>
                </div>
              </button>
              <button
                onClick={() => handleHealAction('delegate')}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
              >
                <Forward className="h-4 w-4 text-category-social" />
                <div>
                  <p className="font-medium text-foreground">Delegate</p>
                  <p className="text-xs text-muted-foreground">Mark as delegated, remove from timeline</p>
                </div>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
