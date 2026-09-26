import { useId, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { inputClass } from './form';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: readonly string[];
  placeholder?: string;
}

/** Free-text tags with quick suggestions (Enter or comma adds a tag). */
export function TagInput({ label, value, onChange, suggestions = [], placeholder = 'Eigenes hinzufügen …' }: TagInputProps) {
  const id = useId();
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const tag = raw.trim();
    if (tag && !value.some((v) => v.toLowerCase() === tag.toLowerCase())) onChange([...value, tag]);
    setDraft('');
  };
  const toggle = (tag: string) => (value.includes(tag) ? onChange(value.filter((v) => v !== tag)) : onChange([...value, tag]));

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={`Ausgewählt: ${label}`}>
          {value.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                onClick={() => toggle(tag)}
                aria-label={`${tag} entfernen`}
                className="inline-flex min-h-9 items-center gap-1 rounded-full bg-rose-soft pl-3 pr-2 text-sm font-bold text-rose"
              >
                {tag} <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={id}
        className={inputClass}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => {
          const next = e.target.value;
          if (next.includes(',')) next.split(',').forEach(add);
          else setDraft(next);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add(draft);
          }
        }}
        onBlur={() => draft && add(draft)}
      />
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions
            .filter((s) => !value.includes(s))
            .map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => toggle(suggestion)}
                className={cn('min-h-8 rounded-full border border-dashed border-line px-2.5 text-xs font-bold text-muted hover:border-violet hover:text-violet')}
              >
                + {suggestion}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
