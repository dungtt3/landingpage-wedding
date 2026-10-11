/**
 * Typed schema for the storybook engine.
 *
 * Coordinate system: every layout value is expressed in *virtual stage pixels*.
 * The desktop stage is 1920×1080 and the mobile stage is 1080×1920 (see
 * `StageSpec`). `DioramaStage` scales the stage to the viewport ("cover"), so
 * configs never deal with real device pixels.
 *
 * Layout position (x/y/width/height + anchor) is static and applied once with
 * CSS. Motion (enter/exit/ambient/camera) is always a GSAP transform layered on
 * top of the layout, so the two never fight over the same property.
 */

export type LayoutMode = 'desktop' | 'mobile';

export type StorybookState =
  | 'loading'
  | 'ready'
  | 'opening'
  | 'assembling'
  | 'story'
  | 'transitioning'
  | 'complete'
  | 'error';

/* ------------------------------------------------------------------ assets */

export type AssetKind = 'image' | 'spritesheet' | 'audio' | 'reference';

/** `required` assets must exist for production; `optional` ones are nice-to-have. */
export type AssetRequirement = 'required' | 'optional';

/** Status reported by the manifest check and the runtime loader. */
export type AssetStatus = 'available' | 'placeholder' | 'missing' | 'optional';

export type PlaceholderShape =
  | 'sky'
  | 'mountains'
  | 'hills'
  | 'cloud'
  | 'sun'
  | 'tree'
  | 'lantern'
  | 'flowers'
  | 'grass'
  | 'branch'
  | 'house'
  | 'path'
  | 'arch'
  | 'fence'
  | 'petals'
  | 'glow'
  | 'curtain'
  | 'paper'
  | 'envelope-body'
  | 'envelope-flap'
  | 'envelope-seal'
  | 'letter'
  | 'sprite-couple';

export interface PlaceholderSpec {
  shape: PlaceholderShape;
  /** Up to four colours; meaning depends on the shape. */
  palette: string[];
  /** Seed for deterministic scatter (petals, flowers…). */
  seed?: number;
  /** Mirror horizontally (e.g. right-hand foreground). */
  flip?: boolean;
}

export interface AssetEntry {
  id: string;
  /** Public URL where the final production file is expected. */
  src: string;
  kind: AssetKind;
  requirement: AssetRequirement;
  /** Preloaded before the envelope becomes clickable. */
  critical?: boolean;
  /** Intrinsic export size in px (used for aspect ratio + placeholder canvas). */
  width: number;
  height: number;
  description: string;
  /** Generated art used while the production file is missing. `null` = none. */
  placeholder: PlaceholderSpec | null;
}

export interface ResolvedAsset {
  id: string;
  /** URL actually rendered (production file or generated placeholder). */
  src: string | null;
  status: AssetStatus;
  error?: string;
}

/* --------------------------------------------------------------- transforms */

export interface TransformState {
  x?: number;
  y?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  rotationX?: number;
  opacity?: number;
}

/**
 * A timeline position: a label from `TimelineConfig.labels` plus an optional
 * offset in seconds, or an absolute time.
 */
export interface TimelinePosition {
  at: TimelineLabel | number;
  offset?: number;
}

export interface LayerMotion extends TimelinePosition {
  duration: number;
  ease?: string;
  /** Start state for an enter motion (applied when the timeline is built). */
  from?: TransformState;
  /** End state; defaults to the identity transform (= layout position). */
  to?: TransformState;
}

export interface AmbientMotion {
  property: 'x' | 'y' | 'rotation' | 'scale' | 'opacity';
  /** Peak deviation (px, deg, scale delta or opacity delta). */
  amplitude: number;
  /** Seconds for a full back-and-forth cycle. */
  period: number;
  ease?: string;
}

/* ------------------------------------------------------------------ layers */

export type LayerRole =
  | 'background'
  | 'backOrnament'
  | 'midground'
  | 'prop'
  | 'foreground'
  | 'occluder'
  | 'atmosphere'
  | 'mask';

export interface LayerConfig {
  id: string;
  /** Asset id from the manifest. */
  asset: string;
  role: LayerRole;
  /**
   * Parallax factor relative to the camera: 0 = fixed to the screen (sky),
   * 1 = moves exactly with the camera, >1 = foreground that moves faster.
   */
  depth: number;
  /** Stacking order inside the scene. */
  z: number;
  /** Position of the anchor point, in stage px. */
  x: number;
  y: number;
  width: number;
  /** Defaults to width × asset aspect ratio. */
  height?: number;
  /** Normalised anchor inside the layer box. Default `[0.5, 0.5]`. */
  anchor?: [number, number];
  /** This layer must cover the visible frame for every camera position. */
  coversCamera?: boolean;
  visible?: boolean;
  /** Static opacity of the art (multiplied with animated opacity). */
  opacity?: number;
  enter?: LayerMotion;
  exit?: LayerMotion;
  ambient?: AmbientMotion;
  /** Optional CSS mix-blend-mode for atmosphere layers. */
  blend?: 'normal' | 'screen' | 'multiply' | 'soft-light';
}

/* ------------------------------------------------------------------ camera */

export interface CameraTarget {
  /** Point (stage px) that should sit at the centre of the frame. */
  x: number;
  y: number;
  /** ≥ 1. Values below 1 would reveal the stage edges. */
  zoom: number;
}

export interface CameraMove extends TimelinePosition {
  target: CameraTarget;
  duration: number;
  ease?: string;
}

export interface CameraConfig {
  start: CameraTarget;
  moves: CameraMove[];
  /** Max pointer-driven offset (stage px) once the sequence is complete. */
  pointerParallax?: number;
}

/* -------------------------------------------------------------- characters */

export type CharacterAnimState = 'idle' | 'walk' | 'run' | 'turn' | 'wave' | 'pose';
export type Facing = 'left' | 'right';

interface SpriteAnimationBase {
  state: CharacterAnimState;
  /** Width/height of one frame in source px. */
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  loop: boolean;
  /** Direction the art faces as drawn. */
  facing: Facing;
  /** Foot point inside a frame, in source px. Kept stable across frames. */
  anchor: { x: number; y: number };
  /** Frames include transparent padding around the figure. */
  paddedFrames: boolean;
  /** Allow mirroring when the opposite facing is needed. */
  mirrorable: boolean;
}

export interface SpriteSheetAnimation extends SpriteAnimationBase {
  kind: 'sheet';
  /** Asset id of the sprite sheet. */
  asset: string;
  columns: number;
  rows: number;
}

export interface FrameSequenceAnimation extends SpriteAnimationBase {
  kind: 'frames';
  /** Asset ids, one per frame, in playback order. */
  frames: string[];
}

export type SpriteAnimation = SpriteSheetAnimation | FrameSequenceAnimation;

export interface CharacterDefinition {
  id: string;
  label: string;
  /** Animations by state; a state may have an explicit opposite-facing variant. */
  animations: Partial<Record<CharacterAnimState, SpriteAnimation>>;
  mirrored?: Partial<Record<CharacterAnimState, SpriteAnimation>>;
}

export type CharacterAction =
  | ({ type: 'appear'; state: CharacterAnimState; duration: number; ease?: string; from?: TransformState } & TimelinePosition)
  | ({ type: 'play'; state: CharacterAnimState; duration: number } & TimelinePosition)
  | ({
      type: 'walk';
      to: { x: number; y: number };
      duration: number;
      ease?: string;
      state?: CharacterAnimState;
    } & TimelinePosition)
  | ({ type: 'face'; facing: Facing } & TimelinePosition)
  | ({ type: 'hide'; duration: number } & TimelinePosition);

export interface CharacterPlacement {
  /** Instance id inside the scene. */
  id: string;
  /** Id in the character registry. */
  character: string;
  depth: number;
  z: number;
  /** Foot position in stage px. */
  x: number;
  y: number;
  /** Stage px per source px. */
  scale: number;
  facing: Facing;
  initialState: CharacterAnimState;
  /** Hidden until an `appear` action. */
  hiddenAtStart?: boolean;
  script: CharacterAction[];
  /** State looped forever once the sequence is complete (finale only). */
  restingState?: CharacterAnimState;
}

/* ------------------------------------------------------------------ scenes */

export type TransitionType = 'cut' | 'crossfade' | 'wipe' | 'iris';

export interface SceneTransition extends TimelinePosition {
  type: TransitionType;
  duration: number;
  ease?: string;
  /** Asset id for the foreground element sweeping across a `wipe`. */
  wipeAsset?: string;
  direction?: 'left' | 'right';
}

export interface SceneLayout {
  layers: LayerConfig[];
  characters: CharacterPlacement[];
  camera: CameraConfig;
  /** Normalised rect (0–1 of the stage) kept free for invitation text. */
  textSafeArea?: NormRect;
}

export interface SceneConfig {
  id: string;
  title: string;
  background: string;
  /** How this scene enters. The first scene is revealed by the envelope. */
  transitionIn: SceneTransition;
  /** Timeline label at which the scene stops being visible (for ambient loops). */
  endsAt?: TimelineLabel;
  layouts: Record<LayoutMode, SceneLayout>;
}

export interface StageSpec {
  width: number;
  height: number;
}

/* ---------------------------------------------------------------- timeline */

export type TimelineLabel =
  | 'envelopeOpen'
  | 'scene1Back'
  | 'scene1Mid'
  | 'scene1Front'
  | 'scene2Transition'
  | 'characterEnter'
  | 'cameraJourney'
  | 'characterWalk'
  | 'scene3Transition'
  | 'finaleSettle'
  | 'inviteReveal'
  | 'complete';

export interface TimelineConfig {
  /** Absolute offsets (s) of every label. Tune here, not in the engine. */
  labels: Record<TimelineLabel, number>;
  /** Labels at which the public state machine changes. */
  states: { at: TimelineLabel; state: StorybookState }[];
  /** Total length of the reduced-motion sequence. */
  reducedMotionDuration: number;
}

/** Normalised rectangle (0–1) inside a parent box. */
export interface NormRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The opening card: a gatefold whose two panels swing open after the
 * medallion seal lifts off. Part rects come from the art export
 * (`scripts/split-gatefold-card.py` prints them).
 */
export interface MedallionSprite {
  asset: string;
  /** Box on the square medallion canvas. */
  rect: NormRect;
  /** Sway pivot as a fraction of the sprite box (0..1). */
  pivot: [number, number];
  /** Flowers breathe and rock around their centre; sprigs sway from their stem. */
  kind: 'flower' | 'sprig';
}

export interface MedallionConfig {
  /** Still layer (ivory centre, leaves, phoenixes) covering the whole canvas. */
  deco: string;
  /** Lattice ring, spun in place, and its box on the canvas. */
  ring: { asset: string; rect: NormRect; turnSeconds: number };
  sprites: MedallionSprite[];
  /** Paper-petal confetti fired on tap. */
  confetti: { count: number; colors: string[] };
}

export interface EnvelopeConfig {
  /** Closed card width / height. */
  aspect: number;
  /** `paper`: the invitation sheet revealed inside the opened card (text sits in its ivory panel). */
  assets: { left: string; right: string; seal: string; backdrop: string; paper: string };
  /**
   * Where each cut-out sits inside the closed card box. `panelLabel` is
   * relative to the right panel: the area where the art's original lettering
   * was removed and `text.panel` is laid over in HTML.
   */
  parts: { left: NormRect; right: NormRect; seal: NormRect; panelLabel: NormRect };
  /** Lettering on the card: `panel` is written top to bottom, one entry per line. */
  text: { panel: string[] };
  /** Backdrop behind the closed card: base colour, tiled pattern size (px) and its opacity. */
  backdrop: { color: string; tile: number; opacity: number };
  /** Animated floral medallion framed behind the closed card. */
  medallion: MedallionConfig;
  open: {
    sealDuration: number;
    gateDuration: number;
    /** Panels swing this far (deg); < 180 keeps a hint of perspective. */
    gateAngle: number;
    insideDuration: number;
    exitDuration: number;
    /** Exit begins this many seconds after `envelopeOpen`. */
    exitOffset: number;
  };
}

export interface AudioCue extends TimelinePosition {
  asset: string;
  volume?: number;
}

export interface StorybookConfig {
  stages: Record<LayoutMode, StageSpec>;
  /** Viewport aspect ratio (w/h) below which the mobile composition is used. */
  mobileBreakpointAspect: number;
  mobileMaxWidth: number;
  timeline: TimelineConfig;
  envelope: EnvelopeConfig;
  scenes: SceneConfig[];
  audio: { enabled: boolean; cues: AudioCue[] };
  /** Deferred assets must arrive before this label or the timeline waits. */
  deferredGate: { at: TimelineLabel; maxWaitSeconds: number };
}
