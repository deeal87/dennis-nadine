import type { Person } from '@/types/models';
import { Tag } from '@/components/ui/Tag';

const LABELS: Record<Person, string> = { dennis: '💙 Dennis’ Wunsch', nadine: '💗 Nadines Wunsch' };

export function InterestBadges({ people }: { people?: Person[] }) {
  if (!people?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {people.map((person) => (
        <Tag key={person} tone={person === 'dennis' ? 'violet' : 'rose'}>
          {LABELS[person]}
        </Tag>
      ))}
    </div>
  );
}
