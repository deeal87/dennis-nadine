import { useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { detectPlatform, getDerivedThumbnail, getEmbedUrl, PLATFORM_LABELS, type Platform } from '@/lib/social';
import { toSafeUrl, hostnameOf } from '@/lib/url';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/cn';
import { SmartImage } from '../ui/SmartImage';
import { buttonClasses } from '../ui/Button';

const PLATFORM_STYLE: Record<Platform, { emoji: string; gradient: string }> = {
  tiktok: { emoji: '🎵', gradient: 'from-[#25f4ee]/40 via-surface-2 to-[#fe2c55]/40' },
  instagram: { emoji: '📸', gradient: 'from-[#feda75]/50 via-[#d62976]/30 to-[#4f5bd5]/40' },
  youtube: { emoji: '▶️', gradient: 'from-[#ff0000]/30 via-surface-2 to-peach-soft' },
  pinterest: { emoji: '📌', gradient: 'from-[#e60023]/30 via-surface-2 to-rose-soft' },
  facebook: { emoji: '👍', gradient: 'from-[#1877f2]/30 via-surface-2 to-violet-soft' },
  web: { emoji: '🔗', gradient: 'from-violet-soft via-surface-2 to-rose-soft' },
};

export function PlatformBadge({ url }: { url?: string }) {
  const platform = detectPlatform(url);
  if (!platform) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 text-xs font-bold text-bg backdrop-blur">
      <span aria-hidden>{PLATFORM_STYLE[platform].emoji}</span>
      {PLATFORM_LABELS[platform]}
    </span>
  );
}

interface MediaPreviewProps {
  url?: string;
  title?: string;
  description?: string;
  date?: string;
  /** Stored thumbnail (e.g. from the optional oEmbed lookup or entered manually). */
  thumbnailUrl?: string;
  /** Allow loading the platform's embed player on request. */
  allowEmbed?: boolean;
  className?: string;
}

/**
 * Best-effort social media preview. Always renders a link card; the official
 * embed player is only loaded when the user asks for it, and if the platform
 * refuses the embed the link card stays usable. Never throws.
 */
export function MediaPreview({ url, title, description, date, thumbnailUrl, allowEmbed = true, className }: MediaPreviewProps) {
  const [showEmbed, setShowEmbed] = useState(false);
  const safeUrl = toSafeUrl(url);
  if (!safeUrl) return null;

  const platform = detectPlatform(safeUrl) ?? 'web';
  const style = PLATFORM_STYLE[platform];
  const embedUrl = allowEmbed ? getEmbedUrl(safeUrl) : undefined;
  const thumb = thumbnailUrl ?? getDerivedThumbnail(safeUrl);
  const label = PLATFORM_LABELS[platform];

  return (
    <div className={cn('overflow-hidden rounded-3xl border border-line bg-surface', className)}>
      {showEmbed && embedUrl ? (
        <div className={cn('relative w-full bg-black', platform === 'youtube' ? 'aspect-video' : 'aspect-[9/16] max-h-[70dvh] mx-auto')}>
          <iframe
            src={embedUrl}
            title={title ? `${label}: ${title}` : `${label}-Beitrag`}
            className="absolute inset-0 size-full"
            loading="lazy"
            allow="encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
          />
        </div>
      ) : (
        <SmartImage
          src={thumb}
          alt={title ?? `${label}-Vorschau`}
          aspect="aspect-video"
          fallback={
            <div className={cn('absolute inset-0 grid place-items-center bg-gradient-to-br', style.gradient)}>
              <div className="text-center">
                <span className="text-5xl" aria-hidden>
                  {style.emoji}
                </span>
                <p className="mt-2 font-display text-lg font-semibold">{label}</p>
              </div>
            </div>
          }
        />
      )}
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
          <span>
            {style.emoji} {label}
          </span>
          <span aria-hidden>·</span>
          <span className="truncate">{hostnameOf(safeUrl)}</span>
          {date && (
            <>
              <span aria-hidden>·</span>
              <span>{formatDate(date)}</span>
            </>
          )}
        </div>
        {title && <p className="font-bold leading-snug">{title}</p>}
        {description && <p className="line-clamp-3 text-sm text-muted">{description}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          <a href={safeUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses('primary', 'sm')}>
            Beitrag öffnen <ExternalLink className="size-4" aria-hidden />
          </a>
          {embedUrl && !showEmbed && (
            <button type="button" className={buttonClasses('secondary', 'sm')} onClick={() => setShowEmbed(true)}>
              <Play className="size-4" aria-hidden /> Hier abspielen
            </button>
          )}
        </div>
        {showEmbed && (
          <p className="text-xs text-muted">
            Wird nichts angezeigt? Manche Beiträge erlauben kein Einbetten – dann einfach „Beitrag öffnen“.
          </p>
        )}
      </div>
    </div>
  );
}
