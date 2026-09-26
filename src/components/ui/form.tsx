/** Form primitives shared by all editors. */
import {
  forwardRef,
  useId,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { ChevronUp, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, IconButton } from './Button';

export const inputClass =
  'w-full min-h-11 rounded-2xl border border-line bg-surface px-3.5 py-2 text-ink placeholder:text-muted/70 transition focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/15 aria-[invalid=true]:border-danger';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode;
}

/** Label + control + hint/error, wired up for screen readers. */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      {children({ id, 'aria-describedby': message ? messageId : undefined, 'aria-invalid': error ? true : undefined })}
      {message && (
        <p id={messageId} className={cn('text-xs', error ? 'font-bold text-danger' : 'text-muted')}>
          {message}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, value, onChange, className, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(a11y) => <input ref={ref} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} {...a11y} {...rest} />}
    </Field>
  );
});

type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> & {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  hint?: string;
};

export function NumberField({ label, hint, value, onChange, className, ...rest }: NumberFieldProps) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(a11y) => (
        <input
          type="number"
          inputMode="numeric"
          className={inputClass}
          value={value ?? ''}
          onChange={(e) => {
            const next = e.target.valueAsNumber;
            onChange(Number.isFinite(next) ? next : undefined);
          }}
          {...a11y}
          {...rest}
        />
      )}
    </Field>
  );
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
};

export function TextAreaField({ label, hint, value, onChange, className, rows = 3, ...rest }: TextAreaFieldProps) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(a11y) => (
        <textarea
          rows={rows}
          className={cn(inputClass, 'resize-y leading-relaxed')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...a11y}
          {...rest}
        />
      )}
    </Field>
  );
}

export interface Option<V extends string> {
  value: V;
  label: string;
  emoji?: string;
}

type SelectFieldProps<V extends string> = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> & {
  label: string;
  value: V;
  options: readonly Option<V>[];
  onChange: (value: V) => void;
  hint?: string;
};

export function SelectField<V extends string>({ label, hint, value, options, onChange, className, ...rest }: SelectFieldProps<V>) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(a11y) => (
        <select className={cn(inputClass, 'cursor-pointer')} value={value} onChange={(e) => onChange(e.target.value as V)} {...a11y} {...rest}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.emoji ? `${option.emoji} ` : ''}
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

interface ChipGroupProps<V extends string> {
  label: string;
  options: readonly Option<V>[];
  value: readonly V[];
  onChange: (value: V[]) => void;
  /** Single choice instead of multiple. */
  single?: boolean;
  className?: string;
}

/** Toggle chips for enum-like fields (tags, status, categories). */
export function ChipGroup<V extends string>({ label, options, value, onChange, single, className }: ChipGroupProps<V>) {
  const toggle = (option: V) => {
    if (single) return onChange([option]);
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  };
  return (
    <fieldset className={cn('flex flex-col gap-1.5', className)}>
      <legend className="mb-1.5 text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.value)}
              className={cn(
                'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-bold transition',
                active ? 'border-rose bg-rose-soft text-rose' : 'border-line bg-surface text-muted hover:text-ink',
              )}
            >
              {option.emoji && <span aria-hidden>{option.emoji}</span>}
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

interface SwitchFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export function SwitchField({ label, checked, onChange, description }: SwitchFieldProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-3.5 py-2">
      <span>
        <span className="block text-sm font-bold">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-line transition peer-checked:bg-rose peer-focus-visible:ring-4 peer-focus-visible:ring-violet/30 after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
      />
    </label>
  );
}

interface ListEditorProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
  /** Show numbered steps instead of bullets. */
  numbered?: boolean;
  multiline?: boolean;
}

/** Dynamic list of text rows (ingredients, preparation steps …). */
export function ListEditor({ label, items, onChange, placeholder, addLabel, numbered, multiline }: ListEditorProps) {
  const listRef = useRef<HTMLOListElement>(null);

  const update = (index: number, value: string) => onChange(items.map((item, i) => (i === index ? value : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };
  const add = () => {
    onChange([...items, '']);
    requestAnimationFrame(() => {
      const fields = listRef.current?.querySelectorAll<HTMLElement>('input, textarea');
      fields?.[fields.length - 1]?.focus();
    });
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-bold">{label}</legend>
      <ol ref={listRef} className="flex flex-col gap-2">
        {items.map((item, index) => {
          const common = {
            value: item,
            placeholder,
            'aria-label': `${label} ${index + 1}`,
            className: cn(inputClass, multiline && 'resize-y'),
          };
          return (
            <li key={index} className="flex items-start gap-2">
              <span
                className={cn(
                  'mt-2 grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold',
                  numbered ? 'bg-rose-soft text-rose' : 'text-muted',
                )}
                aria-hidden
              >
                {numbered ? String(index + 1).padStart(2, '0') : '•'}
              </span>
              {multiline ? (
                <textarea rows={2} {...common} onChange={(e) => update(index, e.target.value)} />
              ) : (
                <input
                  {...common}
                  onChange={(e) => update(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      add();
                    }
                  }}
                />
              )}
              <IconButton
                icon={ChevronUp}
                label={`${label} ${index + 1} nach oben`}
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="hidden sm:inline-flex"
              />
              <IconButton icon={Trash2} label={`${label} ${index + 1} entfernen`} onClick={() => remove(index)} />
            </li>
          );
        })}
      </ol>
      <Button variant="soft" size="sm" icon={Plus} onClick={add} className="self-start">
        {addLabel}
      </Button>
    </fieldset>
  );
}

/** Two-column responsive grid for form fields. */
export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
