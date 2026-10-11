import type { ReactNode } from 'react';
import { refKeys } from '../engine/refRegistry';
import type { StageSpec } from '../engine/sceneTypes';
import type { StageFit } from '../engine/stageGeometry';
import { useStorybook } from './StorybookContext';

/**
 * Viewport + virtual stage. The stage keeps its configured size (stage px)
 * and is scaled to cover the viewport; everything inside is laid out in stage
 * coordinates, so desktop/mobile configs never deal with device pixels.
 */
export function DioramaStage({ stage, fit, animating, children }: { stage: StageSpec; fit: StageFit; animating: boolean; children: ReactNode }) {
  const { refs } = useStorybook();
  return (
    <div ref={refs.ref(refKeys.stage)} className={`sb-viewport${animating ? ' is-animating' : ''}`}>
      <div
        className="sb-stage"
        style={{
          width: stage.width,
          height: stage.height,
          transform: `translate(${fit.offsetX}px, ${fit.offsetY}px) scale(${fit.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
