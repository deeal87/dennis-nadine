import { Component, type ErrorInfo, type ReactNode } from 'react';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

interface State {
  error: Error | null;
}

/** Prevents white screens: shows a friendly message instead of crashing the app. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Kept for debugging in the browser console; no data leaves the device.
    console.warn('Ansicht konnte nicht geladen werden:', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    const chunkError = /dynamically imported module|Failed to fetch/i.test(this.state.error.message);
    return (
      <EmptyState
        emoji="🌧️"
        title="Hier ist etwas schiefgelaufen"
        text={
          chunkError
            ? 'Diese Seite konnte nicht geladen werden – vielleicht gibt es eine neue Version. Einmal neu laden hilft meistens.'
            : 'Keine Sorge, eure Daten sind sicher gespeichert. Versucht es einfach noch einmal.'
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => this.setState({ error: null })} variant="secondary">
              Nochmal versuchen
            </Button>
            <Button onClick={() => window.location.reload()}>Neu laden</Button>
          </div>
        }
      />
    );
  }
}
