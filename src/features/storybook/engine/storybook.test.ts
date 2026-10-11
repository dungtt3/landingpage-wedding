import { describe, expect, it } from 'vitest';
import { characters } from '../scenes/characters.config';
import { assetManifest, assetsById } from '../scenes/scene-manifest';
import { storybookConfig } from '../scenes/storybook.config';
import { depthTransform, validateCameraCoverage } from './cameraController';
import { planCharacter, spriteKeys } from './characterController';
import { collectAssetIds } from './sceneAssets';
import type { LayoutMode } from './sceneTypes';
import { coverFit, pickLayout } from './stageGeometry';
import { frameIndexAt, sheetBackgroundPosition } from './spriteSheet';
import { initialMachineState, storybookReducer, type MachineState } from './stateMachine';

const layouts: LayoutMode[] = ['desktop', 'mobile'];

describe('scene configuration', () => {
  it('defines three scenes with dedicated desktop and mobile layouts', () => {
    expect(storybookConfig.scenes).toHaveLength(3);
    for (const scene of storybookConfig.scenes) {
      expect(scene.layouts.desktop.layers.length).toBeGreaterThan(0);
      expect(scene.layouts.mobile.layers.length).toBeGreaterThan(0);
      expect(scene.layouts.mobile).not.toBe(scene.layouts.desktop);
    }
  });

  it('references only assets that exist in the manifest', () => {
    for (const layout of layouts) {
      const { critical, deferred } = collectAssetIds(storybookConfig, layout, characters);
      for (const id of [...critical, ...deferred]) expect(assetsById[id], id).toBeDefined();
    }
  });

  it('has unique asset ids and paths', () => {
    expect(new Set(assetManifest.map((a) => a.id)).size).toBe(assetManifest.length);
    expect(new Set(assetManifest.map((a) => a.src)).size).toBe(assetManifest.length);
  });

  it('marks every critical asset in the manifest as critical', () => {
    for (const layout of layouts) {
      for (const id of collectAssetIds(storybookConfig, layout, characters).critical) {
        expect(assetsById[id].critical, id).toBe(true);
      }
    }
  });

  it('gives layers different parallax depths (no single-plane movement)', () => {
    for (const scene of storybookConfig.scenes) {
      for (const layout of layouts) {
        const depths = new Set(scene.layouts[layout].layers.map((l) => l.depth));
        expect(depths.size, `${scene.id}/${layout}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('places every opening-card part inside the closed card box', () => {
    const { parts, open } = storybookConfig.envelope;
    for (const r of Object.values(parts)) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(1.001);
      expect(r.y + r.height).toBeLessThanOrEqual(1.001);
    }
    // The left panel ends before the right one starts (the seam between them).
    expect(parts.left.x + parts.left.width).toBeLessThanOrEqual(parts.right.x);
    // The card has opened and left before Scene 1 starts dissolving in.
    const l = storybookConfig.timeline.labels;
    expect(open.exitOffset).toBeLessThanOrEqual(l.scene1Back);
  });

  it('keeps every medallion layer on its canvas and in the manifest', () => {
    const { medallion } = storybookConfig.envelope;
    const boxes = [medallion.ring.rect, ...medallion.sprites.map((s) => s.rect)];
    for (const r of boxes) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(1.001);
      expect(r.y + r.height).toBeLessThanOrEqual(1.001);
    }
    // The ring spins about its own centre, which must be the medallion's centre.
    const ring = medallion.ring.rect;
    expect(ring.width).toBeCloseTo(ring.height, 3);
    const critical = new Set(collectAssetIds(storybookConfig, 'desktop', characters).critical);
    for (const id of [medallion.deco, medallion.ring.asset, ...medallion.sprites.map((s) => s.asset)]) {
      expect(assetsById[id], id).toBeDefined();
      // Loaded with the card, otherwise the medallion never gets its images.
      expect(critical.has(id), id).toBe(true);
    }
  });

  it('keeps timeline labels in blueprint order', () => {
    const l = storybookConfig.timeline.labels;
    const order = [l.envelopeOpen, l.scene1Back, l.scene1Mid, l.scene1Front, l.scene2Transition, l.characterEnter, l.characterWalk, l.scene3Transition, l.finaleSettle, l.inviteReveal, l.complete];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

describe('camera', () => {
  it('never reveals empty canvas for any scene, layout or camera keyframe', () => {
    for (const scene of storybookConfig.scenes) {
      for (const layout of layouts) {
        const l = scene.layouts[layout];
        expect(l.layers.some((x) => x.coversCamera), `${scene.id}/${layout} needs a covering layer`).toBe(true);
        const issues = validateCameraCoverage(l.layers, assetsById, l.camera, storybookConfig.stages[layout]);
        expect(issues, `${scene.id}/${layout}`).toEqual([]);
      }
    }
  });

  it('detects a camera move that would expose the stage edge', () => {
    const l = storybookConfig.scenes[1].layouts.desktop;
    const camera = { ...l.camera, moves: [{ at: 0, duration: 1, target: { x: 8000, y: 540, zoom: 1 } }] };
    expect(validateCameraCoverage(l.layers, assetsById, camera, storybookConfig.stages.desktop).length).toBeGreaterThan(0);
  });

  it('keeps depth-0 layers fixed and depth-1 layers locked to the camera', () => {
    const stage = { width: 1920, height: 1080 };
    const cam = { x: 1500, y: 600, zoom: 1.2 };
    expect(depthTransform(cam, 0, stage)).toEqual({ tx: 0, ty: 0, s: 1 });
    const t = depthTransform(cam, 1, stage);
    // The camera target lands at the centre of the frame.
    expect(t.tx + t.s * cam.x).toBeCloseTo(960);
    expect(t.ty + t.s * cam.y).toBeCloseTo(540);
  });
});

describe('sprites', () => {
  it('honours loop / hold behaviour', () => {
    expect(frameIndexAt(9.5, { frameCount: 8, loop: true })).toBe(1);
    expect(frameIndexAt(9.5, { frameCount: 8, loop: false })).toBe(7);
  });

  it('maps frames using metadata columns/rows (non-square grids)', () => {
    expect(sheetBackgroundPosition(0, 4, 2)).toBe('0% 0%');
    expect(sheetBackgroundPosition(5, 4, 2)).toBe(`${(1 / 3) * 100}% 100%`);
    expect(sheetBackgroundPosition(2, 3, 1)).toBe('100% 0%');
  });

  it('sheet metadata matches the manifest export size', () => {
    for (const def of Object.values(characters)) {
      for (const { anim } of spriteKeys(def)) {
        if (anim.kind !== 'sheet') continue;
        const entry = assetsById[anim.asset];
        expect(entry.width, anim.asset).toBe(anim.frameWidth * anim.columns);
        expect(entry.height, anim.asset).toBe(anim.frameHeight * anim.rows);
        expect(anim.frameCount).toBeLessThanOrEqual(anim.columns * anim.rows);
        expect(anim.anchor.x).toBeLessThanOrEqual(anim.frameWidth);
        expect(anim.anchor.y).toBeLessThanOrEqual(anim.frameHeight);
      }
    }
  });

  it('plans a walk cycle between idle segments in Scene 2', () => {
    const placement = storybookConfig.scenes[1].layouts.desktop.characters[0];
    const { segments, final } = planCharacter(placement, storybookConfig.timeline.labels);
    expect(segments.map((s) => s.state)).toEqual(['idle', 'walk', 'idle']);
    expect(final.x).toBeGreaterThan(placement.x);
    expect(characters.couple.animations.walk!.frameCount).toBeGreaterThanOrEqual(6);
  });
});

describe('state machine', () => {
  it('starts the sequence exactly once per run', () => {
    let m = storybookReducer(initialMachineState, { type: 'ACTIVATE' });
    expect(m.state).toBe('loading');
    m = storybookReducer(m, { type: 'ASSETS_READY' });
    m = storybookReducer(m, { type: 'ACTIVATE' });
    expect(m.state).toBe('opening');
    const again = storybookReducer(m, { type: 'ACTIVATE' });
    expect(again).toBe(m);
  });

  it('never moves backwards on stale timeline callbacks and supports replay', () => {
    let m: MachineState = { ...initialMachineState, state: 'story' };
    expect(storybookReducer(m, { type: 'TIMELINE', state: 'assembling' })).toBe(m);
    const done = storybookReducer(m, { type: 'TIMELINE', state: 'complete' });
    expect(done.state).toBe('complete');
    const replay = storybookReducer(done, { type: 'REPLAY' });
    expect(replay.state).toBe('opening');
    expect(replay.run).toBe(done.run + 1);
    m = { ...initialMachineState, state: 'loading' };
    expect(storybookReducer(m, { type: 'ASSETS_FAILED', message: 'x' }).state).toBe('error');
  });
});

describe('responsive layout', () => {
  it('picks the mobile composition for the tested phone viewports', () => {
    expect(pickLayout(1440, 900, storybookConfig)).toBe('desktop');
    expect(pickLayout(390, 844, storybookConfig)).toBe('mobile');
    expect(pickLayout(360, 740, storybookConfig)).toBe('mobile');
    expect(pickLayout(844, 390, storybookConfig)).toBe('desktop');
  });

  it('covers the viewport without stretching', () => {
    for (const [w, h] of [[1440, 900], [390, 844], [360, 740]]) {
      const stage = storybookConfig.stages[pickLayout(w, h, storybookConfig)];
      const fit = coverFit(w, h, stage);
      expect(stage.width * fit.scale).toBeGreaterThanOrEqual(w - 0.01);
      expect(stage.height * fit.scale).toBeGreaterThanOrEqual(h - 0.01);
    }
  });
});
