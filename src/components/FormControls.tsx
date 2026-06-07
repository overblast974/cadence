import { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';
import type { Category, Weekday } from '../types';
import { WEEKDAY_SHORT_LABELS, WEEKDAY_LABELS } from '../lib/date';
import { colorStyle } from '../lib/categoryStyles';
import { CategoryIcon } from './CategoryIcon';

const fieldClass =
  'w-full rounded-xl border border-base-700 bg-base-900/60 px-3.5 py-2.5 text-[15px] text-base-50 placeholder:text-base-500 outline-none transition-colors focus:border-accent-violet-soft focus:ring-2 focus:ring-accent-violet/30';

export function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wide text-base-300">
        {label}
      </label>
      {children}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(fieldClass, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={props.rows ?? 2} className={clsx(fieldClass, 'resize-none', props.className)} />;
}

interface CategoryPickerProps {
  categories: Category[];
  value?: string;
  onChange: (id: string | undefined) => void;
}

export function CategoryPicker({ categories, value, onChange }: CategoryPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Catégorie">
      <button
        type="button"
        onClick={() => onChange(undefined)}
        role="radio"
        aria-checked={!value}
        className={clsx(
          'rounded-full border px-3 py-1.5 text-sm transition-colors',
          !value ? 'border-base-300 bg-base-700 text-base-50' : 'border-base-700 text-base-300 hover:text-base-50',
        )}
      >
        Aucune
      </button>
      {categories.map((cat) => {
        const style = colorStyle(cat.color);
        const active = value === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(cat.id)}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all',
              active ? clsx('border-transparent', style.soft, style.ring) : 'border-base-700 text-base-300 hover:text-base-50',
            )}
          >
            <CategoryIcon name={cat.icon} className="size-3.5" />
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

interface WeekdayPickerProps {
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
}

const ALL_DAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

export function WeekdayPicker({ value, onChange }: WeekdayPickerProps) {
  function toggle(day: Weekday) {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort());
  }

  return (
    <div className="flex gap-1.5" role="group" aria-label="Jours de la semaine">
      {ALL_DAYS.map((day) => {
        const active = value.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            aria-pressed={active}
            aria-label={WEEKDAY_LABELS[day]}
            className={clsx(
              'grid size-9 place-items-center rounded-full border text-sm font-medium transition-colors',
              active
                ? 'border-transparent bg-accent-violet text-base-950'
                : 'border-base-700 text-base-300 hover:border-base-500 hover:text-base-50',
            )}
          >
            {WEEKDAY_SHORT_LABELS[day]}
          </button>
        );
      })}
    </div>
  );
}

export function PrimaryButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-violet to-accent-coral px-4 py-2.5 text-[15px] font-semibold text-base-950 shadow-glow transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
        className,
      )}
    />
  );
}

export function GhostButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl border border-base-700 px-4 py-2.5 text-[15px] font-medium text-base-300 transition-colors hover:border-base-500 hover:text-base-50',
        className,
      )}
    />
  );
}
