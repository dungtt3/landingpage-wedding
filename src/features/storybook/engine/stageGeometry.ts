import type { LayoutMode, StageSpec, StorybookConfig } from './sceneTypes';

export interface StageFit {
  scale: number;
  offsetX: number;
  offsetY: number;
  viewportWidth: number;
  viewportHeight: number;
}

/** Scale the virtual stage to fully cover the viewport (centre crop). */
export function coverFit(viewportWidth: number, viewportHeight: number, stage: StageSpec): StageFit {
  const scale = Math.max(viewportWidth / stage.width, viewportHeight / stage.height);
  return {
    scale,
    offsetX: (viewportWidth - stage.width * scale) / 2,
    offsetY: (viewportHeight - stage.height * scale) / 2,
    viewportWidth,
    viewportHeight,
  };
}

/** Portrait or narrow viewports get the dedicated mobile composition. */
export function pickLayout(width: number, height: number, config: Pick<StorybookConfig, 'mobileBreakpointAspect' | 'mobileMaxWidth'>): LayoutMode {
  if (width <= config.mobileMaxWidth) return 'mobile';
  return width / Math.max(1, height) < config.mobileBreakpointAspect ? 'mobile' : 'desktop';
}

/** Maps a normalised stage rect to viewport px, clamped to the visible area. */
export function stageRectToViewport(
  rect: { x: number; y: number; width: number; height: number },
  stage: StageSpec,
  fit: StageFit,
  padding = 16,
) {
  const left = Math.max(padding, fit.offsetX + rect.x * stage.width * fit.scale);
  const top = Math.max(padding, fit.offsetY + rect.y * stage.height * fit.scale);
  const right = Math.min(fit.viewportWidth - padding, fit.offsetX + (rect.x + rect.width) * stage.width * fit.scale);
  const bottom = Math.min(fit.viewportHeight - padding, fit.offsetY + (rect.y + rect.height) * stage.height * fit.scale);
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}
