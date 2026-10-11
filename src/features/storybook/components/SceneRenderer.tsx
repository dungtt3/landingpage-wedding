import { refKeys } from '../engine/refRegistry';
import type { CharacterDefinition, LayoutMode, SceneConfig } from '../engine/sceneTypes';
import { CharacterSprite } from './CharacterSprite';
import { SceneLayer } from './SceneLayer';
import { useStorybook } from './StorybookContext';

/** Renders one scene's configured layers and characters in z order. */
export function SceneRenderer({
  scene,
  index,
  layout,
  characters,
}: {
  scene: SceneConfig;
  index: number;
  layout: LayoutMode;
  characters: Record<string, CharacterDefinition>;
}) {
  const { refs } = useStorybook();
  const l = scene.layouts[layout];
  return (
    <div
      ref={refs.ref(refKeys.scene(scene.id))}
      className="sb-scene"
      data-scene={scene.id}
      style={{ zIndex: index + 1, backgroundColor: scene.background }}
      aria-hidden="true"
    >
      {l.layers
        .filter((layer) => layer.visible !== false)
        .map((layer) => (
          <SceneLayer key={layer.id} sceneId={scene.id} layer={layer} />
        ))}
      {l.characters.map((c) => {
        const def = characters[c.character];
        return def ? <CharacterSprite key={c.id} sceneId={scene.id} placement={c} definition={def} /> : null;
      })}
    </div>
  );
}

/** Foreground element that sweeps across the frame for `wipe` transitions. */
export function SceneWipe({ scene, stageWidth, stageHeight }: { scene: SceneConfig; stageWidth: number; stageHeight: number }) {
  const { refs } = useStorybook();
  const asset = scene.transitionIn.wipeAsset;
  if (scene.transitionIn.type !== 'wipe' || !asset) return null;
  return (
    <div
      ref={refs.ref(refKeys.wipe(scene.id))}
      className="sb-wipe"
      aria-hidden="true"
      style={{ width: stageWidth * 1.4, height: stageHeight * 1.2, top: -stageHeight * 0.1 }}
    >
      <WipeImage asset={asset} />
    </div>
  );
}

function WipeImage({ asset }: { asset: string }) {
  const { assets } = useStorybook();
  const src = assets[asset]?.src;
  return src ? <img src={src} alt="" draggable={false} className="sb-layer-img" /> : <div className="sb-wipe__fallback" />;
}
