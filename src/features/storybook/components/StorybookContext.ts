import { createContext, useContext } from 'react';
import type { RefRegistry } from '../engine/refRegistry';
import type { AssetEntry, ResolvedAsset } from '../engine/sceneTypes';

export interface StorybookContextValue {
  refs: RefRegistry;
  assets: Record<string, ResolvedAsset>;
  manifest: Record<string, AssetEntry>;
}

export const StorybookContext = createContext<StorybookContextValue | null>(null);

export function useStorybook(): StorybookContextValue {
  const ctx = useContext(StorybookContext);
  if (!ctx) throw new Error('useStorybook must be used inside <StorybookExperience>');
  return ctx;
}
