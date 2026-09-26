/** Hand-made decorative SVGs (own artwork – no external assets). */
import type { SVGProps } from 'react';

type DecorProps = SVGProps<SVGSVGElement>;

export function Sparkle(props: DecorProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path fill="currentColor" d="M12 0c.6 5.6 2.4 7.4 12 12-9.6 4.6-11.4 6.4-12 12-.6-5.6-2.4-7.4-12-12C9.6 7.4 11.4 5.6 12 0Z" />
    </svg>
  );
}

export function HeartShape(props: DecorProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M12 21.4 10.6 20C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.6 11.5L12 21.4Z"
      />
    </svg>
  );
}

export function Cloud(props: DecorProps) {
  return (
    <svg viewBox="0 0 120 50" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M22 48c-11 0-20-7-20-16s8-15 18-15c3-9 12-15 23-15 12 0 22 7 25 17 2-1 5-2 8-2 10 0 18 6 19 14 9 1 16 7 16 13v4H22Z"
      />
    </svg>
  );
}

export function Leaf(props: DecorProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path fill="currentColor" d="M20 3C9 3 4 9 4 16c0 2 .5 3.6 1.2 5 .7-4 3.6-8.8 9.8-11.8-4.6 3.3-7.2 7.4-8 11.6C8 21.6 9.4 22 11 22c7 0 11-6 9-19Z" />
    </svg>
  );
}

export function Petal(props: DecorProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path fill="currentColor" d="M12 2c3 3.5 5 6.8 5 10a5 5 0 0 1-10 0c0-3.2 2-6.5 5-10Zm0 0" />
    </svg>
  );
}
