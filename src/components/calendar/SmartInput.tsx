import { useState, useRef } from 'react';
import { useCalendarStore } from '@/store/calendarStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { TaskDialog } from './TaskDialog';

export function SmartInput() {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addFromNaturalLanguage = useCalendarStore((s) => s.addFromNaturalLanguage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addFromNaturalLanguage(input.trim());
    setInput('');
  };

  const suggestions = [
    'I need 4 hours for the pitch deck by Friday',
    '30 min standup tomorrow morning',
    '2 hours deep work on API design',
    'Quick 15 min email review',
  ];

  return (
    <div className="relative">
      <div className="flex gap-2">
        <form onSubmit={handleSubmit} className="flex-1">
          <div
            className={`relative flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300 ${
              isFocused
                ? 'border-primary/40 glass-strong glow-primary'
                : 'glass border-border/50'
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder="Describe your task naturally..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <AnimatePresence>
              {input.trim() && (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  type="submit"
                  className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:brightness-105"
                >
                  <Plus className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </form>

        <button
          onClick={() => setDialogOpen(true)}
          className="rounded-2xl border border-border/50 glass px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-accent"
        >
          + Detailed
        </button>
      </div>

      <AnimatePresence>
        {isFocused && !input && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 top-full z-10 mt-2 rounded-2xl glass-strong p-2 soft-shadow"
          >
            <p className="mb-2 px-2 text-xs text-muted-foreground">Try saying:</p>
            {suggestions.map((s) => (
              <button
                key={s}
                onMouseDown={() => {
                  setInput(s);
                  inputRef.current?.focus();
                }}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm text-secondary-foreground transition-colors hover:bg-accent"
              >
                "{s}"
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <TaskDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
