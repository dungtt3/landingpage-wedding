import { useEffect, useRef, type CSSProperties, type MouseEvent } from 'react';
import { createPetalConfetti, type PetalConfetti } from '../engine/petalConfetti';
import { refKeys } from '../engine/refRegistry';
import type { EnvelopeConfig, NormRect, StorybookState } from '../engine/sceneTypes';
import { AssetImage } from './AssetImage';
import type { InvitationContent } from './InvitationOverlay';
import { MedallionBackdrop } from './MedallionBackdrop';
import { useStorybook } from './StorybookContext';

interface Props {
  config: EnvelopeConfig;
  content: InvitationContent;
  state: StorybookState;
  progress: number;
  reducedMotion: boolean;
  onActivate: () => void;
}

const pct = (v: number) => `${v * 100}%`;
const rectStyle = (r: NormRect): CSSProperties => ({ left: pct(r.x), top: pct(r.y), width: pct(r.width), height: pct(r.height) });

/**
 * The closed gatefold card on its patterned backdrop. The card is a native
 * <button>, so click, tap, Enter and Space all work; it stays disabled until
 * the critical assets are ready and after the sequence has started.
 */
export function EnvelopeIntro({ config, content, state, progress, reducedMotion, onActivate }: Props) {
  const { refs, assets } = useStorybook();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<PetalConfetti | null>(null);

  useEffect(() => {
    if (reducedMotion || !canvasRef.current) return;
    const confetti = createPetalConfetti(canvasRef.current, config.medallion.confetti.colors);
    confettiRef.current = confetti;
    return () => {
      confetti.destroy();
      confettiRef.current = null;
    };
  }, [reducedMotion, config.medallion.confetti.colors]);

  // Every tap on the intro (card included) fires a burst of paper petals from that point.
  const onTap = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !confettiRef.current) return;
    const box = canvas.getBoundingClientRect();
    // Keyboard "clicks" have no pointer position: burst from the middle of the screen.
    const keyboard = e.detail === 0;
    const x = keyboard ? box.width / 2 : e.clientX - box.left;
    const y = keyboard ? box.height / 2 : e.clientY - box.top;
    confettiRef.current.burst(x, y, config.medallion.confetti.count);
  };
  const loading = state === 'loading';
  const ready = state === 'ready';
  const percent = Math.round(progress * 100);
  const pattern = assets[config.assets.backdrop]?.src;
  const paper = assets[config.assets.paper]?.src;

  return (
    <div ref={refs.ref(refKeys.envelope('root'))} className="sb-envelope" onClick={onTap}>
      <div
        ref={refs.ref(refKeys.envelope('backdrop'))}
        className="sb-envelope__backdrop"
        style={{ backgroundColor: config.backdrop.color }}
      >
        {pattern && (
          <div
            className="sb-envelope__pattern"
            style={{
              backgroundImage: `url("${pattern}")`,
              backgroundSize: `${config.backdrop.tile}px auto`,
              opacity: config.backdrop.opacity,
            }}
          />
        )}
        <MedallionBackdrop config={config.medallion} />
      </div>

      <div className="sb-envelope__center">
        <div ref={refs.ref(refKeys.envelope('card'))} className="sb-gate" style={{ '--sb-gate-aspect': config.aspect } as CSSProperties}>
          <button
            type="button"
            className="sb-gate__button"
            onClick={onActivate}
            disabled={!ready}
            aria-label="Mở thiệp cưới"
            aria-describedby="sb-envelope-hint"
            aria-busy={loading}
          >
            {/* Revealed when the panels open. Decorative: the same text is in the finale card. */}
            {/* Revealed when the panels open: the invitation sheet (peony + koi frame); the text sits in its ivory panel.
                Decorative for screen readers: the same details are on the landing page. */}
            <span
              ref={refs.ref(refKeys.envelope('inside'))}
              className="sb-gate__inside"
              style={paper ? { backgroundImage: `url("${paper}")` } : undefined}
              aria-hidden="true"
            >
              <span className="sb-gate__sheet">
                <span data-inside className="sb-gate__eyebrow">
                  {content.eyebrow}
                </span>
                {content.recipient && (
                  <span data-inside className="sb-gate__to">
                    {content.recipient}
                  </span>
                )}
                {content.occasion && (
                  <span data-inside className="sb-gate__line">
                    {content.occasion}
                  </span>
                )}
                <span data-inside className="sb-gate__names">
                  {content.groom}
                  <span className="sb-gate__amp">&amp;</span>
                  {content.bride}
                </span>
                <span data-inside className="sb-gate__when">
                  <small>Vào lúc</small>
                  <strong>
                    {content.timeLabel} · {content.dateLabel}
                  </strong>
                  {content.lunarDate && <em>{content.lunarDate}</em>}
                </span>
                <span data-inside className="sb-gate__where">
                  <small>Tại</small>
                  <strong>{content.venueName}</strong>
                  <em>{content.venueAddress}</em>
                </span>
                {content.closing && (
                  <span data-inside className="sb-gate__line">
                    {content.closing}
                  </span>
                )}
                {content.families && (
                  <span data-inside className="sb-gate__families">
                    {content.families.map((f) => (
                      <span key={f.label}>
                        <small>{f.label}</small>
                        <strong>{f.father}</strong>
                        <strong>{f.mother}</strong>
                      </span>
                    ))}
                  </span>
                )}
              </span>
            </span>

            <span ref={refs.ref(refKeys.envelope('left'))} className="sb-gate__panel" style={rectStyle(config.parts.left)}>
              <AssetImage asset={config.assets.left} className="sb-gate__face" />
              <span className="sb-gate__back" />
            </span>
            <span ref={refs.ref(refKeys.envelope('right'))} className="sb-gate__panel" style={rectStyle(config.parts.right)}>
              <span className="sb-gate__face">
                <AssetImage asset={config.assets.right} className="sb-fill-img" />
                <span className="sb-gate__panel-label" style={rectStyle(config.parts.panelLabel)}>
                  {config.text.panel.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </span>
              </span>
              <span className="sb-gate__back" />
            </span>
            <span ref={refs.ref(refKeys.envelope('seal'))} className="sb-gate__seal" style={rectStyle(config.parts.seal)}>
              <AssetImage asset={config.assets.seal} className="sb-fill-img" />
            </span>
          </button>
        </div>

        <p ref={refs.ref(refKeys.envelope('hint'))} id="sb-envelope-hint" className="sb-envelope__hint">
          {loading ? (
            <>
              <span className="sb-progress" aria-hidden="true">
                <span style={{ transform: `scaleX(${progress})` }} />
              </span>
              Đang chuẩn bị thiệp… {percent}%
            </>
          ) : (
            'Chạm vào thiệp để mở'
          )}
        </p>
      </div>

      <canvas ref={canvasRef} className="sb-confetti" aria-hidden="true" />
    </div>
  );
}
