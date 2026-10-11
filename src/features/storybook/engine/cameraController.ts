import type { AssetEntry, CameraConfig, CameraTarget, LayerConfig, StageSpec } from './sceneTypes';

/**
 * Camera model
 * ------------
 * The camera is a point C (stage px) that is kept at the centre of the frame,
 * plus a zoom Z ≥ 1. Each layer is transformed according to its depth p:
 *
 *   s       = 1 + (Z − 1) · p
 *   screen  = centre + s · (P − centre − (C − centre) · p)
 *
 * p = 1 is a normal camera, p = 0 is pinned to the screen, p > 1 moves faster
 * (foreground). The result is a 2-D affine transform `translate(t) scale(s)`
 * with transform-origin at the stage origin.
 */
export interface DepthTransform {
  tx: number;
  ty: number;
  s: number;
}

export interface CameraState extends CameraTarget {
  /** Pointer offset in stage px (added to the camera, scaled by depth). */
  px: number;
  py: number;
}

export function createCameraState(camera: CameraConfig): CameraState {
  return { ...camera.start, px: 0, py: 0 };
}

export function depthTransform(cam: CameraTarget & Partial<Pick<CameraState, 'px' | 'py'>>, depth: number, stage: StageSpec): DepthTransform {
  const cx = stage.width / 2;
  const cy = stage.height / 2;
  const s = 1 + (cam.zoom - 1) * depth;
  const camX = cam.x + (cam.px ?? 0);
  const camY = cam.y + (cam.py ?? 0);
  return {
    tx: cx - s * (cx + (camX - cx) * depth),
    ty: cy - s * (cy + (camY - cy) * depth),
    s,
  };
}

export function depthTransformCss(t: DepthTransform): string {
  return `translate3d(${t.tx.toFixed(2)}px, ${t.ty.toFixed(2)}px, 0) scale(${t.s.toFixed(5)})`;
}

/** Zoom below 1 would reveal the stage edges, so it is clamped. */
export function clampCamera(target: CameraTarget): CameraTarget {
  return { ...target, zoom: Math.max(1, target.zoom) };
}

/* -------------------------------------------------------------- layout box */

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function layerBox(layer: LayerConfig, asset: Pick<AssetEntry, 'width' | 'height'> | undefined): Box {
  const ratio = asset && asset.width > 0 ? asset.height / asset.width : 1;
  const width = layer.width;
  const height = layer.height ?? width * ratio;
  const [ax, ay] = layer.anchor ?? [0.5, 0.5];
  return { left: layer.x - width * ax, top: layer.y - height * ay, width, height };
}

/* ---------------------------------------------------------------- coverage */

export interface CoverageIssue {
  layer: string;
  camera: CameraTarget;
  edge: 'left' | 'right' | 'top' | 'bottom';
}

/** Checks that a layer box fully covers the stage frame for one camera. */
export function coverageGaps(box: Box, depth: number, cam: CameraTarget, stage: StageSpec, margin = 0): CoverageIssue['edge'][] {
  const t = depthTransform(cam, depth, stage);
  const left = t.tx + t.s * box.left;
  const right = t.tx + t.s * (box.left + box.width);
  const top = t.ty + t.s * box.top;
  const bottom = t.ty + t.s * (box.top + box.height);
  const edges: CoverageIssue['edge'][] = [];
  if (left > -margin) edges.push('left');
  if (right < stage.width + margin) edges.push('right');
  if (top > -margin) edges.push('top');
  if (bottom < stage.height + margin) edges.push('bottom');
  return edges;
}

/**
 * Samples the whole camera path (start, every move and the interpolation in
 * between, plus the pointer-parallax margin) and reports frames in which a
 * `coversCamera` layer would expose empty canvas.
 */
export function validateCameraCoverage(
  layers: LayerConfig[],
  assets: Record<string, Pick<AssetEntry, 'width' | 'height'>>,
  camera: CameraConfig,
  stage: StageSpec,
): CoverageIssue[] {
  const covering = layers.filter((l) => l.coversCamera);
  const samples: CameraTarget[] = [];
  let prev = clampCamera(camera.start);
  samples.push(prev);
  for (const move of camera.moves) {
    const next = clampCamera(move.target);
    for (let i = 1; i <= 10; i++) {
      const u = i / 10;
      samples.push({
        x: prev.x + (next.x - prev.x) * u,
        y: prev.y + (next.y - prev.y) * u,
        zoom: prev.zoom + (next.zoom - prev.zoom) * u,
      });
    }
    prev = next;
  }
  const pointer = camera.pointerParallax ?? 0;
  const issues: CoverageIssue[] = [];
  for (const layer of covering) {
    const box = layerBox(layer, assets[layer.asset]);
    for (const cam of samples) {
      const offsets = pointer ? [[0, 0], [pointer, pointer], [-pointer, -pointer], [pointer, -pointer], [-pointer, pointer]] : [[0, 0]];
      for (const [ox, oy] of offsets) {
        const probe = { ...cam, x: cam.x + ox, y: cam.y + oy };
        for (const edge of coverageGaps(box, layer.depth, probe, stage)) {
          issues.push({ layer: layer.id, camera: probe, edge });
        }
      }
    }
  }
  return issues;
}
