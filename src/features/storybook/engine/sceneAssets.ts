import { spriteKeys } from './characterController';
import type { CharacterDefinition, LayoutMode, SceneConfig, StorybookConfig } from './sceneTypes';

function sceneAssetIds(scene: SceneConfig, layout: LayoutMode, characters: Record<string, CharacterDefinition>): string[] {
  const l = scene.layouts[layout];
  const ids = l.layers.filter((x) => x.visible !== false).map((x) => x.asset);
  if (scene.transitionIn.wipeAsset) ids.push(scene.transitionIn.wipeAsset);
  for (const c of l.characters) {
    const def = characters[c.character];
    if (!def) continue;
    for (const { anim } of spriteKeys(def)) {
      if (anim.kind === 'sheet') ids.push(anim.asset);
      else ids.push(...anim.frames);
    }
  }
  return ids;
}

/** Everything the closed card needs: backdrop, card parts and the floral medallion. */
export function envelopeAssetIds(config: StorybookConfig): string[] {
  const { medallion } = config.envelope;
  return [...Object.values(config.envelope.assets), medallion.deco, medallion.ring.asset, ...medallion.sprites.map((s) => s.asset)];
}

/**
 * Splits the assets of one layout into the critical set (envelope + first
 * scene; required before the envelope becomes clickable) and the deferred set
 * (later scenes; loaded progressively in the background).
 */
export function collectAssetIds(config: StorybookConfig, layout: LayoutMode, characters: Record<string, CharacterDefinition>) {
  const envelope = envelopeAssetIds(config);
  const [first, ...rest] = config.scenes;
  const critical = new Set([...envelope, ...(first ? sceneAssetIds(first, layout, characters) : [])]);
  const deferred = new Set<string>();
  for (const scene of rest) for (const id of sceneAssetIds(scene, layout, characters)) if (!critical.has(id)) deferred.add(id);
  if (config.audio.enabled) for (const cue of config.audio.cues) deferred.add(cue.asset);
  return { critical: [...critical], deferred: [...deferred] };
}
