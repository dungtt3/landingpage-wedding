import type { StorybookState } from './sceneTypes';

export type StorybookEvent =
  | { type: 'ASSETS_READY' }
  | { type: 'ASSETS_FAILED'; message: string }
  | { type: 'ACTIVATE' }
  | { type: 'TIMELINE'; state: StorybookState }
  | { type: 'SKIP' }
  | { type: 'REPLAY' }
  | { type: 'RETRY' };

export interface MachineState {
  state: StorybookState;
  error: string | null;
  /** Incremented to force a fresh timeline build (replay/retry). */
  run: number;
}

export const initialMachineState: MachineState = { state: 'loading', error: null, run: 0 };

const PLAYING: StorybookState[] = ['opening', 'assembling', 'story', 'transitioning'];

export const isPlaying = (s: StorybookState) => PLAYING.includes(s);

/** Allowed timeline-driven transitions (prevents stale callbacks from moving backwards). */
const ORDER: StorybookState[] = ['ready', 'opening', 'assembling', 'story', 'transitioning', 'complete'];

export function storybookReducer(m: MachineState, e: StorybookEvent): MachineState {
  switch (e.type) {
    case 'ASSETS_READY':
      return m.state === 'loading' ? { ...m, state: 'ready' } : m;
    case 'ASSETS_FAILED':
      return m.state === 'loading' ? { ...m, state: 'error', error: e.message } : m;
    case 'ACTIVATE':
      // The envelope can start the sequence exactly once per run.
      return m.state === 'ready' ? { ...m, state: 'opening' } : m;
    case 'TIMELINE': {
      if (!isPlaying(m.state)) return m;
      return ORDER.indexOf(e.state) > ORDER.indexOf(m.state) ? { ...m, state: e.state } : m;
    }
    case 'SKIP':
      return isPlaying(m.state) ? { ...m, state: 'complete' } : m;
    case 'REPLAY':
      return m.state === 'complete' ? { ...m, state: 'opening', run: m.run + 1 } : m;
    case 'RETRY':
      return m.state === 'error' ? { ...initialMachineState, run: m.run + 1 } : m;
  }
}
