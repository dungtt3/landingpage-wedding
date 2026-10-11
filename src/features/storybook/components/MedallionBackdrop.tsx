import { gsap } from 'gsap';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { MedallionConfig, NormRect } from '../engine/sceneTypes';
import { AssetImage } from './AssetImage';
import { useStorybook } from './StorybookContext';

const pct = (v: number) => `${v * 100}%`;
const rectStyle = (r: NormRect): CSSProperties => ({ left: pct(r.x), top: pct(r.y), width: pct(r.width), height: pct(r.height) });

/**
 * The floral medallion behind the closed card, split into layers: a still
 * layer, the lattice ring turning slowly in place, and every flower / sprig
 * swaying on its own rhythm (CSS animations, off under reduced motion).
 * Tapping a flower makes it pop; the petal burst itself is fired by the
 * envelope, which listens for every tap on the screen.
 */
export function MedallionBackdrop({ config }: { config: MedallionConfig }) {
  const { assets } = useStorybook();
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const hasArt = Boolean(assets[config.deco]?.src && assets[config.ring.asset]?.src);

  // Fade the medallion in once every layer has decoded, so it never appears piece by piece.
  useEffect(() => {
    if (!hasArt || !rootRef.current) return;
    let cancelled = false;
    const imgs = [...rootRef.current.querySelectorAll('img')];
    Promise.allSettled(imgs.map((img) => img.decode())).then(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [hasArt]);

  // Purely decorative: render nothing until the art is there (no placeholders).
  if (!hasArt) return null;

  const pop = (el: HTMLElement) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(el, { scale: 1.18 }, { scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.45)', overwrite: true });
  };

  return (
    <div ref={rootRef} className="sb-medallion" data-ready={ready} aria-hidden="true">
      <AssetImage asset={config.deco} className="sb-medallion__layer" />
      <div className="sb-medallion__ring" style={{ ...rectStyle(config.ring.rect), '--sb-turn': `${config.ring.turnSeconds}s` } as CSSProperties}>
        <AssetImage asset={config.ring.asset} className="sb-fill-img" />
      </div>
      {config.sprites.map((s, i) => (
        <span
          key={s.asset}
          className="sb-medallion__sprite"
          style={rectStyle(s.rect)}
          onPointerDown={(e) => pop(e.currentTarget)}
        >
          <AssetImage
            asset={s.asset}
            className={`sb-fill-img sb-medallion__${s.kind}`}
            style={
              {
                transformOrigin: `${pct(s.pivot[0])} ${pct(s.pivot[1])}`,
                // Different speed and phase per sprite so they never move in lockstep.
                '--sb-sway-dur': `${(s.kind === 'sprig' ? 3.6 : 2.8) + ((i * 0.53) % 1.7)}s`,
                '--sb-sway-delay': `${-((i * 1.37) % 3)}s`,
              } as CSSProperties
            }
          />
        </span>
      ))}
    </div>
  );
}
