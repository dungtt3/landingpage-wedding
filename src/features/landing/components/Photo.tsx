import landingFiles from 'virtual:landing-files';

const present: ReadonlySet<string> = new Set(landingFiles);

/** Whether the real file exists under `public/assets/landing/` (otherwise <Photo> shows a placeholder). */
export const hasPhoto = (src: string) => present.has(src);

/** Smaller copies next to a photo: `01.webp` (1280 px wide) → `01-960.webp`, `01-480.webp`. */
const VARIANT_WIDTHS = [480, 960];
const FULL_WIDTH = 1280;

/** `srcset` from the smaller copies that exist, so phones and thumbnails download far less. */
function srcSetFor(src: string) {
  const dot = src.lastIndexOf('.');
  const variants = VARIANT_WIDTHS.map((w) => [`${src.slice(0, dot)}-${w}${src.slice(dot)}`, w] as const).filter(([v]) => present.has(v));
  if (!variants.length) return undefined;
  return [...variants, [src, FULL_WIDTH] as const].map(([v, w]) => `${v} ${w}w`).join(', ');
}

interface Props {
  src: string;
  alt: string;
  className?: string;
  /** Eager-load photos above the fold. */
  priority?: boolean;
  /** How wide the photo is drawn (the `sizes` attribute): picks the copy to download. */
  sizes?: string;
}

/**
 * A landing photo, or a clearly labelled placeholder when the file does not
 * exist yet under `public/assets/landing/`. Drop the file in to replace it.
 */
export function Photo({ src, alt, className = '', priority, sizes = '100vw' }: Props) {
  if (hasPhoto(src)) {
    const srcSet = srcSetFor(src);
    return (
      <img
        className={`ld-photo ${className}`}
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    );
  }
  return (
    <div className={`ld-photo ld-photo--placeholder ${className}`} role="img" aria-label={`${alt} (ảnh mẫu)`}>
      <span>PLACEHOLDER</span>
      <code>{`public${src}`}</code>
    </div>
  );
}
