import type { SceneConfig } from '../engine/sceneTypes';

/**
 * Scene 2 — the couple walks along the path while the camera travels with
 * them. Far layers (depth < 1) lag behind, the grass/branch (depth > 1)
 * rushes past. The scene ends by pushing the camera into the foreground
 * branch, which hides the crossfade into the finale.
 */
export const scene02: SceneConfig = {
  id: 'scene-02',
  title: 'Hành trình',
  background: '#e9eef0',
  transitionIn: {
    type: 'wipe', at: 'scene2Transition', duration: 1.1, ease: 'power2.inOut',
    wipeAsset: 'transition-foliage', direction: 'left',
  },
  endsAt: 'finaleSettle',
  layouts: {
    desktop: {
      camera: {
        start: { x: 960, y: 540, zoom: 1 },
        moves: [
          { at: 'cameraJourney', duration: 3.7, target: { x: 2050, y: 560, zoom: 1.06 }, ease: 'sine.inOut' },
          { at: 'scene3Transition', offset: -0.2, duration: 1, target: { x: 2250, y: 600, zoom: 1.35 }, ease: 'power2.in' },
        ],
      },
      layers: [
        {
          id: 'background', asset: 'scene-02-desktop-background', role: 'background', depth: 0.25, z: 0,
          x: 1300, y: 540, width: 3000, coversCamera: true,
        },
        {
          id: 'cloud-a', asset: 'scene-01-cloud-left', role: 'backOrnament', depth: 0.32, z: 1,
          x: 700, y: 210, width: 560, opacity: 0.9,
          ambient: { property: 'x', amplitude: 30, period: 10 },
        },
        {
          id: 'cloud-b', asset: 'scene-01-cloud-right', role: 'backOrnament', depth: 0.38, z: 1,
          x: 2150, y: 170, width: 520, opacity: 0.9,
          ambient: { property: 'x', amplitude: 24, period: 12 },
        },
        {
          id: 'midground', asset: 'scene-02-desktop-midground', role: 'midground', depth: 0.75, z: 2,
          x: 2000, y: 800, width: 4200,
        },
        {
          id: 'tree-a', asset: 'scene-02-tree', role: 'midground', depth: 0.8, z: 3,
          x: 220, y: 900, width: 420, anchor: [0.5, 1],
          ambient: { property: 'rotation', amplitude: 1, period: 5 },
        },
        {
          id: 'tree-b', asset: 'scene-02-tree', role: 'midground', depth: 0.8, z: 3,
          x: 1350, y: 880, width: 380, anchor: [0.5, 1],
          ambient: { property: 'rotation', amplitude: 1.2, period: 5.5 },
        },
        {
          id: 'house', asset: 'scene-02-house', role: 'prop', depth: 0.78, z: 3,
          x: 2560, y: 860, width: 520, anchor: [0.5, 1],
        },
        {
          id: 'tree-c', asset: 'scene-02-tree', role: 'midground', depth: 0.8, z: 3,
          x: 3000, y: 900, width: 440, anchor: [0.5, 1],
          ambient: { property: 'rotation', amplitude: 1, period: 6 },
        },
        {
          id: 'fence', asset: 'scene-02-fence', role: 'prop', depth: 0.9, z: 4,
          x: 1750, y: 905, width: 1000, anchor: [0.5, 1],
        },
        {
          id: 'grass', asset: 'scene-02-foreground-grass', role: 'foreground', depth: 1.25, z: 8,
          x: 2400, y: 1110, width: 5000, anchor: [0.5, 1],
        },
        {
          id: 'branch', asset: 'scene-02-foreground-branch', role: 'occluder', depth: 1.35, z: 9,
          x: 2050, y: -40, width: 1100, anchor: [0.5, 0],
          ambient: { property: 'rotation', amplitude: 1.5, period: 4.5 },
          exit: {
            at: 'scene3Transition', offset: -0.1, duration: 1, ease: 'power2.in',
            to: { scale: 2.6, x: -260, y: 260 },
          },
        },
      ],
      characters: [
        {
          id: 'couple', character: 'couple', depth: 1, z: 6,
          x: 380, y: 935, scale: 0.7, facing: 'right', initialState: 'idle', hiddenAtStart: true,
          script: [
            { type: 'appear', state: 'idle', at: 'characterEnter', duration: 0.6, from: { opacity: 0, y: 24 } },
            { type: 'walk', at: 'characterWalk', to: { x: 2240, y: 925 }, duration: 3.5, ease: 'none' },
            { type: 'play', state: 'idle', at: 'characterWalk', offset: 3.5, duration: 0.6 },
          ],
        },
      ],
    },

    mobile: {
      camera: {
        start: { x: 540, y: 960, zoom: 1 },
        moves: [
          { at: 'cameraJourney', duration: 3.7, target: { x: 1300, y: 1000, zoom: 1.08 }, ease: 'sine.inOut' },
          { at: 'scene3Transition', offset: -0.2, duration: 1, target: { x: 1450, y: 1100, zoom: 1.3 }, ease: 'power2.in' },
        ],
      },
      layers: [
        {
          id: 'background', asset: 'scene-02-mobile-background', role: 'background', depth: 0.25, z: 0,
          x: 900, y: 960, width: 2000, coversCamera: true,
        },
        {
          id: 'cloud-a', asset: 'scene-01-cloud-left', role: 'backOrnament', depth: 0.32, z: 1,
          x: 380, y: 420, width: 480, opacity: 0.9,
          ambient: { property: 'x', amplitude: 24, period: 10 },
        },
        {
          id: 'cloud-b', asset: 'scene-01-cloud-right', role: 'backOrnament', depth: 0.38, z: 1,
          x: 1250, y: 330, width: 420, opacity: 0.9,
          ambient: { property: 'x', amplitude: 18, period: 12 },
        },
        {
          id: 'midground', asset: 'scene-02-mobile-midground', role: 'midground', depth: 0.75, z: 2,
          x: 1300, y: 1380, width: 2800,
        },
        {
          id: 'tree-a', asset: 'scene-02-tree', role: 'midground', depth: 0.8, z: 3,
          x: 120, y: 1420, width: 380, anchor: [0.5, 1],
          ambient: { property: 'rotation', amplitude: 1, period: 5 },
        },
        {
          id: 'house', asset: 'scene-02-house', role: 'prop', depth: 0.78, z: 3,
          x: 1600, y: 1380, width: 460, anchor: [0.5, 1],
        },
        {
          id: 'tree-b', asset: 'scene-02-tree', role: 'midground', depth: 0.8, z: 3,
          x: 2000, y: 1420, width: 400, anchor: [0.5, 1],
          ambient: { property: 'rotation', amplitude: 1.2, period: 5.5 },
        },
        {
          id: 'grass', asset: 'scene-02-foreground-grass', role: 'foreground', depth: 1.25, z: 8,
          x: 1600, y: 1950, width: 3800, anchor: [0.5, 1],
        },
        {
          id: 'branch', asset: 'scene-02-foreground-branch', role: 'occluder', depth: 1.35, z: 9,
          x: 1250, y: 120, width: 900, anchor: [0.5, 0],
          ambient: { property: 'rotation', amplitude: 1.5, period: 4.5 },
          exit: {
            at: 'scene3Transition', offset: -0.1, duration: 1, ease: 'power2.in',
            to: { scale: 3, x: -200, y: 420 },
          },
        },
      ],
      characters: [
        {
          id: 'couple', character: 'couple', depth: 1, z: 6,
          x: 260, y: 1470, scale: 0.85, facing: 'right', initialState: 'idle', hiddenAtStart: true,
          script: [
            { type: 'appear', state: 'idle', at: 'characterEnter', duration: 0.6, from: { opacity: 0, y: 24 } },
            { type: 'walk', at: 'characterWalk', to: { x: 1420, y: 1460 }, duration: 3.5, ease: 'none' },
            { type: 'play', state: 'idle', at: 'characterWalk', offset: 3.5, duration: 0.6 },
          ],
        },
      ],
    },
  },
};
