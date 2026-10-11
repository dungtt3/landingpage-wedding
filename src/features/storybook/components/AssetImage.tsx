import type { CSSProperties } from 'react';
import { useStorybook } from './StorybookContext';

interface Props {
  asset: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders a manifest asset: the production file, its labelled placeholder,
 * or — when neither exists — a visible "missing" box instead of a broken image.
 */
export function AssetImage({ asset, className, style }: Props) {
  const { assets } = useStorybook();
  const resolved = assets[asset];
  if (!resolved) return <div className={`sb-asset-pending ${className ?? ''}`} style={style} aria-hidden="true" />;
  if (!resolved.src) {
    return (
      <div className={`sb-asset-missing ${className ?? ''}`} style={style} aria-hidden="true">
        MISSING · {asset}
      </div>
    );
  }
  return (
    <img
      className={className}
      style={style}
      src={resolved.src}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      data-asset={asset}
      data-status={resolved.status}
    />
  );
}
