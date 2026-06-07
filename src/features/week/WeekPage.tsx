import { useMemo, useState } from 'react';
import { addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { Task } from '../../types';
import { useCategories, useProjects, useTasksForRange } from '../../hooks/useCadenceData';
import { useViewportMode } from '../../hooks/useViewportMode';
import { monthLabel, toDateKey, weekDays } from '../../lib/date';
import { createTask, deleteTask, toggleTask, updateTask } from '../../db/repository';
import { WeekDayColumn } from './WeekDayColumn';
import { TaskFormSheet } from '../../components/TaskFormSheet';
import { GhostButton } from '../../components/FormControls';

export function WeekPage() {
  const [anchor, setAnchor] = useState(() => new Date());
  const mode = useViewportMode();
  const days = useMemo(() => weekDays(anchor), [anchor]);
  const start = toDateKey(days[0]);
  const end = toDateKey(days[6]);

  const tasks = useTasksForRange(start, end);
  const categories = useCategories();
  const projects = useProjects();
  const categoryById = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories]);

  const [formDate, setFormDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<Task | undefined>(undefined);

  function openEdit(task: Task) {
    setEditing(task);
    setFormDate(task.date);
  }

  function closeForm() {
    setFormDate(null);
    setEditing(undefined);
  }

  async function handleSubmit(values: Parameters<typeof createTask>[0]) {
    if (editing) {
      await updateTask(editing.id, values);
    } else {
      await createTask(values);
    }
  }

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const day of days) map.set(toDateKey(day), []);
    for (const task of tasks ?? []) {
      const list = map.get(task.date);
      if (list) list.push(task);
    }
    return map;
  }, [tasks, days]);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <header className="flex items-center justify-between gap-3 pt-2">
        <div>
          <p className="text-sm text-base-300">Planning</p>
          <h1 className="text-xl font-semibold capitalize tracking-tight">{monthLabel(anchor)}</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <GhostButton type="button" aria-label="Semaine précédente" onClick={() => setAnchor((d) => addWeeks(d, -1))} className="!px-2.5 !py-2">
            <ChevronLeft className="size-4" />
          </GhostButton>
          <GhostButton type="button" onClick={() => setAnchor(new Date())} className="!px-3 !py-2 text-sm">
            Aujourd’hui
          </GhostButton>
          <GhostButton type="button" aria-label="Semaine suivante" onClick={() => setAnchor((d) => addWeeks(d, 1))} className="!px-2.5 !py-2">
            <ChevronRight className="size-4" />
          </GhostButton>
        </div>
      </header>

      <div
        className={clsx(
          mode === 'expanded'
            ? 'flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-hidden pb-1'
            : 'flex flex-col gap-3',
        )}
      >
        {days.map((day) => {
          const key = toDateKey(day);
          return (
            <WeekDayColumn
              key={key}
              date={day}
              tasks={tasksByDay.get(key) ?? []}
              categoryById={categoryById}
              onToggle={(id) => void toggleTask(id)}
              onDelete={(id) => void deleteTask(id)}
              onOpen={openEdit}
              onAdd={(d) => {
                setEditing(undefined);
                setFormDate(toDateKey(d));
              }}
              compact={mode !== 'expanded'}
            />
          );
        })}
      </div>

      <TaskFormSheet
        open={formDate !== null}
        onClose={closeForm}
        onSubmit={(values) => void handleSubmit(values)}
        categories={categories ?? []}
        projects={projects ?? []}
        defaultDate={formDate ?? toDateKey(new Date())}
        task={editing}
      />
    </div>
  );
}
