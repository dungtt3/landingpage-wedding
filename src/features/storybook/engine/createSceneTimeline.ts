import gsap from 'gsap';
import { clampCamera, createCameraState, type CameraState } from './cameraController';
import { buildCharacterTimeline, applyCharacterFinalState } from './characterController';
import type { DepthItem } from './parallaxController';
import { refKeys, type RefRegistry } from './refRegistry';
import { resolveTime } from './timing';
import type {
  AmbientMotion,
  CharacterDefinition,
  LayerConfig,
  LayerRole,
  LayoutMode,
  SceneConfig,
  StageSpec,
  TimelineConfig,
  TransformState,
} from './sceneTypes';

export const IDENTITY: Required<Pick<TransformState, 'x' | 'y' | 'scale' | 'rotation' | 'opacity'>> = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  opacity: 1,
};

/** Heavier planes settle slowly; light decoration may overshoot slightly. */
const DEFAULT_EASE: Record<LayerRole, string> = {
  background: 'sine.out',
  backOrnament: 'sine.out',
  midground: 'power3.out',
  prop: 'power2.out',
  foreground: 'power2.out',
  occluder: 'power2.inOut',
  atmosphere: 'sine.inOut',
  mask: 'power2.inOut',
};

export interface SceneBuildArgs {
  tl: gsap.core.Timeline;
  scene: SceneConfig;
  index: number;
  scenes: SceneConfig[];
  layout: LayoutMode;
  stage: StageSpec;
  refs: RefRegistry;
  timeline: TimelineConfig;
  characters: Record<string, CharacterDefinition>;
}

export interface SceneRig {
  camera: CameraState;
  depthItems: DepthItem[];
  pointerStrength: number;
  /** Starts infinite ambient/idle loops once the sequence is complete (finale only). */
  startLoops: () => void;
}

/* ----------------------------------------------------------------- ambient */

function ambientValue(a: AmbientMotion, t: number): number {
  const phase = (2 * Math.PI * t) / a.period;
  switch (a.property) {
    case 'scale':
      return 1 + a.amplitude * Math.sin(phase);
    case 'opacity':
      return 1 - a.amplitude * (0.5 - 0.5 * Math.cos(phase));
    default:
      return a.amplitude * Math.sin(phase);
  }
}

function createAmbient(el: HTMLElement, a: AmbientMotion) {
  const set = gsap.quickSetter(el, a.property, a.property === 'x' || a.property === 'y' ? 'px' : '') as (v: number) => void;
  const proxy = { t: 0 };
  const render = () => set(ambientValue(a, proxy.t));
  render();
  return { proxy, render };
}

/* ------------------------------------------------------------------ layers */

function sceneEndTime(args: SceneBuildArgs): number {
  const { scene, timeline } = args;
  return scene.endsAt ? timeline.labels[scene.endsAt] : timeline.labels.complete;
}

function sceneStartTime(args: SceneBuildArgs): number {
  return resolveTime(args.scene.transitionIn, args.timeline.labels);
}

function collectDepthItems(args: Pick<SceneBuildArgs, 'scene' | 'layout' | 'refs'>): DepthItem[] {
  const { scene, layout, refs } = args;
  const items: DepthItem[] = [];
  const l = scene.layouts[layout];
  for (const layer of l.layers) {
    if (layer.visible === false) continue;
    items.push({ el: refs.require(refKeys.layer(scene.id, layer.id, 'depth')), depth: layer.depth });
  }
  for (const c of l.characters) {
    items.push({ el: refs.require(refKeys.character(scene.id, c.id, 'depth')), depth: c.depth });
  }
  return items;
}

function buildLayer(args: SceneBuildArgs, layer: LayerConfig, loops: (() => void)[], isFinal: boolean) {
  const { tl, scene, refs, timeline } = args;
  const motion = refs.require(refKeys.layer(scene.id, layer.id, 'motion'));
  const ease = DEFAULT_EASE[layer.role];

  // Initial state = identity merged with the enter "from" state.
  gsap.set(motion, { ...IDENTITY, ...(layer.enter?.from ?? {}) });

  if (layer.enter) {
    tl.to(
      motion,
      { ...IDENTITY, ...(layer.enter.to ?? {}), duration: layer.enter.duration, ease: layer.enter.ease ?? ease },
      resolveTime(layer.enter, timeline.labels),
    );
  }
  if (layer.exit) {
    tl.to(
      motion,
      { ...(layer.exit.to ?? { opacity: 0 }), duration: layer.exit.duration, ease: layer.exit.ease ?? ease },
      resolveTime(layer.exit, timeline.labels),
    );
  }
  if (layer.ambient) {
    const el = refs.require(refKeys.layer(scene.id, layer.id, 'ambient'));
    const amb = createAmbient(el, layer.ambient);
    const start = layer.enter
      ? resolveTime(layer.enter, timeline.labels) + layer.enter.duration * 0.6
      : sceneStartTime(args);
    const end = sceneEndTime(args);
    if (end > start) {
      tl.to(amb.proxy, { t: end - start, duration: end - start, ease: 'none', onUpdate: amb.render }, start);
    }
    if (isFinal) {
      const a = layer.ambient;
      loops.push(() => {
        gsap.to(amb.proxy, { t: `+=${a.period}`, duration: a.period, ease: 'none', repeat: -1, onUpdate: amb.render });
      });
    }
  }
}

/* -------------------------------------------------------------- transitions */

function buildTransitionIn(args: SceneBuildArgs) {
  const { tl, scene, index, scenes, refs, stage, timeline } = args;
  const el = refs.require(refKeys.scene(scene.id));
  const prev = index > 0 ? refs.require(refKeys.scene(scenes[index - 1].id)) : null;
  const t = scene.transitionIn;
  const at = resolveTime(t, timeline.labels);

  if (index === 0 || t.type === 'cut') {
    gsap.set(el, { autoAlpha: index === 0 ? 1 : 0 });
    if (index > 0) {
      tl.set(el, { autoAlpha: 1 }, at);
      if (prev) tl.set(prev, { autoAlpha: 0 }, at);
    }
    return;
  }

  gsap.set(el, { autoAlpha: 0 });

  switch (t.type) {
    case 'crossfade':
      // Incoming scene sits above the outgoing one, so fade it in on top and
      // only then hide the old scene (no dip to the page background).
      tl.to(el, { autoAlpha: 1, duration: t.duration, ease: t.ease ?? 'sine.inOut' }, at);
      if (prev) tl.set(prev, { autoAlpha: 0 }, at + t.duration);
      break;
    case 'iris':
      gsap.set(el, { clipPath: 'circle(0% at 50% 55%)' });
      tl.set(el, { autoAlpha: 1 }, at);
      tl.to(el, { clipPath: 'circle(80% at 50% 55%)', duration: t.duration, ease: t.ease ?? 'power2.inOut' }, at);
      tl.set(el, { clipPath: 'none' }, at + t.duration);
      if (prev) tl.set(prev, { autoAlpha: 0 }, at + t.duration);
      break;
    case 'wipe': {
      const wipe = refs.require(refKeys.wipe(scene.id));
      const wipeWidth = wipe.offsetWidth || stage.width * 1.4;
      const toLeft = (t.direction ?? 'left') === 'left';
      const fromX = toLeft ? stage.width : -wipeWidth;
      const toX = toLeft ? -wipeWidth : stage.width;
      gsap.set(wipe, { x: fromX, autoAlpha: 0 });
      tl.set(wipe, { autoAlpha: 1 }, at);
      tl.to(wipe, { x: toX, duration: t.duration, ease: t.ease ?? 'power2.inOut' }, at);
      // With a symmetric ease the wipe fully covers the frame at its midpoint.
      tl.set(el, { autoAlpha: 1 }, at + t.duration / 2);
      if (prev) tl.set(prev, { autoAlpha: 0 }, at + t.duration / 2);
      tl.set(wipe, { autoAlpha: 0 }, at + t.duration);
      break;
    }
  }
}

/* -------------------------------------------------------------------- scene */

export function buildSceneTimeline(args: SceneBuildArgs): SceneRig {
  const { tl, scene, layout, timeline, index, scenes } = args;
  const l = scene.layouts[layout];
  const isFinal = index === scenes.length - 1;
  const loops: (() => void)[] = [];

  buildTransitionIn(args);

  for (const layer of l.layers) {
    if (layer.visible === false) continue;
    buildLayer(args, layer, loops, isFinal);
  }

  const camera = createCameraState(l.camera);
  Object.assign(camera, clampCamera(l.camera.start));
  for (const move of l.camera.moves) {
    tl.to(camera, { ...clampCamera(move.target), duration: move.duration, ease: move.ease ?? 'power2.inOut' }, resolveTime(move, timeline.labels));
  }

  for (const placement of l.characters) {
    const start = buildCharacterTimeline({
      tl,
      sceneId: scene.id,
      placement,
      definition: args.characters[placement.character],
      refs: args.refs,
      labels: timeline.labels,
      sceneEnd: sceneEndTime(args),
    });
    if (isFinal && start) loops.push(start);
  }

  return {
    camera,
    depthItems: collectDepthItems(args),
    pointerStrength: isFinal ? l.camera.pointerParallax ?? 0 : 0,
    startLoops: () => loops.forEach((fn) => fn()),
  };
}

/**
 * Reduced motion: no travel, no assembly. Every scene except the finale is
 * hidden and the finale is shown in its final composition immediately.
 */
export function applySceneFinalState(args: Omit<SceneBuildArgs, 'tl'>): SceneRig {
  const { scene, index, scenes, layout, refs } = args;
  const l = scene.layouts[layout];
  const isFinal = index === scenes.length - 1;
  gsap.set(refs.require(refKeys.scene(scene.id)), { autoAlpha: isFinal ? 1 : 0, clipPath: 'none' });
  const wipe = refs.get(refKeys.wipe(scene.id));
  if (wipe) gsap.set(wipe, { autoAlpha: 0 });
  for (const layer of l.layers) {
    if (layer.visible === false) continue;
    gsap.set(refs.require(refKeys.layer(scene.id, layer.id, 'motion')), { ...IDENTITY, ...(layer.enter?.to ?? {}) });
  }
  for (const placement of l.characters) {
    applyCharacterFinalState({
      sceneId: scene.id,
      placement,
      definition: args.characters[placement.character],
      refs,
      labels: args.timeline.labels,
    });
  }
  const camera = createCameraState(l.camera);
  const last = l.camera.moves.length ? l.camera.moves[l.camera.moves.length - 1].target : l.camera.start;
  Object.assign(camera, clampCamera(last));
  return { camera, depthItems: collectDepthItems(args), pointerStrength: 0, startLoops: () => undefined };
}
