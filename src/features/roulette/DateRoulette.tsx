import { useState } from 'react';
import type { DatePlace } from '@/types/models';
import { dateRepository, settingsRepository } from '@/data/repositories';
import { useSettings } from '@/hooks/useStore';
import { useToast } from '@/components/ui/Toast';
import { FilterChips } from '@/components/ui/FilterChips';
import { ChipGroup, SelectField, SwitchField, TextField } from '@/components/ui/form';
import { mapsSearchUrl } from '@/lib/maps';
import { cn } from '@/lib/cn';
import { ROULETTE_FILTERS, spinRoulette } from '../dates/roulette';
import { DEFAULT_REGION, DISCOVER_TYPES, REGIONS } from '../discover/config';
import { discoverPlace } from '../discover/discover';
import type { DiscoveredPlace } from '../discover/overpass';
import { dateToPick } from './pickers';
import { RouletteDialog, type PickResult } from './RouletteDialog';

interface DateRouletteProps {
  open: boolean;
  onClose: () => void;
  places: readonly DatePlace[];
}

type Mode = 'ours' | 'discover';

const MODES: Array<{ id: Mode; label: string; hint: string }> = [
  { id: 'ours', label: '💞 Unsere Orte', hint: 'Aus euren gespeicherten Abenteuern' },
  { id: 'discover', label: '🧭 Neu entdecken', hint: 'Echte Orte aus OpenStreetMap' },
];

const TYPE_OPTIONS = DISCOVER_TYPES.map((t) => ({ value: t.id, label: t.label, emoji: t.emoji }));
const REGION_OPTIONS = REGIONS.map((r) => ({ value: r.code, label: r.name }));

export function DateRoulette({ open, onClose, places }: DateRouletteProps) {
  const toast = useToast();
  const { discoverRegion } = useSettings();
  const [mode, setMode] = useState<Mode>('ours');
  const [filterId, setFilterId] = useState('all');
  const [onlyNew, setOnlyNew] = useState(false);
  const [typeId, setTypeId] = useState(DISCOVER_TYPES[0]!.id);
  const [city, setCity] = useState('');
  const region = discoverRegion ?? DEFAULT_REGION;

  const save = async (place: DiscoveredPlace): Promise<boolean> => {
    const type = DISCOVER_TYPES.find((t) => t.id === place.typeId) ?? DISCOVER_TYPES[0]!;
    try {
      await dateRepository.create({
        name: place.name,
        category: type.dateCategory,
        status: 'todo',
        tags: type.tags,
        address: place.address,
        city: place.city,
        mapsUrl: mapsSearchUrl([place.name, place.address ?? place.city].filter(Boolean).join(', ')),
        description: place.cuisine ? `Küche: ${place.cuisine}` : undefined,
        notes: `Entdeckt mit dem Date-Roulette (OpenStreetMap)${place.website ? ` · ${place.website}` : ''}`,
        photoUrl: place.imageUrl,
      });
      toast({ message: `„${place.name}“ steht jetzt auf eurer Liste 💞` });
      return true;
    } catch {
      toast({ tone: 'error', message: 'Speichern fehlgeschlagen.' });
      return false;
    }
  };

  const discover = async (): Promise<PickResult | undefined> => {
    const place = await discoverPlace({ typeId, regionCode: region, city: city.trim() || undefined, knownNames: places.map((p) => p.name) });
    if (!place) return undefined;
    const type = DISCOVER_TYPES.find((t) => t.id === place.typeId) ?? DISCOVER_TYPES[0]!;
    return {
      id: place.id,
      title: place.name,
      emoji: type.emoji,
      kindLabel: `${type.emoji} ${type.label}`,
      lines: [
        ...(place.address || place.city ? [`📍 ${place.address ?? place.city}`] : []),
        ...(place.cuisine ? [`🍽️ ${place.cuisine}`] : []),
        '✨ Völlig neu für euch',
      ],
      imageUrl: place.imageUrl,
      mapsUrl: mapsSearchUrl([place.name, place.address ?? place.city].filter(Boolean).join(', ')),
      source: { label: 'Gefunden auf OpenStreetMap – Angaben ohne Gewähr', url: place.osmUrl },
      action: { label: '💾 Zu unseren Dates', doneLabel: 'Gespeichert', run: () => save(place) },
    };
  };

  const regionName = REGIONS.find((r) => r.code === region)?.name ?? '';

  return (
    <RouletteDialog
      open={open}
      onClose={onClose}
      title="Date-Roulette"
      spin={(previousId) => {
        if (mode === 'discover') return discover();
        const place = spinRoulette(places, { filterId, onlyNew, excludeId: previousId });
        return place && dateToPick(place);
      }}
      emptyText={
        mode === 'discover'
          ? `Rund um ${city.trim() || regionName} haben wir nichts Neues gefunden – andere Art oder Stadt probieren?`
          : places.length === 0
            ? 'Noch keine Orte gespeichert – probiert „Neu entdecken“!'
            : 'Zu diesem Filter passt gerade nichts.'
      }
      controls={
        <>
          <div role="radiogroup" aria-label="Woher soll die Idee kommen?" className="grid grid-cols-2 gap-2 rounded-3xl bg-surface-2 p-1.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mode === m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 py-1.5 text-sm font-bold transition',
                  mode === m.id ? 'bg-surface text-rose shadow-[var(--shadow-soft)]' : 'text-muted hover:text-ink',
                )}
              >
                {m.label}
                <span className="text-[0.7rem] font-semibold text-muted">{m.hint}</span>
              </button>
            ))}
          </div>

          {mode === 'ours' ? (
            <>
              <FilterChips label="Art des Dates" filters={ROULETTE_FILTERS} value={filterId} onChange={setFilterId} items={places} />
              <SwitchField label="Nur Orte, an denen wir noch nicht waren" checked={onlyNew} onChange={setOnlyNew} />
            </>
          ) : (
            <>
              <ChipGroup label="Was sucht ihr?" options={TYPE_OPTIONS} value={[typeId]} onChange={([v]) => v && setTypeId(v)} single />
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  label="Bundesland"
                  value={region}
                  options={REGION_OPTIONS}
                  onChange={(code) => void settingsRepository.update({ discoverRegion: code })}
                />
                <TextField label="Stadt (optional)" value={city} onChange={setCity} placeholder="z. B. Düsseldorf" autoComplete="address-level2" />
              </div>
            </>
          )}
        </>
      }
    />
  );
}
