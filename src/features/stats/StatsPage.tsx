import { useMemo } from 'react';
import { Flame, Target, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { useTasksForRange } from '../../hooks/useCadenceData';
import { fromDateKey, toDateKey } from '../../lib/date';
import {
  currentStreak,
  intensityLevel,
  overallCompletionRate,
  summarizeByDay,
  trailingDateKeys,
  type DaySummary,
} from '../../lib/stats';
import { ProgressRing } from '../../components/ProgressRing';

const HEATMAP_DAYS = 70; // ~10 semaines

const INTENSITY_CLASSES = [
  'bg-base-700/40',
  'bg-accent-violet/30',
  'bg-accent-violet/60',
  'bg-accent-violet',
];

export function StatsPage() {
  const dateKeys = useMemo(() => trailingDateKeys(new Date(), HEATMAP_DAYS), []);
  const tasks = useTasksForRange(dateKeys[0], dateKeys[dateKeys.length - 1]);

  const days = useMemo(() => summarizeByDay(tasks ?? [], dateKeys), [tasks, dateKeys]);
  const streak = useMemo(() => currentStreak(days), [days]);
  const rate = useMemo(() => overallCompletionRate(days), [days]);
  const totalDone = useMemo(() => days.reduce((acc, d) => acc + d.done, 0), [days]);

  // Aligne la grille sur des semaines complètes (lundi → dimanche) pour un rendu propre.
  const weeks = useMemo(() => {
    const out: DaySummary[][] = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [days]);

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="pt-2">
        <p className="text-sm text-base-300">Vue d’ensemble</p>
        <h1 className="text-xl font-semibold tracking-tight">Tes progrès</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={Flame} label="Série en cours" value={`${streak} j`} accent="text-accent-amber" />
        <StatCard icon={Target} label="Tâches validées" value={`${totalDone}`} accent="text-accent-mint" sublabel={`sur ${HEATMAP_DAYS} jours`} />
        <div className="col-span-2 flex items-center gap-4 rounded-2xl border border-base-700/60 bg-base-800/60 p-4 sm:col-span-1">
          <ProgressRing value={rate} size={64} strokeWidth={6} />
          <div>
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-base-300">
              <TrendingUp className="size-3.5" /> Taux global
            </p>
            <p className="text-sm text-base-300">sur les {HEATMAP_DAYS} derniers jours</p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-base-700/60 bg-base-800/60 p-4">
        <h2 className="mb-3 text-sm font-medium text-base-300">Assiduité — les 10 dernières semaines</h2>
        <div className="flex gap-1.5 overflow-x-auto scroll-hidden pb-1" role="img" aria-label="Carte de chaleur de tes validations de tâches">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1.5">
              {week.map((day) => {
                const level = intensityLevel(day);
                const date = fromDateKey(day.date);
                return (
                  <div
                    key={day.date}
                    title={`${toDateKey(date)} — ${day.done}/${day.total} tâche${day.total > 1 ? 's' : ''}`}
                    className={clsx('size-3.5 rounded-[4px] transition-colors', INTENSITY_CLASSES[level])}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-base-400">
          <span>Moins</span>
          {INTENSITY_CLASSES.map((c, i) => (
            <span key={i} className={clsx('size-3 rounded-[3px]', c)} />
          ))}
          <span>Plus</span>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  sublabel?: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-base-700/60 bg-base-800/60 p-4">
      <span className={clsx('grid size-9 place-items-center rounded-xl bg-base-700/50', accent)}>
        <Icon className="size-4.5" />
      </span>
      <div>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-base-300">{label}</p>
        {sublabel && <p className="text-[11px] text-base-500">{sublabel}</p>}
      </div>
    </div>
  );
}
