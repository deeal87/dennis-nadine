import { useCallback, useMemo } from 'react';
import type { BaseEntity } from '@/types/models';
import type { Draft, Repository } from '@/data/repositories';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Unbekannter Fehler';
}

/**
 * Create / update / delete with user feedback: toasts on success and failure,
 * confirmation before deleting and an undo action afterwards.
 */
export function useEntityActions<T extends BaseEntity>(repository: Repository<T>, noun: string) {
  const toast = useToast();
  const confirm = useConfirm();

  const save = useCallback(
    async (draft: Draft<T>, id?: string): Promise<T | null> => {
      try {
        const entity = id ? await repository.update(id, draft) : await repository.create(draft);
        toast({ message: id ? `${noun} gespeichert` : `${noun} hinzugefügt ✨` });
        return entity;
      } catch (error) {
        toast({ tone: 'error', message: `Speichern fehlgeschlagen: ${message(error)}` });
        return null;
      }
    },
    [repository, noun, toast],
  );

  const patch = useCallback(
    async (id: string, changes: Partial<Draft<T>>): Promise<T | null> => {
      try {
        return await repository.update(id, changes);
      } catch (error) {
        toast({ tone: 'error', message: `Änderung fehlgeschlagen: ${message(error)}` });
        return null;
      }
    },
    [repository, toast],
  );

  const remove = useCallback(
    async (entity: T, name: string): Promise<boolean> => {
      const confirmed = await confirm({
        title: `${noun} löschen?`,
        message: `„${name}“ wird gelöscht. Direkt danach könnt ihr das noch rückgängig machen.`,
      });
      if (!confirmed) return false;
      try {
        await repository.remove(entity.id);
        toast({
          message: `„${name}“ gelöscht`,
          action: {
            label: 'Rückgängig',
            onClick: () =>
              void repository.restore(entity).then(
                () => toast({ tone: 'info', message: `„${name}“ ist wieder da 💖` }),
                (error: unknown) => toast({ tone: 'error', message: message(error) }),
              ),
          },
        });
        return true;
      } catch (error) {
        toast({ tone: 'error', message: `Löschen fehlgeschlagen: ${message(error)}` });
        return false;
      }
    },
    [repository, noun, confirm, toast],
  );

  return useMemo(() => ({ save, patch, remove }), [save, patch, remove]);
}
