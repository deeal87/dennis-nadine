/**
 * Imperative emoji burst at a screen position (click on a heart etc.).
 * Runs outside React; elements remove themselves. No-op for reduced motion.
 */
export function burstAt(x: number, y: number, emojis: readonly string[] = ['💖', '✨', '💕', '⭐'], count = 12): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:60';
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const distance = 50 + Math.random() * 70;
    const particle = document.createElement('span');
    particle.textContent = emojis[i % emojis.length] ?? '✨';
    particle.style.cssText = `position:absolute;left:${x}px;top:${y}px;font-size:${14 + Math.random() * 14}px;--dx:${Math.cos(angle) * distance}px;--dy:${Math.sin(angle) * distance}px;animation:burst ${700 + Math.random() * 400}ms cubic-bezier(.2,.8,.3,1) forwards`;
    layer.append(particle);
  }
  document.body.append(layer);
  window.setTimeout(() => layer.remove(), 1300);
}

export function burstFromElement(element: Element, emojis?: readonly string[], count?: number): void {
  const rect = element.getBoundingClientRect();
  burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, emojis, count);
}
