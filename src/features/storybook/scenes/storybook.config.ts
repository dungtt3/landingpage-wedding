import type { StorybookConfig } from '../engine/sceneTypes';
import { scene01 } from './scene-01.config';
import { scene02 } from './scene-02.config';
import { scene03 } from './scene-03.config';

/**
 * Master configuration. Timeline label offsets (seconds after the envelope is
 * activated) live here so timing can be tuned without touching the engine.
 * Label order follows the brief's blueprint; scene/layer motions reference
 * these labels plus a relative offset.
 */
export const storybookConfig: StorybookConfig = {
  stages: {
    desktop: { width: 1920, height: 1080 },
    mobile: { width: 1080, height: 1920 },
  },
  mobileBreakpointAspect: 0.9,
  mobileMaxWidth: 640,
  timeline: {
    labels: {
      envelopeOpen: 0,
      scene1Back: 2.2,
      scene1Mid: 2.6,
      scene1Front: 3.0,
      scene2Transition: 4.6,
      characterEnter: 5.2,
      cameraJourney: 5.4,
      characterWalk: 5.7,
      scene3Transition: 9.3,
      finaleSettle: 9.8,
      inviteReveal: 10.6,
      complete: 12.1,
    },
    states: [
      { at: 'envelopeOpen', state: 'opening' },
      { at: 'scene1Back', state: 'assembling' },
      { at: 'characterEnter', state: 'story' },
      { at: 'scene3Transition', state: 'transitioning' },
      { at: 'complete', state: 'complete' },
    ],
    reducedMotionDuration: 1.2,
  },
  envelope: {
    // Values printed by scripts/split-gatefold-card.py for art-source/gatefold-card.jpg.
    aspect: 0.6896,
    assets: {
      left: 'gate-left',
      right: 'gate-right',
      seal: 'gate-seal',
      backdrop: 'envelope-backdrop',
    },
    parts: {
      left: { x: 0, y: 0, width: 0.4932, height: 1 },
      right: { x: 0.5029, y: 0, width: 0.4971, height: 0.9987 },
      seal: { x: 0.273, y: 0.2368, width: 0.4413, height: 0.7389 },
      panelLabel: { x: 0.3051, y: 0.5608, width: 0.5709, height: 0.3608 },
    },
    text: {
      panel: ['Trăm', 'Năm', 'Hạnh', 'Phúc'],
    },
    backdrop: { color: '#7d1214', tile: 420, opacity: 0.35 },
    medallion: {
      // Layers and rects printed by scripts/split-medallion.py for art-source/medallion.jpg.
      deco: 'medallion-deco',
      ring: { asset: 'medallion-ring', rect: { x: 0.1119, y: 0.1069, width: 0.7913, height: 0.7913 }, turnSeconds: 90 },
      sprites: [
        { asset: 'medallion-flower-tl', kind: 'flower', pivot: [0.5, 0.5], rect: { x: 0.1975, y: 0.1862, width: 0.1163, height: 0.1156 } },
        { asset: 'medallion-flower-tr', kind: 'flower', pivot: [0.5, 0.5], rect: { x: 0.6937, y: 0.1862, width: 0.1394, height: 0.1388 } },
        { asset: 'medallion-flower-left', kind: 'flower', pivot: [0.5, 0.5], rect: { x: 0.1744, y: 0.3431, width: 0.1781, height: 0.1781 } },
        { asset: 'medallion-flower-bl', kind: 'flower', pivot: [0.5, 0.5], rect: { x: 0.2756, y: 0.5831, width: 0.1706, height: 0.1706 } },
        { asset: 'medallion-flower-peony', kind: 'flower', pivot: [0.5, 0.5], rect: { x: 0.5356, y: 0.4231, width: 0.2756, height: 0.2762 } },
        { asset: 'medallion-flower-white', kind: 'flower', pivot: [0.5, 0.5], rect: { x: 0.5494, y: 0.7125, width: 0.0844, height: 0.0844 } },
        { asset: 'medallion-flower-small-l', kind: 'flower', pivot: [0.5, 0.5], rect: { x: 0.1762, y: 0.6837, width: 0.1, height: 0.1006 } },
        { asset: 'medallion-flower-small-r', kind: 'flower', pivot: [0.5, 0.5], rect: { x: 0.7456, y: 0.6819, width: 0.1, height: 0.1006 } },
        { asset: 'medallion-sprig-tl', kind: 'sprig', pivot: [0.85, 0.85], rect: { x: 0.13, y: 0.0813, width: 0.13, height: 0.1294 } },
        { asset: 'medallion-sprig-tr', kind: 'sprig', pivot: [0.15, 0.85], rect: { x: 0.7438, y: 0.0769, width: 0.1294, height: 0.1294 } },
        { asset: 'medallion-sprig-bl', kind: 'sprig', pivot: [0.85, 0.15], rect: { x: 0.135, y: 0.775, width: 0.1294, height: 0.1294 } },
        { asset: 'medallion-sprig-br', kind: 'sprig', pivot: [0.15, 0.15], rect: { x: 0.7406, y: 0.77, width: 0.1294, height: 0.1294 } },
      ],
      confetti: { count: 46, colors: ['#e2453f', '#c8202b', '#f39a9a', '#f7c6c0', '#fff4ec', '#e2aa5c'] },
    },
    open: {
      sealDuration: 0.55,
      gateDuration: 1.25,
      gateAngle: 165,
      insideDuration: 0.6,
      exitDuration: 0.8,
      exitOffset: 2.1,
    },
  },
  scenes: [scene01, scene02, scene03],
  audio: {
    // Enable once the files listed under "audio" in the manifest exist.
    enabled: false,
    cues: [
      { asset: 'audio-envelope-open', at: 'envelopeOpen', volume: 0.8 },
      { asset: 'audio-footsteps', at: 'characterWalk', volume: 0.4 },
      { asset: 'audio-music', at: 'scene1Back', volume: 0.5 },
    ],
  },
  deferredGate: { at: 'scene2Transition', maxWaitSeconds: 4 },
};
