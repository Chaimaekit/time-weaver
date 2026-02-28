import { useState, useRef, useEffect } from 'react';
import { useCalendarStore } from '@/store/calendarStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';

export function SmartInput() {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
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
      <form onSubmit={handleSubmit}>
        <div
          className={`relative flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${
            isFocused
              ? 'border-primary/50 bg-card glow-primary'
              : 'border-border bg-secondary/50'
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
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>

      <AnimatePresence>
        {isFocused && !input && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 top-full z-10 mt-2 rounded-xl border border-border bg-popover p-2 shadow-lg"
          >
            <p className="mb-2 px-2 text-xs text-muted-foreground">Try saying:</p>
            {suggestions.map((s) => (
              <button
                key={s}
                onMouseDown={() => {
                  setInput(s);
                  inputRef.current?.focus();
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-secondary-foreground transition-colors hover:bg-accent"
              >
                "{s}"
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
