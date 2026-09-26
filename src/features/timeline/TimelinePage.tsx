import { useEffect, useMemo } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { TimelineEvent } from '@/types/models';
import { timelineRepository } from '@/data/repositories';
import { COUPLE } from '@/data/seed/initialData';
import { useStore } from '@/hooks/useStore';
import { useEditor } from '@/hooks/useEditor';
import { useEntityActions } from '@/hooks/useEntityActions';
import { useDetailParam } from '@/hooks/useDetailParam';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SmartImage } from '@/components/ui/SmartImage';
import { Tag } from '@/components/ui/Tag';
import { HeartShape } from '@/components/animations/Decor';
import { daysBetween, formatDate } from '@/lib/date';
import { cn } from '@/lib/cn';
import { TIMELINE_CATEGORY_META } from './config';
import { TimelineForm } from './TimelineForm';

export default function TimelinePage() {
  useDocumentTitle('Timeline');
  const { items, loading } = useStore('timeline');
  const editor = useEditor<TimelineEvent>();
  const detail = useDetailParam();
  const actions = useEntityActions(timelineRepository, 'Moment');
  const events = useMemo(() => [...items].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)), [items]);

  // Deep links (search) scroll to and highlight the event instead of opening a dialog.
  useEffect(() => {
    if (!detail.id || loading) return;
    document.getElementById(`moment-${detail.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [detail.id, loading]);

  return (
    <>
      <PageHeader
        emoji="💞"
        title="Unsere Timeline"
        subtitle="Unsere Geschichte – Kapitel für Kapitel."
        actions={
          <Button icon={Plus} onClick={editor.openNew}>
            Moment hinzufügen
          </Button>
        }
      />
      {!loading && events.length === 0 ? (
        <EmptyState emoji="💞" title="Unsere Geschichte wartet" text="Fügt euren ersten gemeinsamen Moment hinzu." action={<Button onClick={editor.openNew}>Ersten Moment eintragen</Button>} />
      ) : (
        <ol className="relative mx-auto max-w-4xl before:absolute before:inset-y-0 before:left-5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-rose before:via-violet before:to-peach md:before:left-1/2 md:before:-translate-x-1/2">
          {events.map((event, index) => {
            const meta = TIMELINE_CATEGORY_META[event.category];
            const day = daysBetween(COUPLE.specialDate, event.date);
            const left = index % 2 === 0;
            return (
              <li
                key={event.id}
                id={`moment-${event.id}`}
                className={cn('relative mb-8 pl-14 md:w-1/2 md:pl-0', left ? 'md:pr-12' : 'md:ml-auto md:pl-12')}
                style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              >
                <span
                  className={cn(
                    'absolute left-5 top-6 grid size-10 -translate-x-1/2 place-items-center rounded-full bg-surface text-lg shadow-[var(--shadow-soft)] ring-4 ring-bg',
                    left ? 'md:left-auto md:right-0 md:translate-x-1/2' : 'md:left-0',
                  )}
                  aria-hidden
                >
                  {event.date === COUPLE.specialDate ? <HeartShape className="size-5 animate-heartbeat text-rose" /> : meta.emoji}
                </span>
                <article
                  className={cn(
                    'card overflow-hidden animate-fade-up',
                    detail.id === event.id && 'ring-4 ring-rose/40',
                    event.date === COUPLE.specialDate && 'bg-gradient-to-br from-rose-soft to-violet-soft',
                  )}
                >
                  {event.imageUrl && <SmartImage src={event.imageUrl} alt={event.title} aspect="aspect-[16/9]" fallbackEmoji={meta.emoji} />}
                  <div className="p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <time dateTime={event.date} className="font-display text-lg font-semibold text-rose">
                        {formatDate(event.date)}
                      </time>
                      <Tag tone="violet">
                        {meta.emoji} {meta.label}
                      </Tag>
                      {day > 0 && <Tag>Tag {day}</Tag>}
                    </div>
                    <h2 className="text-xl font-semibold">{event.title}</h2>
                    {event.description && <p className="mt-1 whitespace-pre-line text-muted">{event.description}</p>}
                    <div className="-mb-2 -mr-2 mt-2 flex justify-end">
                      <IconButton icon={Pencil} label={`${event.title} bearbeiten`} onClick={() => editor.openEdit(event)} />
                      <IconButton icon={Trash2} label={`${event.title} löschen`} onClick={() => void actions.remove(event, event.title)} />
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
          <li className="relative pl-14 md:pl-0">
            <span className="absolute left-5 top-2 -translate-x-1/2 text-2xl md:left-1/2" aria-hidden>
              ✨
            </span>
            <p className="pt-10 text-center font-display text-lg text-muted md:pt-12">… und die schönsten Kapitel kommen noch.</p>
          </li>
        </ol>
      )}
      {editor.open && <TimelineForm event={editor.entity} onClose={editor.close} onSave={(draft, id) => actions.save(draft, id)} />}
    </>
  );
}
