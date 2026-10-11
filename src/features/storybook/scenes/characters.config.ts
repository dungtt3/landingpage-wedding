import type { CharacterDefinition } from '../engine/sceneTypes';

/**
 * Character registry. Values mirror the sprite-sheet exporter metadata
 * (see README → "Sprite metadata"). When the final sheets arrive, update the
 * numbers here to match them — the engine reads everything from this object.
 */
export const characters: Record<string, CharacterDefinition> = {
  couple: {
    id: 'couple',
    label: 'Cô dâu & chú rể',
    animations: {
      idle: {
        kind: 'sheet',
        state: 'idle',
        asset: 'couple-idle',
        frameWidth: 360,
        frameHeight: 480,
        frameCount: 4,
        columns: 4,
        rows: 1,
        fps: 6,
        loop: true,
        facing: 'right',
        anchor: { x: 180, y: 460 },
        paddedFrames: true,
        mirrorable: true,
      },
      walk: {
        kind: 'sheet',
        state: 'walk',
        asset: 'couple-walk',
        frameWidth: 360,
        frameHeight: 480,
        frameCount: 8,
        columns: 4,
        rows: 2,
        fps: 10,
        loop: true,
        facing: 'right',
        anchor: { x: 180, y: 460 },
        paddedFrames: true,
        mirrorable: true,
      },
      pose: {
        kind: 'sheet',
        state: 'pose',
        asset: 'couple-pose',
        frameWidth: 400,
        frameHeight: 520,
        frameCount: 6,
        columns: 3,
        rows: 2,
        fps: 6,
        loop: true,
        facing: 'right',
        anchor: { x: 200, y: 500 },
        paddedFrames: true,
        mirrorable: false,
      },
    },
  },
};
