import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { toSafeUrl } from '@/lib/url';

interface SmartImageProps {
  src?: string;
  alt: string;
  /** Tailwind aspect class, reserves space to avoid layout shift. */
  aspect?: string;
  className?: string;
  /** Rendered when there is no image or it fails to load. */
  fallback?: ReactNode;
  fallbackEmoji?: string;
  eager?: boolean;
}

/**
 * Lazy image with fixed aspect ratio and graceful fallback. External images
 * never block rendering; broken URLs show an illustrated placeholder.
 */
export function SmartImage({ src, alt, aspect = 'aspect-[4/3]', className, fallback, fallbackEmoji = '✨', eager }: SmartImageProps) {
  const safeSrc = toSafeUrl(src) ?? (src?.startsWith('data:image/') ? src : undefined);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const showImage = safeSrc && failedSrc !== safeSrc;

  return (
    <div className={cn('relative overflow-hidden bg-surface-2', aspect, className)}>
      {showImage ? (
        <>
          {!loaded && <div className="skeleton absolute inset-0" aria-hidden />}
          <img
            src={safeSrc}
            alt={alt}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={() => setFailedSrc(safeSrc)}
            className={cn('absolute inset-0 size-full object-cover transition duration-500', loaded ? 'opacity-100' : 'opacity-0')}
          />
        </>
      ) : (
        (fallback ?? <ImagePlaceholder emoji={fallbackEmoji} label={alt} />)
      )}
    </div>
  );
}

/** Illustrated placeholder: soft gradient, wave pattern and a big emoji. */
function ImagePlaceholder({ emoji, label, seed = label }: { emoji: string; label: string; seed?: string }) {
  const hue = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return (
    <div
      role="img"
      aria-label={label}
      className="absolute inset-0 grid place-items-center"
      style={{
        backgroundColor: `hsl(${hue} 70% 88% / 0.5)`,
        backgroundImage: `radial-gradient(circle at 30% 20%, hsl(${hue} 90% 85% / .7), transparent 60%), radial-gradient(circle at 80% 90%, hsl(${(hue + 60) % 360} 80% 80% / .6), transparent 55%)`,
      }}
    >
      <div className="pattern-waves absolute inset-0" aria-hidden />
      <span className="relative text-5xl drop-shadow-sm" aria-hidden>
        {emoji}
      </span>
    </div>
  );
}
