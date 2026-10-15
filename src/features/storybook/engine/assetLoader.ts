import type { AssetEntry, AssetStatus, ResolvedAsset } from './sceneTypes';

export interface AssetLoaderOptions {
  /** Public paths known to exist (from the build-time file scan). `null` = unknown, probe everything. */
  presentFiles: ReadonlySet<string> | null;
  /** Produces placeholder art for an entry, or null when none is available. */
  placeholderFactory: (entry: AssetEntry) => string | null;
  /** Disable placeholders (used to exercise the error state with `?noPlaceholders`). */
  allowPlaceholders?: boolean;
  timeoutMs?: number;
}

export type ProgressHandler = (loaded: number, total: number) => void;

/**
 * Preloads and decodes images. Every request resolves (never rejects):
 * a missing/failed production file falls back to its placeholder, and only an
 * asset without any fallback is reported as `missing`/`optional`.
 * Results are cached, so calling `load` again for the same ids is free.
 */
export class AssetLoader {
  private cache = new Map<string, Promise<ResolvedAsset>>();
  private resolved = new Map<string, ResolvedAsset>();
  private placeholderCache = new Map<string, string | null>();

  constructor(
    private manifest: Record<string, AssetEntry>,
    private options: AssetLoaderOptions,
  ) {}

  get(id: string): ResolvedAsset | undefined {
    return this.resolved.get(id);
  }

  snapshot(): Record<string, ResolvedAsset> {
    return Object.fromEntries(this.resolved);
  }

  async load(ids: Iterable<string>, onProgress?: ProgressHandler): Promise<ResolvedAsset[]> {
    const unique = [...new Set(ids)];
    let done = 0;
    onProgress?.(0, unique.length);
    return Promise.all(
      unique.map((id) =>
        this.loadOne(id).then((r) => {
          done += 1;
          onProgress?.(done, unique.length);
          return r;
        }),
      ),
    );
  }

  private loadOne(id: string): Promise<ResolvedAsset> {
    const cached = this.cache.get(id);
    if (cached) return cached;
    const p = this.resolve(id).then((r) => {
      this.resolved.set(id, r);
      return r;
    });
    this.cache.set(id, p);
    return p;
  }

  private placeholderFor(entry: AssetEntry): string | null {
    if (this.options.allowPlaceholders === false) return null;
    if (!this.placeholderCache.has(entry.id)) this.placeholderCache.set(entry.id, this.options.placeholderFactory(entry));
    return this.placeholderCache.get(entry.id) ?? null;
  }

  private fallback(entry: AssetEntry, error?: string): ResolvedAsset {
    const src = this.placeholderFor(entry);
    if (src) return { id: entry.id, src, status: 'placeholder', error };
    const status: AssetStatus = entry.requirement === 'optional' ? 'optional' : 'missing';
    return { id: entry.id, src: null, status, error };
  }

  private async resolve(id: string): Promise<ResolvedAsset> {
    const entry = this.manifest[id];
    if (!entry) return { id, src: null, status: 'missing', error: `Unknown asset id "${id}"` };
    if (entry.kind === 'audio' || entry.kind === 'reference') {
      const present = this.options.presentFiles?.has(entry.src) ?? false;
      return { id, src: present ? entry.src : null, status: present ? 'available' : entry.requirement === 'optional' ? 'optional' : 'missing' };
    }
    if (this.options.presentFiles && !this.options.presentFiles.has(entry.src)) {
      return this.fallback(entry);
    }
    try {
      await decodeImage(entry.src, this.options.timeoutMs ?? 10000);
      return { id, src: entry.src, status: 'available' };
    } catch (err) {
      return this.fallback(entry, err instanceof Error ? err.message : String(err));
    }
  }
}

/** Longest wait for `img.decode()` once the file itself has loaded. */
const DECODE_WAIT_MS = 1500;

function decodeImage(src: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    const timer = window.setTimeout(() => reject(new Error(`Timed out loading ${src}`)), timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      // decode() avoids a decode hitch on first paint; ignore browsers that reject it.
      // Some (older iOS Safari, in-app browsers) never settle it: the image is loaded, so stop waiting after a moment.
      const decoded = img.decode ? img.decode().catch(() => undefined) : Promise.resolve();
      Promise.race([decoded, new Promise((r) => window.setTimeout(r, DECODE_WAIT_MS))]).then(() => resolve());
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error(`Failed to load ${src}`));
    };
    img.src = src;
  });
}
