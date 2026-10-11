import gsap from 'gsap';
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type RefObject } from 'react';
import presentFileList from 'virtual:storybook-files';
import { AssetLoader } from '../engine/assetLoader';
import { AudioController } from '../engine/audioController';
import { createMasterTimeline, type DeferredGate, type MasterTimelineHandle } from '../engine/createMasterTimeline';
import { placeholderForEntry, placeholderSpriteSheet } from '../engine/placeholderArt';
import { RefRegistry } from '../engine/refRegistry';
import { collectAssetIds } from '../engine/sceneAssets';
import type { AssetEntry, CharacterDefinition, ResolvedAsset, StorybookConfig, StorybookState } from '../engine/sceneTypes';
import { coverFit, pickLayout, stageRectToViewport } from '../engine/stageGeometry';
import { initialMachineState, isPlaying, storybookReducer } from '../engine/stateMachine';
import { characters as defaultCharacters } from '../scenes/characters.config';
import { assetManifest } from '../scenes/scene-manifest';
import { storybookConfig } from '../scenes/storybook.config';
import { LiveRegion, useEscapeKey, useReducedMotion, useScrollLock } from './AccessibilityController';
import { AssetReport } from './AssetReport';
import { DioramaStage } from './DioramaStage';
import { EnvelopeIntro } from './EnvelopeIntro';
import { InvitationOverlay, type InvitationContent } from './InvitationOverlay';
import { SceneControls } from './SceneControls';
import { SceneRenderer, SceneWipe } from './SceneRenderer';
import { StorybookContext, type StorybookContextValue } from './StorybookContext';
import '../styles/storybook.css';

const presentFiles: ReadonlySet<string> = new Set(presentFileList);

export interface StorybookExperienceProps {
  config?: StorybookConfig;
  characters?: Record<string, CharacterDefinition>;
  manifest?: AssetEntry[];
  content: InvitationContent;
  /** Anchor of the page content that follows the intro; shows a scroll cue once complete. */
  continueHref?: string;
  /** Shows the asset checklist panel. Defaults to the `?debug` query flag. */
  debug?: boolean;
}

function useViewport(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState(() => ({
    width: typeof window === 'undefined' ? 1440 : window.innerWidth,
    height: typeof window === 'undefined' ? 900 : window.innerHeight,
  }));
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (s.width === r.width && s.height === r.height ? s : { width: r.width, height: r.height }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

const query = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);

/**
 * Top-level storybook lifecycle: asset loading → ready envelope → master
 * timeline → stable, interactive invitation. All animation is owned by one
 * GSAP context per build, which is reverted on rebuild (layout/motion
 * preference change, replay) and on unmount.
 */
export function StorybookExperience({
  config = storybookConfig,
  characters = defaultCharacters,
  manifest = assetManifest,
  content,
  continueHref,
  debug = query.has('debug'),
}: StorybookExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const refs = useMemo(() => new RefRegistry(), []);
  const manifestById = useMemo(() => Object.fromEntries(manifest.map((a) => [a.id, a])), [manifest]);

  const [machine, dispatch] = useReducer(storybookReducer, initialMachineState);
  const { state } = machine;
  const stateRef = useRef<StorybookState>(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  const reducedMotion = useReducedMotion();
  const viewport = useViewport(rootRef);
  const layout = pickLayout(viewport.width, viewport.height, config);
  const stage = config.stages[layout];
  const fit = coverFit(viewport.width, viewport.height, stage);

  /* ------------------------------------------------------------ assets */
  const [loadAttempt, setLoadAttempt] = useState(0);
  const loader = useMemo(() => {
    void loadAttempt; // a retry builds a fresh loader (fresh cache)
    const sprites = new Map<string, Parameters<typeof placeholderSpriteSheet>[1]>();
    for (const def of Object.values(characters)) {
      for (const anim of [...Object.values(def.animations), ...Object.values(def.mirrored ?? {})]) {
        if (anim?.kind === 'sheet') sprites.set(anim.asset, anim);
      }
    }
    return new AssetLoader(manifestById, {
      presentFiles,
      allowPlaceholders: !query.has('noPlaceholders'),
      placeholderFactory: (entry) => {
        const sheet = sprites.get(entry.id);
        return sheet && entry.placeholder?.shape === 'sprite-couple' ? placeholderSpriteSheet(entry.id, sheet) : placeholderForEntry(entry);
      },
    });
  }, [manifestById, characters, loadAttempt]);

  const [assets, setAssets] = useState<Record<string, ResolvedAsset>>({});
  const [progress, setProgress] = useState(0);
  const { critical, deferred } = useMemo(() => collectAssetIds(config, layout, characters), [config, layout, characters]);
  const deferredRef = useRef({ ready: false, listeners: new Set<() => void>() });

  useEffect(() => {
    let cancelled = false;
    const gateState = deferredRef.current;
    gateState.ready = false;
    loader
      .load(critical, (n, total) => !cancelled && setProgress(total ? n / total : 1))
      .then((results) => {
        if (cancelled) return;
        setAssets(loader.snapshot());
        const failed = results.filter((r) => r.status === 'missing');
        if (failed.length) {
          dispatch({ type: 'ASSETS_FAILED', message: `Không tải được ${failed.length} hình bắt buộc: ${failed.map((f) => f.id).join(', ')}` });
          return;
        }
        dispatch({ type: 'ASSETS_READY' });
        // Later scenes load progressively while the envelope waits for the user.
        return loader.load(deferred).then(() => {
          if (cancelled) return;
          setAssets(loader.snapshot());
          gateState.ready = true;
          gateState.listeners.forEach((fn) => fn());
          gateState.listeners.clear();
        });
      });
    return () => {
      cancelled = true;
    };
  }, [loader, critical, deferred]);

  const gate = useMemo<DeferredGate>(
    () => ({
      isReady: () => deferredRef.current.ready,
      whenReady(cb) {
        let done = false;
        const fire = () => {
          if (done) return;
          done = true;
          deferredRef.current.listeners.delete(fire);
          timer.kill();
          cb();
        };
        const timer = gsap.delayedCall(config.deferredGate.maxWaitSeconds, fire);
        deferredRef.current.listeners.add(fire);
        return () => {
          done = true;
          deferredRef.current.listeners.delete(fire);
          timer.kill();
        };
      },
    }),
    [config],
  );

  const audio = useMemo(
    () => (config.audio.enabled ? new AudioController((id) => loader.get(id)?.src ?? null) : null),
    [config, loader],
  );
  useEffect(() => () => audio?.dispose(), [audio]);

  /* ---------------------------------------------------------- timeline */
  const engineRef = useRef<MasterTimelineHandle | null>(null);
  const onScreenRef = useRef(true);
  const resumeRef = useRef<{ time: number; playing: boolean } | null>(null);
  const builtRunRef = useRef(-1);
  const isError = state === 'error';

  useLayoutEffect(() => {
    if (isError || !rootRef.current) return;
    const ctx = gsap.context(() => undefined, rootRef.current);
    let handle: MasterTimelineHandle | null = null;
    ctx.add(() => {
      handle = createMasterTimeline({
        config,
        layout,
        refs,
        characters,
        reducedMotion,
        ctx,
        onState: (s) => dispatch({ type: 'TIMELINE', state: s }),
        gate,
        audio,
      });
    });
    const h = handle as MasterTimelineHandle | null;
    if (!h) return () => ctx.revert();
    engineRef.current = h;
    if (debug) (window as unknown as { __storybook?: unknown }).__storybook = { timeline: h.timeline, refs };

    // Same run (resize / motion preference change) → resume at the same time.
    // New run (replay / retry) → start from the initial state.
    const freshRun = builtRunRef.current !== machine.run;
    builtRunRef.current = machine.run;
    const resume = freshRun ? null : resumeRef.current;
    resumeRef.current = null;
    const current = stateRef.current;
    if (current === 'complete') {
      h.finish();
      h.setActive(onScreenRef.current);
    } else if (isPlaying(current)) {
      if (resume && reducedMotion) h.finish();
      else if (resume) {
        h.timeline.seek(resume.time, true);
        if (resume.playing) h.timeline.play();
      } else h.timeline.play(0);
    }

    return () => {
      resumeRef.current = { time: h.timeline.time(), playing: !h.timeline.paused() };
      h.dispose();
      ctx.revert();
      if (engineRef.current === h) engineRef.current = null;
    };
  }, [isError, layout, reducedMotion, machine.run, config, characters, refs, gate, audio, debug]);

  // Once the intro is complete the guest scrolls on to the landing page; stop the
  // resting loops and parallax ticker while the intro is out of view.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || isError) return;
    const io = new IntersectionObserver(([entry]) => {
      onScreenRef.current = entry.isIntersecting;
      engineRef.current?.setActive(entry.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [isError]);

  /* ---------------------------------------------------------- controls */
  const activatedRunRef = useRef(-1);
  const activate = useCallback(() => {
    if (stateRef.current !== 'ready' || activatedRunRef.current === machine.run) return;
    activatedRunRef.current = machine.run;
    stateRef.current = 'opening';
    dispatch({ type: 'ACTIVATE' });
    engineRef.current?.timeline.play(0);
  }, [machine.run]);

  const skip = useCallback(() => {
    if (!isPlaying(stateRef.current)) return;
    dispatch({ type: 'SKIP' });
    engineRef.current?.finish();
  }, []);

  const replay = useCallback(() => dispatch({ type: 'REPLAY' }), []);
  const retry = useCallback(() => {
    dispatch({ type: 'RETRY' });
    setLoadAttempt((n) => n + 1);
  }, []);

  useEscapeKey(isPlaying(state), skip);
  useScrollLock(state !== 'complete' && state !== 'error');

  /* -------------------------------------------------------------- focus */
  const prevStateRef = useRef(state);
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (state === 'opening' && !isPlaying(prev)) skipRef.current?.focus({ preventScroll: true });
    if (state === 'complete' && isPlaying(prev)) headingRef.current?.focus({ preventScroll: true });
  }, [state]);

  /* ------------------------------------------------------------- layout */
  const finale = config.scenes[config.scenes.length - 1]?.layouts[layout];
  const safe = finale?.textSafeArea ?? { x: 0.1, y: 0.15, width: 0.8, height: 0.7 };
  const inviteRect = stageRectToViewport(safe, stage, fit, layout === 'mobile' ? 12 : 24);

  const announcement: Record<StorybookState, string> = {
    loading: 'Đang chuẩn bị thiệp cưới.',
    ready: 'Thiệp đã sẵn sàng. Nhấn vào phong bì để mở.',
    opening: 'Đang mở thiệp. Nhấn Escape để bỏ qua.',
    assembling: '',
    story: '',
    transitioning: '',
    complete: `Thiệp mời đám cưới ${content.groom} và ${content.bride}.`,
    error: machine.error ?? 'Đã xảy ra lỗi.',
  };

  const ctxValue = useMemo<StorybookContextValue>(() => ({ refs, assets, manifest: manifestById }), [refs, assets, manifestById]);

  return (
    <StorybookContext.Provider value={ctxValue}>
      <section ref={rootRef} className={`sb-root sb-root--${layout}`} data-state={state} aria-label="Thiệp cưới">
        {!isError && (
          <DioramaStage stage={stage} fit={fit} animating={isPlaying(state)}>
            {config.scenes.map((scene, i) => (
              <SceneRenderer key={`${scene.id}-${layout}`} scene={scene} index={i} layout={layout} characters={characters} />
            ))}
            {config.scenes.map((scene) => (
              <SceneWipe key={`wipe-${scene.id}-${layout}`} scene={scene} stageWidth={stage.width} stageHeight={stage.height} />
            ))}
          </DioramaStage>
        )}

        <InvitationOverlay ref={headingRef} content={content} rect={inviteRect} layout={layout} staticMode={isError} />

        {!isError && <EnvelopeIntro config={config.envelope} content={content} state={state} progress={progress} reducedMotion={reducedMotion} onActivate={activate} />}

        {isError && (
          <div className="sb-error" role="alert">
            <p>Không thể tải phần minh hoạ của thiệp. Thông tin thiệp vẫn hiển thị bên dưới.</p>
            <p className="sb-error__detail">{machine.error}</p>
            <button type="button" className="sb-chip" onClick={retry}>
              Thử lại
            </button>
          </div>
        )}

        {state === 'complete' && continueHref && layout === 'desktop' && (
          <a className="sb-scroll-cue" href={continueHref}>
            <span>Cuộn xuống xem thiệp</span>
            <span className="sb-scroll-cue__arrow" aria-hidden="true">
              ↓
            </span>
          </a>
        )}

        <SceneControls ref={skipRef} state={state} onSkip={skip} onReplay={replay} />
        <LiveRegion message={announcement[state]} />
        {debug && <AssetReport manifest={manifest} assets={assets} present={presentFiles} state={state} layout={layout} />}
      </section>
    </StorybookContext.Provider>
  );
}
