import type { SceneConfig } from '../engine/sceneTypes';

/**
 * Scene 3 — invitation finale. The diorama settles around the arch, the
 * camera eases out to its final framing and the invitation text is revealed
 * inside `textSafeArea` (desktop: right side; mobile: lower half).
 */
export const scene03: SceneConfig = {
  id: 'scene-03',
  title: 'Thiệp mời',
  background: '#f6dccb',
  transitionIn: { type: 'crossfade', at: 'scene3Transition', offset: 0.45, duration: 0.8, ease: 'sine.inOut' },
  layouts: {
    desktop: {
      textSafeArea: { x: 0.54, y: 0.12, width: 0.4, height: 0.76 },
      camera: {
        start: { x: 760, y: 620, zoom: 1.28 },
        moves: [
          { at: 'scene3Transition', offset: 0.45, duration: 2.4, target: { x: 960, y: 540, zoom: 1 }, ease: 'power3.out' },
        ],
        pointerParallax: 22,
      },
      layers: [
        {
          id: 'background', asset: 'scene-03-desktop-background', role: 'background', depth: 0.15, z: 0,
          x: 960, y: 540, width: 2300, coversCamera: true,
        },
        {
          id: 'glow', asset: 'scene-03-glow', role: 'atmosphere', depth: 0.3, z: 1,
          x: 640, y: 520, width: 1000, blend: 'screen',
          enter: { at: 'finaleSettle', duration: 1.6, ease: 'sine.out', from: { opacity: 0, scale: 0.8 } },
          ambient: { property: 'opacity', amplitude: 0.2, period: 4 },
        },
        {
          id: 'garden', asset: 'scene-03-desktop-garden', role: 'midground', depth: 0.6, z: 2,
          x: 960, y: 1110, width: 2500, anchor: [0.5, 1],
          enter: { at: 'finaleSettle', duration: 1.2, ease: 'power3.out', from: { y: 200 } },
        },
        {
          id: 'arch', asset: 'scene-03-arch', role: 'midground', depth: 0.85, z: 3,
          x: 640, y: 1000, width: 860, anchor: [0.5, 1],
          enter: { at: 'finaleSettle', offset: 0.1, duration: 1.3, ease: 'power3.out', from: { y: 260, opacity: 0 } },
        },
        {
          id: 'flowers-left', asset: 'scene-03-flowers-left', role: 'foreground', depth: 1.25, z: 8,
          x: -60, y: 1110, width: 760, anchor: [0, 1],
          enter: { at: 'finaleSettle', offset: 0.25, duration: 1.1, ease: 'power2.out', from: { x: -360, y: 120 } },
          ambient: { property: 'rotation', amplitude: 0.8, period: 6 },
        },
        {
          id: 'flowers-right', asset: 'scene-03-flowers-right', role: 'foreground', depth: 1.25, z: 8,
          x: 1980, y: 1120, width: 560, anchor: [1, 1],
          enter: { at: 'finaleSettle', offset: 0.32, duration: 1.1, ease: 'power2.out', from: { x: 360, y: 120 } },
          ambient: { property: 'rotation', amplitude: 0.8, period: 6.5 },
        },
        {
          id: 'petals', asset: 'particles-petals', role: 'atmosphere', depth: 1.1, z: 9,
          x: 900, y: 500, width: 1700, opacity: 0.85,
          enter: { at: 'finaleSettle', offset: 0.4, duration: 1.4, ease: 'sine.out', from: { opacity: 0, y: -120 } },
          ambient: { property: 'y', amplitude: 26, period: 7 },
        },
      ],
      characters: [
        {
          id: 'couple', character: 'couple', depth: 0.95, z: 5,
          x: 640, y: 975, scale: 0.72, facing: 'right', initialState: 'pose', hiddenAtStart: true,
          restingState: 'pose',
          script: [
            { type: 'appear', state: 'pose', at: 'finaleSettle', offset: 0.35, duration: 0.8, from: { opacity: 0, y: 30 } },
          ],
        },
      ],
    },

    mobile: {
      textSafeArea: { x: 0.05, y: 0.5, width: 0.9, height: 0.47 },
      camera: {
        start: { x: 540, y: 820, zoom: 1.28 },
        moves: [
          { at: 'scene3Transition', offset: 0.45, duration: 2.4, target: { x: 540, y: 960, zoom: 1 }, ease: 'power3.out' },
        ],
        pointerParallax: 0,
      },
      layers: [
        {
          id: 'background', asset: 'scene-03-mobile-background', role: 'background', depth: 0.15, z: 0,
          x: 540, y: 960, width: 1300, coversCamera: true,
        },
        {
          id: 'glow', asset: 'scene-03-glow', role: 'atmosphere', depth: 0.3, z: 1,
          x: 540, y: 560, width: 900, blend: 'screen',
          enter: { at: 'finaleSettle', duration: 1.6, ease: 'sine.out', from: { opacity: 0, scale: 0.8 } },
          ambient: { property: 'opacity', amplitude: 0.2, period: 4 },
        },
        {
          id: 'garden', asset: 'scene-03-mobile-garden', role: 'midground', depth: 0.6, z: 2,
          x: 540, y: 1460, width: 1500, anchor: [0.5, 1],
          enter: { at: 'finaleSettle', duration: 1.2, ease: 'power3.out', from: { y: 220 } },
        },
        {
          id: 'arch', asset: 'scene-03-arch', role: 'midground', depth: 0.85, z: 3,
          x: 540, y: 1000, width: 700, anchor: [0.5, 1],
          enter: { at: 'finaleSettle', offset: 0.1, duration: 1.3, ease: 'power3.out', from: { y: 260, opacity: 0 } },
        },
        {
          id: 'flowers-left', asset: 'scene-03-flowers-left', role: 'foreground', depth: 1.25, z: 8,
          x: -80, y: 1120, width: 420, anchor: [0, 1],
          enter: { at: 'finaleSettle', offset: 0.25, duration: 1.1, ease: 'power2.out', from: { x: -300, y: 100 } },
          ambient: { property: 'rotation', amplitude: 0.8, period: 6 },
        },
        {
          id: 'flowers-right', asset: 'scene-03-flowers-right', role: 'foreground', depth: 1.25, z: 8,
          x: 1160, y: 1120, width: 420, anchor: [1, 1],
          enter: { at: 'finaleSettle', offset: 0.32, duration: 1.1, ease: 'power2.out', from: { x: 300, y: 100 } },
          ambient: { property: 'rotation', amplitude: 0.8, period: 6.5 },
        },
        {
          id: 'petals', asset: 'particles-petals', role: 'atmosphere', depth: 1.1, z: 9,
          x: 540, y: 560, width: 1200, opacity: 0.85,
          enter: { at: 'finaleSettle', offset: 0.4, duration: 1.4, ease: 'sine.out', from: { opacity: 0, y: -120 } },
          ambient: { property: 'y', amplitude: 22, period: 7 },
        },
      ],
      characters: [
        {
          id: 'couple', character: 'couple', depth: 0.95, z: 5,
          x: 540, y: 975, scale: 0.72, facing: 'right', initialState: 'pose', hiddenAtStart: true,
          restingState: 'pose',
          script: [
            { type: 'appear', state: 'pose', at: 'finaleSettle', offset: 0.35, duration: 0.8, from: { opacity: 0, y: 30 } },
          ],
        },
      ],
    },
  },
};
