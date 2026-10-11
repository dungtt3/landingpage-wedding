import type { TimelineConfig, TimelinePosition } from './sceneTypes';

/** Absolute time (s) of a label + offset position. */
export function resolveTime(pos: TimelinePosition, labels: TimelineConfig['labels']): number {
  const base = typeof pos.at === 'number' ? pos.at : labels[pos.at];
  return Math.max(0, base + (pos.offset ?? 0));
}
