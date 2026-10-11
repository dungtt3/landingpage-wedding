import gsap from 'gsap';
import { refKeys, type RefRegistry } from './refRegistry';
import type {
  CharacterAnimState,
  CharacterDefinition,
  CharacterPlacement,
  Facing,
  SpriteAnimation,
  TimelineConfig,
  TransformState,
} from './sceneTypes';
import { createFrameRenderer } from './spriteSheet';
import { resolveTime } from './timing';

/** DOM key suffix for an authored opposite-facing variant. */
export const ALT_SUFFIX = '@alt';

interface Variant {
  key: string;
  anim: SpriteAnimation;
  scaleX: 1 | -1;
}

/**
 * Picks the sprite for a state + facing. An authored opposite-facing variant
 * (`definition.mirrored`) wins over mirroring; mirroring is used only when the
 * art is marked `mirrorable`.
 */
export function variantFor(def: CharacterDefinition, state: CharacterAnimState, facing: Facing): Variant {
  const anim = def.animations[state];
  if (!anim) throw new Error(`[storybook] Character "${def.id}" has no "${state}" animation`);
  if (anim.facing === facing) return { key: state, anim, scaleX: 1 };
  const alt = def.mirrored?.[state];
  if (alt && alt.facing === facing) return { key: state + ALT_SUFFIX, anim: alt, scaleX: 1 };
  if (anim.mirrorable) return { key: state, anim, scaleX: -1 };
  if (import.meta.env?.DEV) console.warn(`[storybook] "${def.id}/${state}" cannot face ${facing}; add a mirrored variant or mark it mirrorable.`);
  return { key: state, anim, scaleX: 1 };
}

/** Every sprite element key a character renders (states + authored alternates). */
export function spriteKeys(def: CharacterDefinition): { key: string; anim: SpriteAnimation }[] {
  const out: { key: string; anim: SpriteAnimation }[] = [];
  for (const [state, anim] of Object.entries(def.animations)) if (anim) out.push({ key: state, anim });
  for (const [state, anim] of Object.entries(def.mirrored ?? {})) if (anim) out.push({ key: state + ALT_SUFFIX, anim });
  return out;
}

function toGsapState(t: TransformState | undefined): gsap.TweenVars {
  if (!t) return {};
  const { opacity, ...rest } = t;
  return opacity === undefined ? { ...rest } : { ...rest, autoAlpha: opacity };
}

interface Segment {
  t: number;
  state: CharacterAnimState;
  facing: Facing;
}

interface PlanResult {
  segments: Segment[];
  final: { x: number; y: number; visible: boolean; state: CharacterAnimState; facing: Facing };
}

/** Turns the declarative script into time-ordered state/facing segments. */
export function planCharacter(placement: CharacterPlacement, labels: TimelineConfig['labels']): PlanResult {
  const actions = placement.script
    .map((a, i) => ({ a, i, t: resolveTime(a, labels) }))
    .sort((p, q) => p.t - q.t || p.i - q.i);

  type Change = { t: number; state?: CharacterAnimState; facing?: Facing; implicit?: boolean };
  const changes: Change[] = [];
  let x = placement.x;
  let y = placement.y;
  let visible = !placement.hiddenAtStart;

  for (const { a, t } of actions) {
    switch (a.type) {
      case 'appear':
        visible = true;
        changes.push({ t, state: a.state });
        break;
      case 'play':
        changes.push({ t, state: a.state });
        break;
      case 'face':
        changes.push({ t, facing: a.facing });
        break;
      case 'walk': {
        const dx = a.to.x - x;
        changes.push({ t, state: a.state ?? 'walk', facing: dx === 0 ? undefined : dx > 0 ? 'right' : 'left' });
        changes.push({ t: t + a.duration, state: placement.initialState, implicit: true });
        x = a.to.x;
        y = a.to.y;
        break;
      }
      case 'hide':
        visible = false;
        break;
    }
  }

  // An explicit change at (almost) the same time overrides the implicit "back to initial state".
  const filtered = changes
    .filter((c) => !c.implicit || !changes.some((o) => !o.implicit && o.state && Math.abs(o.t - c.t) < 1e-3))
    .sort((p, q) => p.t - q.t);

  const segments: Segment[] = [];
  let state = placement.initialState;
  let facing = placement.facing;
  for (const c of filtered) {
    state = c.state ?? state;
    facing = c.facing ?? facing;
    const last = segments[segments.length - 1];
    if (last && Math.abs(last.t - c.t) < 1e-6) {
      last.state = state;
      last.facing = facing;
    } else {
      segments.push({ t: c.t, state, facing });
    }
  }
  return { segments, final: { x, y, visible, state: placement.restingState ?? state, facing } };
}

interface CharacterArgs {
  sceneId: string;
  placement: CharacterPlacement;
  definition: CharacterDefinition;
  refs: RefRegistry;
}

function elements(args: CharacterArgs) {
  const { sceneId, placement, definition, refs } = args;
  const sprites = spriteKeys(definition).map(({ key, anim }) => {
    const el = refs.require(refKeys.sprite(sceneId, placement.id, key));
    return { key, anim, el, render: createFrameRenderer(el, anim) };
  });
  return {
    motion: refs.require(refKeys.character(sceneId, placement.id, 'motion')),
    facing: refs.require(refKeys.character(sceneId, placement.id, 'facing')),
    sprites,
  };
}

function showVariant(target: gsap.core.Timeline | typeof gsap, sprites: ReturnType<typeof elements>['sprites'], key: string, at?: number) {
  for (const s of sprites) {
    const vars = { autoAlpha: s.key === key ? 1 : 0 };
    if (at === undefined) (target as typeof gsap).set(s.el, vars);
    else (target as gsap.core.Timeline).set(s.el, vars, at);
  }
}

/**
 * Adds a character's script to the master timeline. Sprite frames are driven
 * by a GSAP tween of a frame cursor (seconds × fps), so playback honours the
 * configured FPS exactly and stays scrubbable/replayable. Returns a function
 * that starts the infinite resting loop after the sequence completes.
 */
export function buildCharacterTimeline(
  args: CharacterArgs & { tl: gsap.core.Timeline; labels: TimelineConfig['labels']; sceneEnd: number },
): (() => void) | null {
  const { tl, placement, definition, labels, sceneEnd } = args;
  const { motion, facing, sprites } = elements(args);
  const byKey = new Map(sprites.map((s) => [s.key, s]));

  const initial = variantFor(definition, placement.initialState, placement.facing);
  gsap.set(motion, { x: 0, y: 0, autoAlpha: placement.hiddenAtStart ? 0 : 1 });
  gsap.set(facing, { scaleX: initial.scaleX });
  showVariant(gsap, sprites, initial.key);
  sprites.forEach((s) => s.render(0));

  // Motion (appear / walk / hide)
  let x = placement.x;
  let y = placement.y;
  const ordered = placement.script.map((a) => ({ a, t: resolveTime(a, labels) })).sort((p, q) => p.t - q.t);
  for (const { a, t } of ordered) {
    if (a.type === 'appear') {
      const from = toGsapState(a.from);
      tl.fromTo(
        motion,
        { autoAlpha: 0, ...from, x: (from.x as number | undefined ?? 0) + (x - placement.x), y: (from.y as number | undefined ?? 0) + (y - placement.y) },
        { autoAlpha: 1, x: x - placement.x, y: y - placement.y, duration: a.duration, ease: a.ease ?? 'power2.out', immediateRender: false },
        t,
      );
    } else if (a.type === 'walk') {
      tl.to(motion, { x: a.to.x - placement.x, y: a.to.y - placement.y, duration: a.duration, ease: a.ease ?? 'none' }, t);
      x = a.to.x;
      y = a.to.y;
    } else if (a.type === 'hide') {
      tl.to(motion, { autoAlpha: 0, duration: a.duration, ease: 'power1.in' }, t);
    }
  }

  // Pose / sprite segments
  const { segments, final } = planCharacter(placement, labels);
  segments.forEach((seg, i) => {
    const end = i + 1 < segments.length ? segments[i + 1].t : Math.max(sceneEnd, seg.t);
    const v = variantFor(definition, seg.state, seg.facing);
    const sprite = byKey.get(v.key);
    if (!sprite) return;
    showVariant(tl, sprites, v.key, seg.t);
    tl.set(facing, { scaleX: v.scaleX }, seg.t);
    const span = end - seg.t;
    if (span <= 0) return;
    const proxy = { cursor: 0 };
    tl.to(
      proxy,
      { cursor: span * v.anim.fps, duration: span, ease: 'none', onUpdate: () => sprite.render(proxy.cursor) },
      seg.t,
    );
  });

  if (!placement.restingState) return null;
  return () => {
    const v = variantFor(definition, final.state, final.facing);
    const sprite = byKey.get(v.key);
    if (!sprite) return;
    showVariant(gsap, sprites, v.key);
    gsap.set(facing, { scaleX: v.scaleX });
    const proxy = { cursor: 0 };
    const cycle = v.anim.frameCount / v.anim.fps;
    gsap.to(proxy, {
      cursor: v.anim.frameCount,
      duration: cycle,
      ease: 'none',
      repeat: -1,
      onUpdate: () => sprite.render(proxy.cursor),
    });
  };
}

/** Reduced motion: put the character in its end pose without playback. */
export function applyCharacterFinalState(args: CharacterArgs & { labels: TimelineConfig['labels'] }) {
  const { placement, definition } = args;
  const { motion, facing, sprites } = elements(args);
  const { final } = planCharacter(placement, args.labels);
  const v = variantFor(definition, final.state, final.facing);
  gsap.set(motion, { x: final.x - placement.x, y: final.y - placement.y, autoAlpha: final.visible ? 1 : 0 });
  gsap.set(facing, { scaleX: v.scaleX });
  showVariant(gsap, sprites, v.key);
  sprites.forEach((s) => s.render(0));
}
