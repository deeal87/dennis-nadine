import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Anime } from '@/types/models';
import { animeRepository } from '@/data/repositories';
import { useStore } from '@/hooks/useStore';
import { useEditor } from '@/hooks/useEditor';
import { useEntityActions } from '@/hooks/useEntityActions';
import { useDetailParam } from '@/hooks/useDetailParam';
import { useRankingActions } from '@/hooks/useRankingActions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { FilterChips } from '@/components/ui/FilterChips';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardGrid } from '@/components/cards/MediaCard';
import { DetailModal, DetailSection, FactList } from '@/components/cards/DetailModal';
import { RankingBoard } from '@/components/collection/RankingBoard';
import { RatingsDetails } from '@/components/ui/RatingStars';
import { Tag } from '@/components/ui/Tag';
import { applyFilter } from '@/lib/filters';
import { resolveRanking } from '@/lib/ranking';
import { formatDate } from '@/lib/date';
import { ANIME_FILTERS, ANIME_STATUS_META } from './config';
import { AnimeCard } from './AnimeCard';
import { AnimeForm } from './AnimeForm';
import { InterestBadges } from './InterestBadges';

const STATUS_ORDER = { watching: 0, planned: 1, paused: 2, completed: 3, dropped: 4 } as const;

export default function AnimePage() {
  useDocumentTitle('Anime');
  const { items, loading } = useStore('anime');
  const editor = useEditor<Anime>();
  const detail = useDetailParam();
  const actions = useEntityActions(animeRepository, 'Anime');
  const [filter, setFilter] = useState('all');

  const ids = useMemo(() => items.map((a) => a.id), [items]);
  const top3 = useRankingActions('anime-top3', ids);
  const ranked = useMemo(() => resolveRanking(top3.ids, items), [top3.ids, items]);
  const candidates = useMemo(
    () =>
      items
        .filter((a) => !top3.ids.includes(a.id) && a.status !== 'completed' && a.status !== 'dropped')
        .sort((a, b) => a.title.localeCompare(b.title, 'de')),
    [items, top3.ids],
  );

  const visible = useMemo(
    () =>
      applyFilter(items, ANIME_FILTERS, filter).sort(
        (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.title.localeCompare(b.title, 'de'),
      ),
    [items, filter],
  );
  const selected = items.find((a) => a.id === detail.id);

  const remove = async (anime: Anime) => {
    if (await actions.remove(anime, anime.title)) detail.close();
  };

  return (
    <>
      <PageHeader
        emoji="🎬"
        title="Unsere Anime-Welt"
        subtitle="Was wir schauen, geschaut haben und unbedingt noch schauen wollen."
        actions={
          <Button icon={Plus} onClick={editor.openNew}>
            Anime hinzufügen
          </Button>
        }
      />

      <div className="flex flex-col gap-8">
        <RankingBoard
          title="Unsere Top 3 – Was schauen wir als Nächstes?"
          subtitle="Ziehen zum Sortieren · Platz 1 wird als Nächstes geschaut"
          items={ranked}
          limit={top3.limit}
          layout="podium"
          getLabel={(a) => a.title}
          getImage={(a) => a.coverUrl}
          renderMeta={(a) => ANIME_STATUS_META[a.status].label}
          fallbackEmoji="🎬"
          onReorder={top3.reorder}
          onRemove={top3.remove}
          candidates={candidates}
          onAdd={(id) => top3.add(id)}
          onOpen={(a) => detail.open(a.id)}
          emptyText="Unsere nächsten Abenteuer warten noch..."
        />

        <section aria-label="Alle Anime" className="flex flex-col gap-4">
          <FilterChips label="Anime filtern" filters={ANIME_FILTERS} value={filter} onChange={setFilter} items={items} />
          {!loading && items.length === 0 ? (
            <EmptyState
              emoji="🍿"
              title="Unser nächstes Abenteuer wartet..."
              text="Noch keine Anime eingetragen."
              action={
                <Button icon={Plus} onClick={editor.openNew}>
                  Ersten Anime eintragen
                </Button>
              }
            />
          ) : visible.length === 0 ? (
            <p className="py-10 text-center text-muted">In dieser Kategorie ist gerade nichts. 🌙</p>
          ) : (
            <CardGrid className="xl:grid-cols-4">
              {visible.map((anime) => (
                <li key={anime.id}>
                  <AnimeCard
                    anime={anime}
                    inTop3={top3.has(anime.id)}
                    top3Full={top3.full}
                    onOpen={() => detail.open(anime.id)}
                    onEdit={() => editor.openEdit(anime)}
                    onDelete={() => void remove(anime)}
                    onAddTop3={() => top3.add(anime.id)}
                  />
                </li>
              ))}
            </CardGrid>
          )}
        </section>
      </div>

      {selected && (
        <DetailModal
          open
          onClose={detail.close}
          title={selected.title}
          image={selected.coverUrl}
          fallbackEmoji="🎬"
          badges={
            <Tag tone={ANIME_STATUS_META[selected.status].tone}>
              {ANIME_STATUS_META[selected.status].emoji} {ANIME_STATUS_META[selected.status].label}
            </Tag>
          }
          subtitle={selected.genres.join(' · ')}
          onEdit={() => editor.openEdit(selected)}
          onDelete={() => void remove(selected)}
        >
          <InterestBadges people={selected.interestedBy} />
          <FactList
            facts={[
              ['Episoden', selected.episodes],
              ['Gesehen am', formatDate(selected.watchedAt)],
              ['Top 3', top3.has(selected.id) ? `Platz ${top3.ids.indexOf(selected.id) + 1}` : undefined],
            ]}
          />
          <RatingsDetails ratings={selected} />
          {selected.notes && (
            <DetailSection title="Notizen">
              <p className="whitespace-pre-line">{selected.notes}</p>
            </DetailSection>
          )}
        </DetailModal>
      )}

      {editor.open && (
        <AnimeForm anime={editor.entity} onClose={editor.close} onSave={(draft, id) => actions.save(draft, id)} />
      )}
    </>
  );
}
