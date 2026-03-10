import { useState } from 'react';
import { useCalendarStore, timeToMinutes, minutesToTime } from '@/store/calendarStore';
import { TaskType, EnergyCost, TimeObject, TASK_TYPE_LABELS, TYPE_ICONS } from '@/types/calendar';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  editTask?: TimeObject;
}

export function TaskDialog({ open, onClose, editTask }: TaskDialogProps) {
  const { addTask, updateTask, selectedDate } = useCalendarStore();

  const [title, setTitle] = useState(editTask?.title || '');
  const [description, setDescription] = useState(editTask?.description || '');
  const [type, setType] = useState<TaskType>(editTask?.type || 'focus');
  const [energyCost, setEnergyCost] = useState<EnergyCost>(editTask?.energyCost || 'medium');
  const [startTime, setStartTime] = useState(editTask?.startTime || '09:00');
  const [endTime, setEndTime] = useState(editTask?.endTime || '10:00');
  const [flexibility, setFlexibility] = useState<'fixed' | 'shiftable'>(editTask?.flexibility === 'fixed' ? 'fixed' : 'shiftable');
  const [priority, setPriority] = useState(editTask?.priority || 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);
    if (durationMinutes <= 0) return;

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      date: editTask?.date || selectedDate,
      startTime,
      endTime,
      durationMinutes,
      type,
      energyCost,
      flexibility,
      status: editTask?.status || 'pending' as const,
      dependencies: editTask?.dependencies || [],
      priority,
      tags: editTask?.tags || [],
    };

    if (editTask) {
      updateTask(editTask.id, taskData);
    } else {
      addTask(taskData);
    }
    onClose();
  };

  const types: TaskType[] = ['focus', 'admin', 'social', 'maintenance', 'rest'];
  const energies: EnergyCost[] = ['high', 'medium', 'low'];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative w-full max-w-md rounded-2xl p-6 soft-shadow"
          >
            <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>

            <h3 className="mb-5 text-lg font-semibold text-foreground">
              {editTask ? 'Edit Task' : 'New Task'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Task Name</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>

              {/* Type */}
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">Type</label>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                        type === t
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-secondary text-secondary-foreground hover:bg-accent'
                      }`}
                    >
                      {TYPE_ICONS[t]} {TASK_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Cost */}
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">Energy Cost</label>
                <div className="flex gap-2">
                  {energies.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEnergyCost(e)}
                      className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all ${
                        energyCost === e
                          ? e === 'high' ? 'bg-energy-high text-primary-foreground'
                          : e === 'medium' ? 'bg-energy-medium text-primary-foreground'
                          : 'bg-energy-low text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-accent'
                      }`}
                    >
                      {e === 'high' ? '🔥 High' : e === 'medium' ? '⚡ Medium' : '🌱 Low'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Window */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm time-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm time-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Urgency / Priority */}
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">Urgency</label>
                <div className="flex gap-2">
                  {([
                    { val: 2, label: 'Low', color: 'bg-energy-low' },
                    { val: 3, label: 'Medium', color: 'bg-energy-medium' },
                    { val: 5, label: 'High', color: 'bg-energy-high' },
                  ]).map(({ val, label, color }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPriority(val)}
                      className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all ${
                        priority === val
                          ? `${color} text-primary-foreground`
                          : 'bg-secondary text-secondary-foreground hover:bg-accent'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flexibility */}
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">Flexibility</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFlexibility('fixed')}
                    className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all ${
                      flexibility === 'fixed'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent'
                    }`}
                  >
                    📌 Fixed
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlexibility('shiftable')}
                    className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all ${
                      flexibility === 'shiftable'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent'
                    }`}
                  >
                    🔄 Shiftable
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details..."
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.98]"
              >
                <Plus className="mr-2 inline h-4 w-4" />
                {editTask ? 'Update Task' : 'Add Task'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
