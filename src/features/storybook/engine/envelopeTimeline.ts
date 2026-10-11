import gsap from 'gsap';
import { refKeys, type RefRegistry } from './refRegistry';
import type { EnvelopeConfig, TimelineConfig } from './sceneTypes';

function parts(refs: RefRegistry) {
  const inside = refs.require(refKeys.envelope('inside'));
  return {
    root: refs.require(refKeys.envelope('root')),
    backdrop: refs.require(refKeys.envelope('backdrop')),
    card: refs.require(refKeys.envelope('card')),
    left: refs.require(refKeys.envelope('left')),
    right: refs.require(refKeys.envelope('right')),
    seal: refs.require(refKeys.envelope('seal')),
    inside,
    // Scoped to the card's own inside panel, never a document query.
    insideItems: inside.querySelectorAll<HTMLElement>('[data-inside]'),
    hint: refs.require(refKeys.envelope('hint')),
  };
}

function setClosed(p: ReturnType<typeof parts>) {
  gsap.set(p.root, { autoAlpha: 1 });
  gsap.set(p.backdrop, { autoAlpha: 1 });
  gsap.set(p.card, { scale: 1, y: 0, autoAlpha: 1 });
  gsap.set(p.left, { rotationY: 0, transformOrigin: '0% 50%' });
  gsap.set(p.right, { rotationY: 0, transformOrigin: '100% 50%' });
  gsap.set(p.seal, { y: 0, scale: 1, rotation: 0, autoAlpha: 1, transformOrigin: '50% 20%' });
  gsap.set(p.insideItems, { autoAlpha: 0, y: 14 });
  gsap.set(p.hint, { autoAlpha: 1, y: 0 });
}

/**
 * Gatefold opening: the medallion seal lifts off → both panels swing open on
 * their outer hinges → the inside greeting appears → the card rushes towards
 * the camera and fades while the backdrop dissolves into Scene 1.
 */
export function buildEnvelopeTimeline(
  tl: gsap.core.Timeline,
  refs: RefRegistry,
  cfg: EnvelopeConfig,
  labels: TimelineConfig['labels'],
  /** How much the card grows while it opens (bigger to make the inside readable on small screens). */
  openScale = 1.04,
) {
  const p = parts(refs);
  const o = cfg.open;
  const t0 = labels.envelopeOpen;
  setClosed(p);

  tl.to(p.hint, { autoAlpha: 0, y: 10, duration: 0.25, ease: 'power1.in' }, t0);

  // Seal: a small press, then it lifts towards the viewer and fades.
  tl.to(p.seal, { scale: 0.96, duration: 0.1, ease: 'power1.out' }, t0);
  tl.to(p.seal, { y: '-14%', scale: 1.18, rotation: -6, autoAlpha: 0, duration: o.sealDuration, ease: 'power2.in' }, t0 + 0.1);

  // Panels swing open together (the right one a beat later, like a hand pulling).
  const gateAt = t0 + 0.1 + o.sealDuration * 0.6;
  tl.to(p.left, { rotationY: -o.gateAngle, duration: o.gateDuration, ease: 'power3.inOut' }, gateAt);
  tl.to(p.right, { rotationY: o.gateAngle, duration: o.gateDuration, ease: 'power3.inOut' }, gateAt + 0.08);
  tl.to(p.card, { scale: openScale, duration: o.gateDuration, ease: 'sine.inOut' }, gateAt);

  tl.to(
    p.insideItems,
    { autoAlpha: 1, y: 0, duration: o.insideDuration, ease: 'power2.out', stagger: 0.1 },
    gateAt + o.gateDuration * 0.45,
  );

  const exitAt = t0 + o.exitOffset;
  tl.to(p.card, { scale: openScale * 1.55, autoAlpha: 0, duration: o.exitDuration, ease: 'power2.in' }, exitAt);
  tl.to(p.backdrop, { autoAlpha: 0, duration: 0.9, ease: 'sine.inOut' }, labels.scene1Back);

  const end = Math.max(exitAt + o.exitDuration, labels.scene1Back + 0.9);
  tl.set(p.root, { autoAlpha: 0 }, end);
}

/** Reduced motion: a short fade instead of the opening choreography. */
export function buildEnvelopeReduced(tl: gsap.core.Timeline, refs: RefRegistry, duration: number, onOpened?: () => void) {
  const p = parts(refs);
  setClosed(p);
  if (!onOpened) {
    tl.to(p.root, { autoAlpha: 0, duration, ease: 'sine.inOut' }, 0);
    return;
  }
  // Show the opened invitation at once (no motion), pause for the guest, then fade out.
  tl.set([p.left, p.right, p.seal, p.hint], { autoAlpha: 0 }, 0);
  tl.set(p.insideItems, { autoAlpha: 1, y: 0 }, 0);
  tl.addPause(0.01, onOpened);
  tl.to(p.root, { autoAlpha: 0, duration, ease: 'sine.inOut' }, 0.02);
}
