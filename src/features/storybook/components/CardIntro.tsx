import gsap from 'gsap';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import presentFileList from 'virtual:storybook-files';
import { AssetLoader } from '../engine/assetLoader';
import { buildEnvelopeReduced, buildEnvelopeTimeline } from '../engine/envelopeTimeline';
import { placeholderForEntry } from '../engine/placeholderArt';
import { RefRegistry, refKeys } from '../engine/refRegistry';
import { envelopeAssetIds } from '../engine/sceneAssets';
import type { AssetEntry, ResolvedAsset, StorybookConfig, StorybookState } from '../engine/sceneTypes';
import { assetManifest } from '../scenes/scene-manifest';
import { storybookConfig } from '../scenes/storybook.config';
import { LiveRegion, useEscapeKey, useReducedMotion, useScrollLock } from './AccessibilityController';
import { EnvelopeIntro } from './EnvelopeIntro';
import type { InvitationContent } from './InvitationOverlay';
import { StorybookContext, type StorybookContextValue } from './StorybookContext';
import '../styles/storybook.css';

const presentFiles: ReadonlySet<string> = new Set(presentFileList);

/** Upper bound for how much the opened card grows towards the viewer. */
const MAX_OPEN_SCALE = 1.7;

interface Props {
  config?: StorybookConfig;
  manifest?: AssetEntry[];
  content: InvitationContent;
  /** Called once the card has opened and faded away (or could not load): show the page. */
  onDone: () => void;
}

/**
 * The closed gatefold card on its medallion backdrop, laid over the landing
 * page. Tapping it opens the card; as the card and backdrop fade out the
 * landing page underneath is revealed and the intro removes itself. No 2.5D
 * scenes are involved, so only the card's own assets are loaded.
 */
export function CardIntro({ config = storybookConfig, manifest = assetManifest, content, onDone }: Props) {
  const refs = useMemo(() => new RefRegistry(), []);
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<StorybookState>('loading');
  const [progress, setProgress] = useState(0);
  const [assets, setAssets] = useState<Record<string, ResolvedAsset>>({});
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  // The opened card waits here until the guest presses "Tiếp tục".
  const [waiting, setWaiting] = useState(false);
  const continueRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setState('complete');
    onDoneRef.current();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const byId = Object.fromEntries(manifest.map((a) => [a.id, a]));
    const loader = new AssetLoader(byId, { presentFiles, allowPlaceholders: true, placeholderFactory: placeholderForEntry });
    loader
      .load(envelopeAssetIds(config), (n, total) => !cancelled && setProgress(total ? n / total : 1))
      .then((results) => {
        if (cancelled) return;
        setAssets(loader.snapshot());
        // Without its art the card is pointless: go straight to the page.
        if (results.some((r) => r.status === 'missing')) finish();
        else setState('ready');
      });
    return () => {
      cancelled = true;
    };
  }, [config, manifest, finish]);

  // One paused timeline: the card's closed pose is set now, the opening plays on tap.
  useLayoutEffect(() => {
    const tl = gsap.timeline({ paused: true, onComplete: finish });
    const wait = () => setWaiting(true);
    if (reducedMotion) buildEnvelopeReduced(tl, refs, 0.4, wait);
    else {
      // Pause once the panels are open and every line of the invitation is in,
      // then (on "Tiếp tục") let the card rush past and fade the backdrop onto the page.
      const o = config.envelope.open;
      const gateAt = 0.1 + o.sealDuration * 0.6; // same steps as buildEnvelopeTimeline
      const openedAt = gateAt + 0.08 + o.gateDuration;
      const lines = refs.get(refKeys.envelope('inside'))?.querySelectorAll('[data-inside]').length ?? 8;
      const textIn = gateAt + o.gateDuration * 0.45 + o.insideDuration + 0.1 * (lines - 1);
      const pauseAt = Math.max(openedAt, textIn) + 0.1;
      const exitOffset = pauseAt + 0.05;
      const envelope = { ...config.envelope, open: { ...o, exitOffset } };
      const labels = { ...config.timeline.labels, envelopeOpen: 0, scene1Back: exitOffset + o.exitDuration * 0.4 };
      // Grow the opened card to most of the screen (room left below for "Tiếp tục") so the text is readable.
      const card = refs.get(refKeys.envelope('card'))?.getBoundingClientRect();
      const openScale = card?.height
        ? Math.min(
            MAX_OPEN_SCALE,
            Math.max(1.04, Math.min((window.innerHeight * 0.8) / card.height, (window.innerWidth * 0.94) / card.width)),
          )
        : 1.04;
      buildEnvelopeTimeline(tl, refs, envelope, labels, openScale);
      tl.addPause(pauseAt, wait);
    }
    tlRef.current = tl;
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [refs, config, reducedMotion, finish]);

  const activate = useCallback(() => {
    if (state !== 'ready') return;
    setState('opening');
    tlRef.current?.play(0);
  }, [state]);

  const skip = useCallback(() => {
    setWaiting(false);
    tlRef.current?.progress(1);
    finish();
  }, [finish]);

  const proceed = useCallback(() => {
    setWaiting(false);
    tlRef.current?.play();
  }, []);

  useEffect(() => {
    if (waiting) continueRef.current?.focus({ preventScroll: true });
  }, [waiting]);

  useEscapeKey(state === 'opening', skip);
  useScrollLock(state !== 'complete');

  const ctxValue = useMemo<StorybookContextValue>(
    () => ({ refs, assets, manifest: Object.fromEntries(manifest.map((a) => [a.id, a])) }),
    [refs, assets, manifest],
  );

  const announcement: Partial<Record<StorybookState, string>> = {
    loading: 'Đang chuẩn bị thiệp cưới.',
    ready: 'Thiệp đã sẵn sàng. Nhấn vào thiệp để mở.',
    opening: waiting ? 'Thiệp đã mở. Nhấn Tiếp tục để xem chi tiết.' : 'Đang mở thiệp. Nhấn Escape để bỏ qua.',
  };

  return (
    <StorybookContext.Provider value={ctxValue}>
      <section className="sb-root sb-root--intro" data-state={state} aria-label="Thiệp cưới">
        <EnvelopeIntro
          config={config.envelope}
          content={content}
          state={state}
          progress={progress}
          reducedMotion={reducedMotion}
          onActivate={activate}
        />
        {waiting && (
          <button ref={continueRef} type="button" className="sb-continue" onClick={proceed}>
            Tiếp tục <span aria-hidden="true">→</span>
          </button>
        )}
        <LiveRegion message={announcement[state] ?? ''} />
      </section>
    </StorybookContext.Provider>
  );
}
