import gsap from 'gsap';
import { depthTransform, depthTransformCss, type CameraState } from './cameraController';
import type { StageSpec } from './sceneTypes';

export interface DepthItem {
  el: HTMLElement;
  depth: number;
}

interface SceneRig {
  camera: CameraState;
  items: DepthItem[];
  pointerStrength: number;
  last: string;
}

/**
 * Applies depth-based transforms to every layer of every scene from that
 * scene's camera state. GSAP tweens the camera state objects (so the master
 * timeline stays the single source of truth); this controller only projects
 * them onto the DOM once per tick and only when something changed.
 *
 * Optional pointer parallax nudges the camera by a few stage px after the
 * sequence completes (fine pointers only, never with reduced motion).
 */
export class ParallaxController {
  private rigs: SceneRig[] = [];
  private running = false;
  private pointerTarget = { x: 0, y: 0 };
  private pointer = { x: 0, y: 0 };
  private pointerEnabled = false;
  private host: HTMLElement | null = null;

  constructor(private stage: StageSpec) {}

  addScene(camera: CameraState, items: DepthItem[], pointerStrength = 0) {
    this.rigs.push({ camera, items, pointerStrength, last: '' });
  }

  start() {
    if (this.running) return;
    this.running = true;
    gsap.ticker.add(this.tick);
    this.tick();
  }

  /** Stop projecting without clearing transforms (resume with `start`). */
  pause() {
    this.running = false;
    gsap.ticker.remove(this.tick);
  }

  stop() {
    this.running = false;
    gsap.ticker.remove(this.tick);
    this.disablePointer();
    // Leave no stale transforms behind; the next build re-projects from its camera start.
    for (const rig of this.rigs) for (const item of rig.items) item.el.style.transform = '';
    this.rigs = [];
  }

  /** Enable pointer-driven parallax on `host` (removes itself on stop). */
  enablePointer(host: HTMLElement) {
    if (this.pointerEnabled) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    this.pointerEnabled = true;
    this.host = host;
    host.addEventListener('pointermove', this.onPointer);
    host.addEventListener('pointerleave', this.onLeave);
  }

  disablePointer() {
    if (this.host) {
      this.host.removeEventListener('pointermove', this.onPointer);
      this.host.removeEventListener('pointerleave', this.onLeave);
    }
    this.host = null;
    this.pointerEnabled = false;
    this.pointerTarget.x = this.pointerTarget.y = 0;
    this.pointer.x = this.pointer.y = 0;
  }

  private onPointer = (e: PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.pointerTarget.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerTarget.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  };

  private onLeave = () => {
    this.pointerTarget.x = 0;
    this.pointerTarget.y = 0;
  };

  private tick = () => {
    // Ease the pointer toward its target for a soft, frame-rate independent follow.
    // deltaRatio() is NaN outside a ticker frame (the synchronous first tick) — never let NaN in.
    const ratio = gsap.ticker.deltaRatio(60);
    const k = Number.isFinite(ratio) ? 1 - Math.pow(0.0015, ratio / 60) : 1;
    this.pointer.x += (this.pointerTarget.x - this.pointer.x) * k;
    this.pointer.y += (this.pointerTarget.y - this.pointer.y) * k;

    for (const rig of this.rigs) {
      const cam = rig.camera;
      cam.px = this.pointer.x * rig.pointerStrength;
      cam.py = this.pointer.y * rig.pointerStrength * 0.6;
      const key = `${cam.x.toFixed(2)}|${cam.y.toFixed(2)}|${cam.zoom.toFixed(4)}|${cam.px.toFixed(2)}|${cam.py.toFixed(2)}`;
      if (key === rig.last) continue;
      rig.last = key;
      for (const item of rig.items) {
        item.el.style.transform = depthTransformCss(depthTransform(cam, item.depth, this.stage));
      }
    }
  };
}
