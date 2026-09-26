import { useEffect, useMemo, useState } from 'react';
import { Camera, LoaderCircle, Plus, ScanLine, Trash2 } from 'lucide-react';
import type { OwnershipStatus } from '@/types/models';
import type { Draft } from '@/data/repositories';
import { Modal } from '@/components/ui/Modal';
import { Button, IconButton } from '@/components/ui/Button';
import { SelectField, inputClass } from '@/components/ui/form';
import { Tag } from '@/components/ui/Tag';
import { createId } from '@/lib/id';
import { normalizeText } from '@/lib/text';
import { cn } from '@/lib/cn';
import { getRecognitionProvider, type RecognitionCandidate } from './recognition';
import { STATUS_OPTIONS } from './CollectibleForm';
import type { CollectibleItem, CollectionConfig } from './types';

interface Row extends RecognitionCandidate {
  id: string;
  selected: boolean;
}

interface PhotoCaptureProps<T extends CollectibleItem> {
  config: CollectionConfig<T>;
  existingNames: readonly string[];
  onClose: () => void;
  onAdd: (drafts: Draft<T>[]) => Promise<boolean>;
}

const emptyRow = (): Row => ({ id: createId(), name: '', selected: true });

/**
 * "Sammlung per Foto erfassen": pick a photo, let a registered recognition
 * provider suggest entries (if any), then confirm everything manually.
 * The photo never leaves the device unless a provider is configured.
 */
export function PhotoCapture<T extends CollectibleItem>({ config, existingNames, onClose, onAdd }: PhotoCaptureProps<T>) {
  const provider = getRecognitionProvider();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [status, setStatus] = useState<OwnershipStatus>('owned');
  const [recognizing, setRecognizing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => void (previewUrl && URL.revokeObjectURL(previewUrl)), [previewUrl]);

  const existing = useMemo(() => new Set(existingNames.map(normalizeText)), [existingNames]);
  const chosen = rows.filter((r) => r.selected && r.name.trim());

  const updateRow = (id: string, patch: Partial<Row>) => setRows((all) => all.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const recognize = async () => {
    if (!provider || !file) return;
    setRecognizing(true);
    setMessage(null);
    try {
      const found = await provider.recognize(file, config.domain);
      if (found.length === 0) setMessage('Auf dem Foto wurde nichts erkannt – tragt die Einträge einfach selbst ein.');
      setRows((all) => [...all.filter((r) => r.name.trim()), ...found.map((c) => ({ ...c, id: createId(), selected: true })), emptyRow()]);
    } catch {
      setMessage('Die Erkennung ist gerade nicht erreichbar. Manuelles Eintragen funktioniert trotzdem.');
    } finally {
      setRecognizing(false);
    }
  };

  const submit = async () => {
    if (chosen.length === 0) return;
    setSaving(true);
    const drafts = chosen.map(
      (row) =>
        ({
          name: row.name.trim(),
          status,
          favorite: false,
          [config.groupKey]: row.group?.trim() || undefined,
          [config.numberKey]: row.number?.trim() || undefined,
        }) as unknown as Draft<T>,
    );
    const added = await onAdd(drafts);
    setSaving(false);
    if (added) onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Sammlung per Foto erfassen"
      description={`Foto auswählen, ${config.nounPlural} bestätigen, fertig.`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={submit} disabled={chosen.length === 0 || saving} icon={Plus}>
            Ausgewählte hinzufügen ({chosen.length})
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
          <label className="relative grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-3xl border-2 border-dashed border-line bg-surface-2 text-center transition hover:border-violet">
            {previewUrl ? (
              <img src={previewUrl} alt="Ausgewähltes Foto" className="absolute inset-0 size-full object-cover" />
            ) : (
              <span className="p-4 text-sm font-bold text-muted">
                <Camera className="mx-auto mb-2 size-8 text-violet" aria-hidden />
                Foto aufnehmen oder auswählen
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setMessage(null);
              }}
            />
          </label>
          <div className="flex flex-col gap-3 text-sm">
            {provider ? (
              <>
                <p>
                  Erkennung über <strong>{provider.label}</strong>. Das Foto wird dafür an diesen Dienst gesendet.
                </p>
                <Button variant="soft" icon={recognizing ? LoaderCircle : ScanLine} onClick={recognize} disabled={!file || recognizing} className="self-start">
                  {recognizing ? 'Erkenne …' : 'Automatisch erkennen'}
                </Button>
              </>
            ) : (
              <p className="rounded-2xl bg-violet-soft p-3 text-ink">
                <strong>Ehrlich gesagt:</strong> Eine automatische Bilderkennung ist (noch) nicht verbunden. Nutzt das Foto als Spickzettel und
                tippt die {config.nounPlural} unten schnell ein – mit <kbd className="font-bold">Enter</kbd> geht es zur nächsten Zeile. Das Foto
                bleibt nur auf diesem Gerät und wird nicht gespeichert.
              </p>
            )}
            {message && (
              <p className="text-muted" role="status">
                {message}
              </p>
            )}
            <SelectField label="Hinzufügen als" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-display text-lg font-semibold">Gefundene {config.nounPlural}</legend>
          {rows.map((row, index) => {
            const duplicate = row.name.trim() && existing.has(normalizeText(row.name));
            return (
              <div key={row.id} className={cn('flex flex-wrap items-center gap-2 rounded-2xl border border-line p-2', !row.selected && 'opacity-60')}>
                <input
                  type="checkbox"
                  aria-label={`${row.name || `Zeile ${index + 1}`} übernehmen`}
                  className="size-5 accent-[var(--rose)]"
                  checked={row.selected}
                  onChange={(e) => updateRow(row.id, { selected: e.target.checked })}
                />
                <input
                  className={cn(inputClass, 'min-w-0 flex-[2_1_10rem]')}
                  placeholder="Name"
                  aria-label={`Name ${index + 1}`}
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setRows((all) => [...all, emptyRow()]);
                      requestAnimationFrame(() => {
                        const inputs = document.querySelectorAll<HTMLInputElement>('[data-capture-name]');
                        inputs[inputs.length - 1]?.focus();
                      });
                    }
                  }}
                  data-capture-name
                />
                <input
                  className={cn(inputClass, 'min-w-0 flex-[1_1_7rem]')}
                  placeholder={config.groupLabel}
                  aria-label={`${config.groupLabel} ${index + 1}`}
                  value={row.group ?? ''}
                  onChange={(e) => updateRow(row.id, { group: e.target.value })}
                />
                <input
                  className={cn(inputClass, 'w-24 min-w-0 flex-[0_1_6rem]')}
                  placeholder={config.numberLabel}
                  aria-label={`${config.numberLabel} ${index + 1}`}
                  value={row.number ?? ''}
                  onChange={(e) => updateRow(row.id, { number: e.target.value })}
                />
                {row.confidence !== undefined && <Tag tone="violet">{Math.round(row.confidence * 100)} %</Tag>}
                {duplicate && <Tag tone="peach">schon vorhanden</Tag>}
                <IconButton icon={Trash2} label={`Zeile ${index + 1} entfernen`} onClick={() => setRows((all) => all.filter((r) => r.id !== row.id))} />
              </div>
            );
          })}
          <Button variant="soft" size="sm" icon={Plus} onClick={() => setRows((all) => [...all, emptyRow()])} className="self-start">
            Weitere Zeile
          </Button>
        </fieldset>
      </div>
    </Modal>
  );
}
