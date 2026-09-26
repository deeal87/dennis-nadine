import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Hero } from './Hero';
import { TodayCard } from './TodayCard';
import { StatCards } from './StatCards';
import { WorldOverview } from './WorldOverview';

export default function HomePage() {
  useDocumentTitle('');
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <Hero />
      <TodayCard />
      <StatCards />
      <WorldOverview />
      <p className="pb-4 text-center text-sm text-muted">
        Gemacht mit <span className="text-rose">❤️</span> für Baby & Babe
      </p>
    </div>
  );
}
