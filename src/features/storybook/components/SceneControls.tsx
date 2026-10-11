import { forwardRef } from 'react';
import type { StorybookState } from '../engine/sceneTypes';
import { isPlaying } from '../engine/stateMachine';

interface Props {
  state: StorybookState;
  onSkip: () => void;
  onReplay: () => void;
}

/** Skip while the cinematic plays; replay once the invitation is complete. */
export const SceneControls = forwardRef<HTMLButtonElement, Props>(function SceneControls({ state, onSkip, onReplay }, skipRef) {
  return (
    <div className="sb-controls">
      {isPlaying(state) && (
        <button ref={skipRef} type="button" className="sb-chip" onClick={onSkip} aria-keyshortcuts="Escape">
          Bỏ qua <span aria-hidden="true">›</span>
        </button>
      )}
      {state === 'complete' && (
        <button type="button" className="sb-chip" onClick={onReplay}>
          <span aria-hidden="true">↺</span> Xem lại phần mở đầu
        </button>
      )}
    </div>
  );
});
