import { memo } from 'react';
import { layerBox } from '../engine/cameraController';
import { refKeys } from '../engine/refRegistry';
import type { LayerConfig } from '../engine/sceneTypes';
import { AssetImage } from './AssetImage';
import { useStorybook } from './StorybookContext';

/**
 * One cutout layer = three nested wrappers so motions never fight:
 *   depth   — camera/parallax transform (written by ParallaxController)
 *   motion  — enter/exit tweens (GSAP)
 *   ambient — looping secondary motion (GSAP)
 * The static layout position is plain CSS on the depth wrapper.
 */
export const SceneLayer = memo(function SceneLayer({ sceneId, layer }: { sceneId: string; layer: LayerConfig }) {
  const { refs, manifest } = useStorybook();
  const box = layerBox(layer, manifest[layer.asset]);
  const [ax, ay] = layer.anchor ?? [0.5, 0.5];
  const origin = `${ax * 100}% ${ay * 100}%`;
  return (
    <div
      ref={refs.ref(refKeys.layer(sceneId, layer.id, 'depth'))}
      className="sb-depth"
      data-layer={layer.id}
      data-role={layer.role}
      style={{
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        zIndex: layer.z,
        transformOrigin: `${-box.left}px ${-box.top}px`,
        mixBlendMode: layer.blend && layer.blend !== 'normal' ? layer.blend : undefined,
      }}
    >
      <div ref={refs.ref(refKeys.layer(sceneId, layer.id, 'motion'))} className="sb-fill" style={{ transformOrigin: origin }}>
        <div ref={refs.ref(refKeys.layer(sceneId, layer.id, 'ambient'))} className="sb-fill" style={{ transformOrigin: origin }}>
          <AssetImage asset={layer.asset} className="sb-layer-img" style={layer.opacity !== undefined ? { opacity: layer.opacity } : undefined} />
        </div>
      </div>
    </div>
  );
});
