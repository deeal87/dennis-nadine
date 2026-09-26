export type RandomSource = () => number;

export function pickRandom<T>(items: readonly T[], random: RandomSource = Math.random): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}
