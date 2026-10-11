import landingFiles from 'virtual:landing-files';

const present: ReadonlySet<string> = new Set(landingFiles);

interface Props {
  src: string;
  alt: string;
  className?: string;
  /** Eager-load photos above the fold. */
  priority?: boolean;
}

/**
 * A landing photo, or a clearly labelled placeholder when the file does not
 * exist yet under `public/assets/landing/`. Drop the file in to replace it.
 */
export function Photo({ src, alt, className = '', priority }: Props) {
  if (present.has(src)) {
    return <img className={`ld-photo ${className}`} src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" />;
  }
  return (
    <div className={`ld-photo ld-photo--placeholder ${className}`} role="img" aria-label={`${alt} (ảnh mẫu)`}>
      <span>PLACEHOLDER</span>
      <code>{`public${src}`}</code>
    </div>
  );
}
