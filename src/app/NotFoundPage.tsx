import { Link } from 'react-router';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonClasses } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PATHS } from './paths';

export default function NotFoundPage() {
  useDocumentTitle('Nicht gefunden');
  return (
    <EmptyState
      emoji="🗺️"
      title="Diesen Ort gibt es (noch) nicht"
      text="Vielleicht ein neues Abenteuer für später? Zurück nach Hause geht es hier:"
      action={
        <Link to={PATHS.home} className={buttonClasses()}>
          Nach Hause
        </Link>
      }
    />
  );
}
