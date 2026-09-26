import { useState } from 'react';
import type { DatePlace } from '@/types/models';
import { FilterChips } from '@/components/ui/FilterChips';
import { SwitchField } from '@/components/ui/form';
import { ROULETTE_FILTERS, spinRoulette } from '../dates/roulette';
import { dateToPick } from './pickers';
import { RouletteDialog } from './RouletteDialog';

interface DateRouletteProps {
  open: boolean;
  onClose: () => void;
  places: readonly DatePlace[];
}

export function DateRoulette({ open, onClose, places }: DateRouletteProps) {
  const [filterId, setFilterId] = useState('all');
  const [onlyNew, setOnlyNew] = useState(false);

  return (
    <RouletteDialog
      open={open}
      onClose={onClose}
      title="Date-Roulette"
      spin={(previousId) => {
        const place = spinRoulette(places, { filterId, onlyNew, excludeId: previousId });
        return place && dateToPick(place);
      }}
      emptyText={places.length === 0 ? 'Noch keine Orte gespeichert – tragt euer erstes Abenteuer ein!' : 'Zu diesem Filter passt gerade nichts.'}
      controls={
        <>
          <FilterChips label="Art des Dates" filters={ROULETTE_FILTERS} value={filterId} onChange={setFilterId} items={places} />
          <SwitchField label="Nur Orte, an denen wir noch nicht waren" checked={onlyNew} onChange={setOnlyNew} />
        </>
      }
    />
  );
}
