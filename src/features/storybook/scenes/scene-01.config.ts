import type { SceneConfig } from '../engine/sceneTypes';

/**
 * Scene 1 — the envelope opens and the storybook diorama assembles.
 * Back → mid → front layers arrive at different times, distances and eases so
 * the paper cutouts read as separate planes rather than one sticker sheet.
 */
export const scene01: SceneConfig = {
  id: 'scene-01',
  title: 'Mở thiệp',
  background: '#f3e2d6',
  transitionIn: { type: 'cut', at: 'envelopeOpen', duration: 0 },
  endsAt: 'characterEnter',
  layouts: {
    desktop: {
      camera: {
        start: { x: 960, y: 560, zoom: 1.14 },
        moves: [
          { at: 'scene1Back', duration: 2.2, target: { x: 960, y: 540, zoom: 1 }, ease: 'power2.inOut' },
          { at: 'scene2Transition', duration: 1, target: { x: 1080, y: 540, zoom: 1.08 }, ease: 'power2.in' },
        ],
      },
      characters: [],
      layers: [
        {
          id: 'background', asset: 'scene-01-desktop-background', role: 'background', depth: 0.15, z: 0,
          x: 960, y: 540, width: 2200, coversCamera: true,
          enter: { at: 'scene1Back', duration: 1.2, ease: 'power2.out', from: { opacity: 0, scale: 1.06 } },
        },
        {
          id: 'sun', asset: 'scene-01-sun', role: 'backOrnament', depth: 0.2, z: 1,
          x: 1250, y: 330, width: 520, blend: 'screen',
          enter: { at: 'scene1Back', offset: 0.1, duration: 1.4, ease: 'sine.out', from: { y: 90, opacity: 0 } },
          ambient: { property: 'scale', amplitude: 0.03, period: 6 },
        },
        {
          id: 'cloud-left', asset: 'scene-01-cloud-left', role: 'backOrnament', depth: 0.3, z: 2,
          x: 520, y: 250, width: 700,
          enter: { at: 'scene1Back', offset: 0.15, duration: 1.5, ease: 'power3.out', from: { x: -280, opacity: 0 } },
          ambient: { property: 'x', amplitude: 18, period: 9 },
        },
        {
          id: 'cloud-right', asset: 'scene-01-cloud-right', role: 'backOrnament', depth: 0.35, z: 2,
          x: 1500, y: 190, width: 600,
          enter: { at: 'scene1Back', offset: 0.25, duration: 1.5, ease: 'power3.out', from: { x: 280, opacity: 0 } },
          ambient: { property: 'x', amplitude: 14, period: 11 },
        },
        {
          id: 'hills', asset: 'scene-01-desktop-hills', role: 'midground', depth: 0.55, z: 3,
          x: 960, y: 880, width: 2400,
          enter: { at: 'scene1Mid', duration: 1.1, ease: 'power3.out', from: { y: 240, opacity: 0 } },
        },
        {
          id: 'tree-left', asset: 'scene-01-tree-left', role: 'midground', depth: 0.75, z: 4,
          x: 330, y: 1020, width: 600, anchor: [0.5, 1],
          enter: { at: 'scene1Mid', offset: 0.12, duration: 1.1, ease: 'power3.out', from: { y: 360, rotation: -5 } },
          ambient: { property: 'rotation', amplitude: 1.2, period: 5 },
        },
        {
          id: 'tree-right', asset: 'scene-01-tree-right', role: 'midground', depth: 0.75, z: 4,
          x: 1610, y: 1020, width: 580, anchor: [0.5, 1],
          enter: { at: 'scene1Mid', offset: 0.22, duration: 1.1, ease: 'power3.out', from: { y: 360, rotation: 5 } },
          ambient: { property: 'rotation', amplitude: 1, period: 5.6 },
        },
        {
          id: 'lantern-left', asset: 'scene-01-lantern-left', role: 'prop', depth: 0.9, z: 5,
          x: 640, y: 0, width: 140, anchor: [0.5, 0],
          enter: { at: 'scene1Mid', offset: 0.3, duration: 1.2, ease: 'back.out(1.3)', from: { y: -420 } },
          ambient: { property: 'rotation', amplitude: 3, period: 3.4 },
        },
        {
          id: 'lantern-right', asset: 'scene-01-lantern-right', role: 'prop', depth: 0.9, z: 5,
          x: 1290, y: 0, width: 120, anchor: [0.5, 0],
          enter: { at: 'scene1Mid', offset: 0.42, duration: 1.2, ease: 'back.out(1.3)', from: { y: -420 } },
          ambient: { property: 'rotation', amplitude: 2.5, period: 3.9 },
        },
        {
          id: 'foreground-left', asset: 'scene-01-foreground-left', role: 'foreground', depth: 1.3, z: 8,
          x: -40, y: 1100, width: 860, anchor: [0, 1],
          enter: { at: 'scene1Front', duration: 1, ease: 'power2.out', from: { x: -420, y: 140 } },
        },
        {
          id: 'foreground-right', asset: 'scene-01-foreground-right', role: 'foreground', depth: 1.3, z: 8,
          x: 1960, y: 1100, width: 860, anchor: [1, 1],
          enter: { at: 'scene1Front', offset: 0.08, duration: 1, ease: 'power2.out', from: { x: 420, y: 140 } },
        },
      ],
    },

    /* Portrait framing: tighter camera, one lantern, trees pushed to the edges. */
    mobile: {
      camera: {
        start: { x: 540, y: 990, zoom: 1.12 },
        moves: [
          { at: 'scene1Back', duration: 2.2, target: { x: 540, y: 960, zoom: 1 }, ease: 'power2.inOut' },
          { at: 'scene2Transition', duration: 1, target: { x: 600, y: 960, zoom: 1.06 }, ease: 'power2.in' },
        ],
      },
      characters: [],
      layers: [
        {
          id: 'background', asset: 'scene-01-mobile-background', role: 'background', depth: 0.15, z: 0,
          x: 540, y: 960, width: 1240, coversCamera: true,
          enter: { at: 'scene1Back', duration: 1.2, ease: 'power2.out', from: { opacity: 0, scale: 1.06 } },
        },
        {
          id: 'sun', asset: 'scene-01-sun', role: 'backOrnament', depth: 0.2, z: 1,
          x: 740, y: 560, width: 460, blend: 'screen',
          enter: { at: 'scene1Back', offset: 0.1, duration: 1.4, ease: 'sine.out', from: { y: 90, opacity: 0 } },
          ambient: { property: 'scale', amplitude: 0.03, period: 6 },
        },
        {
          id: 'cloud-left', asset: 'scene-01-cloud-left', role: 'backOrnament', depth: 0.3, z: 2,
          x: 260, y: 400, width: 560,
          enter: { at: 'scene1Back', offset: 0.15, duration: 1.5, ease: 'power3.out', from: { x: -240, opacity: 0 } },
          ambient: { property: 'x', amplitude: 14, period: 9 },
        },
        {
          id: 'cloud-right', asset: 'scene-01-cloud-right', role: 'backOrnament', depth: 0.35, z: 2,
          x: 860, y: 290, width: 460,
          enter: { at: 'scene1Back', offset: 0.25, duration: 1.5, ease: 'power3.out', from: { x: 240, opacity: 0 } },
          ambient: { property: 'x', amplitude: 10, period: 11 },
        },
        {
          id: 'hills', asset: 'scene-01-mobile-hills', role: 'midground', depth: 0.55, z: 3,
          x: 540, y: 1540, width: 1400,
          enter: { at: 'scene1Mid', duration: 1.1, ease: 'power3.out', from: { y: 300, opacity: 0 } },
        },
        {
          id: 'tree-left', asset: 'scene-01-tree-left', role: 'midground', depth: 0.75, z: 4,
          x: 150, y: 1720, width: 520, anchor: [0.5, 1],
          enter: { at: 'scene1Mid', offset: 0.12, duration: 1.1, ease: 'power3.out', from: { y: 380, rotation: -5 } },
          ambient: { property: 'rotation', amplitude: 1.2, period: 5 },
        },
        {
          id: 'tree-right', asset: 'scene-01-tree-right', role: 'midground', depth: 0.75, z: 4,
          x: 950, y: 1660, width: 420, anchor: [0.5, 1],
          enter: { at: 'scene1Mid', offset: 0.22, duration: 1.1, ease: 'power3.out', from: { y: 380, rotation: 5 } },
          ambient: { property: 'rotation', amplitude: 1, period: 5.6 },
        },
        {
          id: 'lantern', asset: 'scene-01-lantern-left', role: 'prop', depth: 0.9, z: 5,
          x: 330, y: 0, width: 130, anchor: [0.5, 0],
          enter: { at: 'scene1Mid', offset: 0.3, duration: 1.2, ease: 'back.out(1.3)', from: { y: -420 } },
          ambient: { property: 'rotation', amplitude: 3, period: 3.4 },
        },
        {
          id: 'foreground-left', asset: 'scene-01-foreground-left', role: 'foreground', depth: 1.3, z: 8,
          x: -60, y: 1960, width: 720, anchor: [0, 1],
          enter: { at: 'scene1Front', duration: 1, ease: 'power2.out', from: { x: -360, y: 160 } },
        },
        {
          id: 'foreground-right', asset: 'scene-01-foreground-right', role: 'foreground', depth: 1.3, z: 8,
          x: 1140, y: 1960, width: 720, anchor: [1, 1],
          enter: { at: 'scene1Front', offset: 0.08, duration: 1, ease: 'power2.out', from: { x: 360, y: 160 } },
        },
      ],
    },
  },
};
