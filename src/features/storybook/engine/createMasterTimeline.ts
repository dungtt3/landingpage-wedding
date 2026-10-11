import gsap from 'gsap';
import type { AudioController } from './audioController';
import { applySceneFinalState, buildSceneTimeline, type SceneRig } from './createSceneTimeline';
import { buildEnvelopeReduced, buildEnvelopeTimeline } from './envelopeTimeline';
import { ParallaxController } from './parallaxController';
import { refKeys, type RefRegistry } from './refRegistry';
import type { CharacterDefinition, LayoutMode, StorybookConfig, StorybookState, TimelineLabel } from './sceneTypes';
import { resolveTime } from './timing';

export interface DeferredGate {
  isReady(): boolean;
  /** Calls back once ready (or after the max wait). Returns a cancel function. */
  whenReady(cb: () => void): () => void;
}

export interface MasterTimelineOptions {
  config: StorybookConfig;
  layout: LayoutMode;
  refs: RefRegistry;
  characters: Record<string, CharacterDefinition>;
  reducedMotion: boolean;
  /** React-scoped context; anything created after build (loops) is added to it. */
  ctx: gsap.Context;
  onState: (state: StorybookState) => void;
  gate?: DeferredGate;
  audio?: AudioController | null;
}

export interface MasterTimelineHandle {
  timeline: gsap.core.Timeline;
  /** Jump to the stable end state (skip / resize while complete). */
  finish(): void;
  dispose(): void;
  /** Pause/resume the resting loops and pointer parallax (e.g. while scrolled out of view). */
  setActive(active: boolean): void;
}

/**
 * Builds the paused master timeline: envelope → Scene 1 assembly → wipe →
 * Scene 2 story → push/crossfade → Scene 3 finale → invitation reveal.
 * Every child tween is placed at an absolute label time from config, so the
 * same build is deterministic and can be seeked (resize) or replayed.
 */
export function createMasterTimeline(opts: MasterTimelineOptions): MasterTimelineHandle {
  const { config, layout, refs, reducedMotion, ctx } = opts;
  const stage = config.stages[layout];
  const labels = reducedMotion ? reducedLabels(config) : config.timeline.labels;
  const tl = gsap.timeline({ paused: true });
  (Object.keys(labels) as TimelineLabel[]).forEach((k) => tl.addLabel(k, labels[k]));

  /* envelope + scenes */
  let rigs: SceneRig[];
  if (reducedMotion) {
    buildEnvelopeReduced(tl, refs, 0.4);
    rigs = config.scenes.map((scene, index) =>
      applySceneFinalState({ scene, index, scenes: config.scenes, layout, stage, refs, timeline: config.timeline, characters: opts.characters }),
    );
  } else {
    buildEnvelopeTimeline(tl, refs, config.envelope, labels);
    rigs = config.scenes.map((scene, index) =>
      buildSceneTimeline({ tl, scene, index, scenes: config.scenes, layout, stage, refs, timeline: config.timeline, characters: opts.characters }),
    );
  }

  /* invitation reveal (scoped query inside the overlay's own root) */
  const invite = refs.require(refKeys.invite);
  const items = invite.querySelectorAll<HTMLElement>('[data-reveal]');
  gsap.set(invite, { autoAlpha: 0 });
  gsap.set(items, { autoAlpha: 0, y: reducedMotion ? 0 : 24 });
  tl.to(invite, { autoAlpha: 1, duration: reducedMotion ? 0.3 : 0.5, ease: 'sine.out' }, labels.inviteReveal);
  tl.to(
    items,
    { autoAlpha: 1, y: 0, duration: reducedMotion ? 0.3 : 0.7, ease: 'power2.out', stagger: reducedMotion ? 0 : 0.12 },
    labels.inviteReveal + 0.1,
  );

  /* state machine hooks */
  for (const { at, state } of config.timeline.states) {
    if (state === 'complete') continue;
    if (reducedMotion && state !== 'opening') continue;
    tl.call(opts.onState, [state], labels[at]);
  }

  /* wait for progressively loaded assets before the first scene that needs them */
  let cancelGate: (() => void) | null = null;
  if (opts.gate && !reducedMotion) {
    const gate = opts.gate;
    tl.call(
      () => {
        if (gate.isReady()) return;
        tl.pause();
        cancelGate = gate.whenReady(() => {
          cancelGate = null;
          tl.play();
        });
      },
      [],
      Math.max(0, labels[config.deferredGate.at] - 0.01),
    );
  }

  /* audio cues (only after the envelope gesture, by construction) */
  if (opts.audio && config.audio.enabled && !reducedMotion) {
    const audio = opts.audio;
    for (const cue of config.audio.cues) tl.call(() => audio.play(cue.asset, cue.volume), [], resolveTime(cue, labels));
  }

  /* camera → DOM projection */
  const parallax = new ParallaxController(stage);
  rigs.forEach((r) => parallax.addScene(r.camera, r.depthItems, reducedMotion ? 0 : r.pointerStrength));
  parallax.start();

  let completed = false;
  let loops = null as gsap.Context | null; // cast: assigned inside a callback
  let active = true;
  const complete = () => {
    if (completed) return;
    completed = true;
    opts.onState('complete');
    if (reducedMotion) return;
    ctx.add(() => {
      loops = gsap.context(() => rigs.forEach((r) => r.startLoops()));
    });
    if (!active) loops?.getTweens().forEach((t: gsap.core.Animation) => t.pause());
    const host = refs.get(refKeys.stage);
    if (host) parallax.enablePointer(host);
  };
  tl.call(complete, [], labels.complete);

  return {
    timeline: tl,
    finish() {
      cancelGate?.();
      tl.progress(1, true);
      complete();
    },
    dispose() {
      cancelGate?.();
      tl.kill();
      parallax.stop();
      opts.audio?.stopAll();
    },
    setActive(next) {
      if (next === active) return;
      active = next;
      // Only the resting state is suspended; the cinematic itself owns the screen (scroll is locked).
      if (!completed) return;
      loops?.getTweens().forEach((t: gsap.core.Animation) => (next ? t.resume() : t.pause()));
      if (next) parallax.start();
      else parallax.pause();
    },
  };
}

/** Collapsed labels for the reduced-motion sequence (fade, then reveal). */
function reducedLabels(config: StorybookConfig): Record<TimelineLabel, number> {
  const d = config.timeline.reducedMotionDuration;
  const labels = { ...config.timeline.labels };
  (Object.keys(labels) as TimelineLabel[]).forEach((k) => (labels[k] = 0));
  labels.inviteReveal = Math.min(0.3, d / 3);
  labels.complete = d;
  return labels;
}
