/**
 * Instance-scoped element registry. Components register elements under
 * structured keys; the engine looks them up here instead of querying the
 * document, so two storybook instances can never animate each other's layers.
 */
export type LayerPart = 'depth' | 'motion' | 'ambient';
export type CharacterPart = 'depth' | 'motion' | 'facing';

export const refKeys = {
  scene: (sceneId: string) => `scene/${sceneId}`,
  layer: (sceneId: string, layerId: string, part: LayerPart) => `layer/${sceneId}/${layerId}/${part}`,
  character: (sceneId: string, id: string, part: CharacterPart) => `char/${sceneId}/${id}/${part}`,
  sprite: (sceneId: string, id: string, state: string) => `char/${sceneId}/${id}/state/${state}`,
  wipe: (sceneId: string) => `wipe/${sceneId}`,
  envelope: (part: 'root' | 'backdrop' | 'card' | 'left' | 'right' | 'seal' | 'inside' | 'hint') => `envelope/${part}`,
  invite: 'invite/root',
  stage: 'stage/root',
} as const;

export class RefRegistry {
  private els = new Map<string, HTMLElement>();
  private callbacks = new Map<string, (el: HTMLElement | null) => void>();

  /** Stable callback ref for a key (memoised so React doesn't churn it). */
  ref = (key: string) => {
    let cb = this.callbacks.get(key);
    if (!cb) {
      cb = (el: HTMLElement | null) => {
        if (el) this.els.set(key, el);
        else this.els.delete(key);
      };
      this.callbacks.set(key, cb);
    }
    return cb;
  };

  get(key: string): HTMLElement | undefined {
    return this.els.get(key);
  }

  require(key: string): HTMLElement {
    const el = this.els.get(key);
    if (!el) throw new Error(`[storybook] Missing element for ref "${key}"`);
    return el;
  }
}
