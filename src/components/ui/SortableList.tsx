import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';
import { moveInRanking } from '@/lib/ranking';

export interface DragHandleProps {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  'data-sort-handle': string;
  'aria-label': string;
  'aria-describedby': string;
  style: { touchAction: 'none' };
}

interface SortableListProps<T> {
  items: readonly T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  onReorder: (from: number, to: number) => void;
  renderItem: (item: T, index: number, handle: DragHandleProps, dragging: boolean) => ReactNode;
  className?: string;
}

interface DragState {
  id: string;
  from: number;
  startX: number;
  startY: number;
  originLeft: number;
  originTop: number;
  lastX: number;
  lastY: number;
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Pointer based drag & drop that works with mouse, touch and pen, in lists and
 * grids alike. Items are reordered visually with CSS `order` while dragging (no
 * DOM moves), neighbours animate via FLIP. Keyboard: arrow keys on the handle.
 */
export function SortableList<T>({ items, getId, getLabel, onReorder, renderItem, className }: SortableListProps<T>) {
  const listRef = useRef<HTMLOListElement>(null);
  const elements = useRef(new Map<string, HTMLLIElement>());
  const drag = useRef<DragState | null>(null);
  const positions = useRef(new Map<string, { left: number; top: number }>());
  const [order, setOrder] = useState<string[] | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [announcement, setAnnouncement] = useState('');
  const pendingFocus = useRef<string | null>(null);
  const instructionsId = useId();

  const ids = items.map(getId);
  const currentOrder = order ?? ids;

  const snapshotPositions = () => {
    positions.current = new Map(
      [...elements.current].map(([id, el]) => [id, { left: el.offsetLeft, top: el.offsetTop }]),
    );
  };

  const updateOffset = useCallback(() => {
    const state = drag.current;
    const el = state && elements.current.get(state.id);
    if (!state || !el) return;
    setOffset({
      x: state.lastX - state.startX - (el.offsetLeft - state.originLeft),
      y: state.lastY - state.startY - (el.offsetTop - state.originTop),
    });
  }, []);

  // After a visual reorder: keep the dragged card under the pointer and FLIP the neighbours.
  useLayoutEffect(() => {
    if (!order) return;
    updateOffset();
    if (prefersReducedMotion()) return;
    for (const [id, el] of elements.current) {
      const before = positions.current.get(id);
      if (!before || id === drag.current?.id) continue;
      const dx = before.left - el.offsetLeft;
      const dy = before.top - el.offsetTop;
      if (dx || dy) {
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 200, easing: 'ease-out' });
      }
    }
  }, [order, updateOffset]);

  useEffect(() => {
    if (!pendingFocus.current) return;
    listRef.current?.querySelector<HTMLElement>(`[data-sort-handle="${CSS.escape(pendingFocus.current)}"]`)?.focus();
    pendingFocus.current = null;
  }, [items]);

  const finish = useCallback(
    (commit: boolean) => {
      const state = drag.current;
      drag.current = null;
      if (state && commit && order) {
        const to = order.indexOf(state.id);
        if (to !== state.from) {
          onReorder(state.from, to);
          setAnnouncement(`Auf Platz ${to + 1} verschoben.`);
        }
      }
      setOrder(null);
      setOffset({ x: 0, y: 0 });
    },
    [order, onReorder],
  );

  // Window-level listeners survive re-renders and pointer capture loss.
  useEffect(() => {
    if (!order) return;
    const onMove = (event: PointerEvent) => {
      const state = drag.current;
      const list = listRef.current;
      if (!state || !list) return;
      event.preventDefault();
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      const rect = list.getBoundingClientRect();
      const x = event.clientX - rect.left + list.scrollLeft;
      const y = event.clientY - rect.top + list.scrollTop;
      const target = [...elements.current].find(
        ([id, el]) =>
          id !== state.id && x >= el.offsetLeft && x <= el.offsetLeft + el.offsetWidth && y >= el.offsetTop && y <= el.offsetTop + el.offsetHeight,
      );
      if (target) {
        const next = [...order];
        const targetIndex = next.indexOf(target[0]);
        const fromIndex = next.indexOf(state.id);
        if (targetIndex !== -1 && fromIndex !== -1) {
          snapshotPositions();
          setOrder(moveInRanking(next, fromIndex, targetIndex));
          return;
        }
      }
      updateOffset();
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    const onKey = (event: globalThis.KeyboardEvent) => event.key === 'Escape' && finish(false);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey);
    };
  }, [order, finish, updateOffset]);

  const handleProps = (id: string, index: number, label: string): DragHandleProps => ({
    'data-sort-handle': id,
    'aria-label': `${label} verschieben (Platz ${index + 1})`,
    'aria-describedby': instructionsId,
    style: { touchAction: 'none' },
    onPointerDown: (event) => {
      if (event.button !== 0) return;
      const el = elements.current.get(id);
      if (!el) return;
      event.preventDefault();
      drag.current = {
        id,
        from: index,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        originLeft: el.offsetLeft,
        originTop: el.offsetTop,
      };
      setOrder(ids);
    },
    onKeyDown: (event) => {
      const delta = event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : 0;
      if (!delta) return;
      event.preventDefault();
      const to = index + delta;
      if (to < 0 || to >= items.length) return;
      pendingFocus.current = id;
      onReorder(index, to);
      setAnnouncement(`${label}: jetzt Platz ${to + 1}.`);
    },
  });

  return (
    <>
      <p id={instructionsId} className="sr-only">
        Zum Sortieren ziehen oder mit den Pfeiltasten verschieben.
      </p>
      <p className="sr-only" aria-live="assertive">
        {announcement}
      </p>
      <ol ref={listRef} className={cn('relative', className)}>
        {items.map((item) => {
          const id = getId(item);
          const position = currentOrder.indexOf(id);
          const dragging = drag.current?.id === id && order !== null;
          return (
            <li
              key={id}
              ref={(el) => {
                if (el) elements.current.set(id, el);
                else elements.current.delete(id);
              }}
              style={{
                order: position,
                transform: dragging ? `translate(${offset.x}px, ${offset.y}px) scale(1.03)` : undefined,
                zIndex: dragging ? 20 : undefined,
              }}
              className={cn('list-none', dragging && 'cursor-grabbing drop-shadow-2xl')}
            >
              {renderItem(item, position, handleProps(id, position, getLabel(item)), dragging)}
            </li>
          );
        })}
      </ol>
    </>
  );
}
