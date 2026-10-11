import { memo } from 'react';
import { spriteKeys } from '../engine/characterController';
import { refKeys } from '../engine/refRegistry';
import type { CharacterDefinition, CharacterPlacement } from '../engine/sceneTypes';
import { spriteBox } from '../engine/spriteSheet';
import { AssetImage } from './AssetImage';
import { useStorybook } from './StorybookContext';

/**
 * Character rig. The origin of every wrapper is the foot point, so walking,
 * mirroring and switching between animations of different frame sizes never
 * shifts the character. One element per animation state; the
 * CharacterController shows one at a time and steps its frames.
 */
export const CharacterSprite = memo(function CharacterSprite({
  sceneId,
  placement,
  definition,
}: {
  sceneId: string;
  placement: CharacterPlacement;
  definition: CharacterDefinition;
}) {
  const { refs, assets } = useStorybook();
  return (
    <div
      ref={refs.ref(refKeys.character(sceneId, placement.id, 'depth'))}
      className="sb-depth sb-character"
      data-character={placement.id}
      style={{
        left: placement.x,
        top: placement.y,
        zIndex: placement.z,
        transformOrigin: `${-placement.x}px ${-placement.y}px`,
      }}
    >
      <div ref={refs.ref(refKeys.character(sceneId, placement.id, 'motion'))} className="sb-character__motion">
        <div ref={refs.ref(refKeys.character(sceneId, placement.id, 'facing'))} className="sb-character__facing">
          {spriteKeys(definition).map(({ key, anim }) => {
            const box = spriteBox(anim, placement.scale);
            const ref = refs.ref(refKeys.sprite(sceneId, placement.id, key));
            if (anim.kind === 'sheet') {
              const resolved = assets[anim.asset];
              return (
                <div
                  key={key}
                  ref={ref}
                  className="sb-sprite"
                  data-state={key}
                  data-status={resolved?.status}
                  style={{
                    ...box,
                    backgroundImage: resolved?.src ? `url("${resolved.src}")` : undefined,
                    backgroundSize: `${anim.columns * 100}% ${anim.rows * 100}%`,
                  }}
                />
              );
            }
            return (
              <div key={key} ref={ref} className="sb-sprite" data-state={key} style={box}>
                {anim.frames.map((f) => (
                  <AssetImage key={f} asset={f} className="sb-sprite__frame" />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
