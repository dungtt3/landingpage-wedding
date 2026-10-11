# Agent Brief — Interactive 2.5D Cutout / Storybook Wedding Animation

## 0. Product decisions (fixed)

- **Character animation:** sprite sheets and/or multiple authored poses. Do not rely on moving a single static image for a complete walk cycle.
- **Number of scenes:** three.
- **Trigger:** user clicks/taps the envelope once; the cinematic sequence then plays automatically.
- **Mobile:** dedicated mobile composition and layout, with mobile-specific scene framing/assets where required. Reuse character frames when they remain visually suitable; do not duplicate assets without a reason.
- **Visual direction:** cinematic illustrated storybook / 2.5D cutout animation. Separate foreground, midground, background, characters, props, and atmospheric effects into independently controlled layers.
- **Initial technology:** React + TypeScript + GSAP + CSS transforms. Follow the existing repository's framework and conventions. Do not introduce Three.js/WebGL in the first implementation unless a measured requirement cannot be met with layered images.

## 1. Goal

Build a reusable animation engine for an online wedding invitation. The opening should feel like entering an illustrated storybook: the user opens an envelope, a layered scene assembles, the camera travels through a short story with animated characters, and the experience resolves into a polished wedding invitation scene.

The output must be an actual working implementation, not only a visual mockup. All motion must be deterministic, responsive, replayable, and driven by a coordinated GSAP timeline.

## 2. Three-scene storyboard

The exact artwork and story details will be supplied by the product owner. Do not invent final production artwork or assume supplied assets exist. Use clearly marked placeholders until assets are added.

### Scene 1 — Envelope / Scene assembly

Purpose: establish the invitation and transition the viewer into the storybook.

1. Render an envelope on a quiet opening background.
2. The user activates it with click, tap, Enter, or Space.
3. Animate the envelope flap/seal/opening using the available envelope assets or CSS/SVG parts.
4. Reveal the scene background, then bring in the midground, decorative objects, and foreground with staggered movement.
5. Add subtle camera scale/pan and parallax. Avoid making all layers move identically.
6. Transition toward Scene 2 automatically.

Suggested timing: approximately 2–3 seconds after activation, adjustable through scene configuration.

### Scene 2 — Character story

Purpose: make the scene feel alive and convey a short visual journey.

1. Reveal the character(s) using a suitable pose or idle animation.
2. Play the provided walk cycle/sprite sheet when the character moves.
3. Coordinate character movement with camera pan/zoom and foreground parallax.
4. Allow background details and secondary props to animate subtly, if supplied.
5. Transition into the final invitation composition without an abrupt, unrelated cut.

Suggested timing: approximately 4–7 seconds. Use multiple poses/sprite frames for natural locomotion. Do not fake a complete walk cycle by merely translating a single still image unless it is an explicitly labelled placeholder.

### Scene 3 — Wedding invitation finale

Purpose: settle the story into the final invitation.

1. Assemble or reveal the final diorama/composition.
2. Ease the camera into its final framing.
3. Reveal the couple's names, date, venue and primary invitation action.
4. Keep essential wedding information stable and readable after the animation finishes.
5. Enable the normal website interactions (details, gallery, map, RSVP, wishes, etc., according to the existing product scope).
6. Provide a replay control for the intro without duplicating event listeners or leaving stale transforms.

Suggested timing: approximately 2–3 seconds for the final reveal, followed by a stable interactive state.

These durations are initial tuning targets, not hardcoded requirements. Put offsets and durations in configuration.

## 3. Required architecture

Use separated modules with clear responsibilities. Adapt naming to the existing repository if it already has comparable modules.

- `StorybookExperience`: top-level client-side experience and lifecycle.
- `EnvelopeIntro`: envelope interaction and opening sequence.
- `DioramaStage`: viewport, clipping, coordinate system, aspect ratio and responsive layout.
- `SceneRenderer`: renders configured scene layers in their intended order.
- `CharacterController`: selects idle/walk/other pose states and controls sprite playback.
- `CameraController`: camera pan, zoom, bounds and target framing.
- `ParallaxController`: applies depth-based movement based on camera movement or pointer movement when appropriate.
- `SceneTimelineController`: owns the master sequence and scene transition timelines.
- `AssetLoader`: preloads critical assets, reports loading progress and handles failures.
- `SceneConfig` / `AssetManifest`: scene and asset metadata kept separate from JSX.
- `AccessibilityController`: keyboard access, reduced motion and focus handling.

GSAP should be the source of truth for the sequence. Avoid lots of unrelated `setTimeout` calls or competing CSS transitions on the same `transform` property.

## 4. Suggested code layout

Adapt this structure to the repository; do not create a new project if an existing application is provided.

```text
src/
  features/storybook/
    components/
      StorybookExperience.tsx
      EnvelopeIntro.tsx
      DioramaStage.tsx
      SceneLayer.tsx
      CharacterSprite.tsx
      SceneControls.tsx
    engine/
      createMasterTimeline.ts
      createSceneTimeline.ts
      cameraController.ts
      parallaxController.ts
      assetLoader.ts
      spriteSheet.ts
      sceneTypes.ts
    scenes/
      scene-01.config.ts
      scene-02.config.ts
      scene-03.config.ts
      scene-manifest.ts
    styles/
      storybook.css
public/assets/storybook/
  shared/
  characters/
  scenes/
    scene-01/
      desktop/
      mobile/
    scene-02/
      desktop/
      mobile/
    scene-03/
      desktop/
      mobile/
  audio/
  manifest/
```

## 5. Scene state machine

Implement explicit states:

- `loading`
- `ready`
- `opening`
- `assembling`
- `story`
- `transitioning`
- `complete`
- `error`

Rules:

- The envelope cannot trigger the sequence twice while playback is active.
- The `complete` state preserves the final scene and its interactive content.
- Replay must restore the initial state before running again.
- A failed critical asset produces a useful fallback/error state, not a broken page.
- If the user navigates away, all GSAP timelines, observers, listeners and animation loops must be cleaned up.
- Use `gsap.context()` for React-scoped animation and revert it during cleanup.
- Do not rely on DOM selectors that can accidentally match layers in other instances of the component. Prefer refs or scoped selectors.

## 6. GSAP timeline blueprint

Use a paused master timeline assembled from child timelines. Add labels for debugging and predictable timing.

Suggested sequence after envelope activation:

| Timeline label | Approx. offset | Action |
|---|---:|---|
| `envelopeOpen` | 0.0s | Flap opens, seal changes/fades, envelope moves out of the way |
| `scene1Back` | 0.35s | Background and back ornaments fade/slide into place |
| `scene1Mid` | 0.65s | Midground objects enter with staggered timing |
| `scene1Front` | 1.0s | Foreground layers settle; parallax/depth becomes visible |
| `scene2Transition` | 2.3s | Foreground occlusion, camera push, or scene-specific wipe |
| `characterEnter` | 2.7s | Character appears in a suitable idle pose |
| `characterWalk` | 3.2s | Play walk sprite/pose sequence and move character along a configured path |
| `cameraJourney` | 3.0s | Camera pans/zooms while layers respond according to depth |
| `scene3Transition` | 6.8s | Use foreground wipe or continuous camera travel to reveal finale |
| `finaleSettle` | 7.4s | Compose final diorama, ease camera into final target |
| `inviteReveal` | 8.0s | Reveal names and invitation details |
| `complete` | ~9–11s | Stop cinematic playback and enable regular page interactions |

These are starting values. Tune them after the actual art assets are supplied. Use relative positions, labels, stagger and timeline nesting rather than hardcoding every item to one global time.

Animation design rules:

- Use different easing for heavy architecture, light decoration and characters.
- Do not apply a spring/bounce to every layer. It makes paper-cut objects look like stickers.
- Avoid animating every object from the center of the screen.
- Keep character movement and camera direction coherent.
- Use `transform` and `opacity` wherever possible.
- Respect reduced-motion settings by using a short fade or direct reveal.

## 7. Scene/layer schema

Build a typed config rather than hardcoding the scene in JSX. The schema should cover:

- scene ID, aspect ratio and background color;
- desktop and mobile layouts;
- layer ID, asset path, semantic role, depth, z-index, anchor, normalized coordinates, size and visibility;
- initial and final transforms;
- animation duration, delay, easing and timeline label;
- optional mask/occlusion role;
- optional responsive overrides;
- characters and sprite-sheet metadata;
- camera start/end targets and movement duration;
- transition type and timeline offset;
- audio cues, if enabled.

Use normalized coordinates or a documented virtual stage size so the same engine can calculate placement reliably. Distinguish layout position from the transient GSAP transform. Avoid using CSS `left/top` animations for continuous motion when transforms are suitable.

## 8. Character and sprite-sheet specification

Preferred delivery formats, in order of ease of integration:

1. Individual transparent PNG/WebP frames with consistent frame dimensions.
2. A sprite sheet plus explicit metadata.
3. Separate authored poses where a continuous cycle is not required.

Do not assume every sprite sheet has the same number of columns or rows. Read those values from metadata.

For a walk cycle, request approximately 6–8 distinct frames per character as a practical starting point. An idle loop is optional but useful. Exact frame count should match the supplied art and desired visual style.

For each character animation, record:

- character ID and state (`idle`, `walk`, optionally `run`, `turn`, or `wave`);
- file path;
- frame width and height;
- number of frames, columns and rows;
- playback FPS;
- loop behavior;
- facing direction;
- anchor/foot point;
- whether frame dimensions include transparent padding.

Keep frame sizes and anchor points consistent so the character does not jump or change apparent scale between frames. If left/right versions are available, prefer them over automatically mirroring art that contains asymmetric details. The engine must support different frame sizes, but normalized frame dimensions are preferred.

## 9. Asset inventory required from the product owner

The agent must produce an asset checklist/manifest showing `available`, `missing`, `optional`, and `placeholder`. Do not block building the engine merely because final art is not ready; use clearly labelled placeholders.

### Shared intro assets

- Closed envelope.
- Open envelope or separate envelope body/flap/seal parts.
- Optional paper texture, seal detail, petals or small transition props.
- Optional opening sound/music.

### Scene 1 assets: envelope and scene assembly

- Desktop background.
- Mobile background or mobile-specific composition.
- Back ornament layers.
- Midground layers.
- Foreground-left and foreground-right layers, or separate objects if independently animated.
- Independent props that fly/slide into position.
- Final static reference of the assembled scene.

### Scene 2 assets: character story

- Background and any required left/right extensions for camera travel.
- Midground landscape/architecture.
- Foreground occluders such as branches, flowers, grass or architecture.
- Character idle pose.
- Character walk frames or sprite sheet.
- Optional alternate facing direction/poses for turn or entrance.
- Secondary props and atmospheric elements, if used.
- Mobile scene composition or alternate framing assets.

### Scene 3 assets: invitation finale

- Final background and primary decorative structure.
- Independent foreground/midground layers needed for assembly or camera settle.
- Couple/character final pose, if characters remain visible.
- Decorative/text-safe areas for names and wedding details.
- Desktop and mobile composition references.

### Optional finishing assets

- Transparent particles, petals, glow, fog or stars.
- Shadows when not realistically conveyed by the base art.
- Transition masks or large foreground elements for visual wipes.
- Background music, paper/envelope sound, footsteps and ambient effects.

### Composition references

For each scene, request:

- one reference of the intended final composition;
- one rough sketch/reference for start positions if objects assemble from outside the scene;
- expected camera start/end frame;
- a marked list of foreground, midground and background components;
- mobile reference composition.

## 10. Recommended asset naming convention

Use predictable names; do not use ambiguous names like `final2.png`.

```text
scene-01-desktop-background.webp
scene-01-mobile-background.webp
scene-01-cloud-left.webp
scene-01-lantern-right.webp
scene-01-foreground-left.webp
scene-01-final-reference.jpg
scene-02-desktop-background.webp
scene-02-mobile-background.webp
scene-02-foreground-branch.webp
couple-idle.png
couple-walk.png
couple-walk.json
scene-03-desktop-background.webp
scene-03-mobile-background.webp
scene-03-final-reference.jpg
envelope-closed.webp
envelope-body.webp
envelope-flap.webp
envelope-seal.webp
```

If a file contains multiple independently moving objects, split it only when the animation needs independent movement. Combining purely static decorations into one image is encouraged to reduce layer count.

## 11. Dimensions and export guidelines

These are practical targets, not hard rules. Use the composition's actual aspect ratio and display dimensions.

- Desktop scene reference: 1920×1080 (16:9) when the experience is cinematic widescreen.
- Mobile scene reference: 1080×1920 (9:16), with a separately composed focal point.
- Transparent object exports: canvas large enough to preserve motion/rotation without clipping; avoid excessive transparent padding.
- Raster quality: maintain sufficient resolution for the largest expected display size; optimize runtime exports separately from source masters.
- Backgrounds used during camera movement must have enough extra canvas or dedicated extensions to cover the camera bounds.
- Transparent assets: PNG or WebP with alpha.
- Backgrounds: WebP/AVIF/JPEG depending on image quality and browser support.
- Simple crisp decorative line art: SVG where it renders consistently.
- Audio: MP3 or OGG.

Do not crop each layer independently without a documented anchor/placement reference. Keep origin and visual alignment stable.

## 12. Desktop and mobile strategy

Treat desktop and mobile as two compositions using the same renderer and timeline engine.

Desktop config may use a widescreen virtual stage, wider camera travel and additional side props.

Mobile config may use a portrait virtual stage, repositioned layer coordinates, a tighter camera path, fewer side decorations, and a different crop/composition. Never just shrink desktop coordinates and assume the result works.

Reuse character sprites unless mobile framing or readability genuinely requires another render. Keep desktop/mobile asset paths in configuration; do not scatter viewport-specific asset decisions through components.

Test at minimum:
- a desktop viewport around 1440×900;
- a mobile viewport around 390×844;
- a narrow mobile viewport around 360×740;
- orientation/resize changes.

## 13. Performance, loading and accessibility

- Preload the envelope and scene-1 critical assets before enabling the trigger.
- Show loading status and disable the trigger until required assets are ready.
- Load later-scene assets progressively, with a transition fallback if an asset is delayed.
- Avoid decoding every large image at once if it creates memory pressure.
- Animate mainly `transform` and `opacity`; profile layer count and texture dimensions.
- Apply `will-change` selectively.
- Ensure there are no missing images, visible background gaps, or unexpected stretching.
- Support `prefers-reduced-motion` with short transitions or immediate reveal.
- Envelope must be keyboard-operable and have a meaningful accessible label.
- Audio must not unexpectedly autoplay before a user gesture.
- Essential invitation content must remain readable when motion is reduced.

## 14. Development workflow

1. Inspect the repository and identify the existing framework, routes, design system, and dependencies.
2. Report the existing project structure and proposed integration points before changing architecture.
3. Create the asset manifest and identify supplied, missing, optional and placeholder assets.
4. Build all three scenes as static compositions first; validate layer order and desktop/mobile framing.
5. Implement envelope interaction and the master GSAP sequence.
6. Implement sprite animation, camera motion, parallax and scene transitions.
7. Implement replay, resize handling, reduced motion, loading and error recovery.
8. Test the full experience on desktop and mobile.
9. Document how to add another scene or replace an asset without changing engine code.

## 15. Acceptance criteria

- Clicking/tapping the envelope starts the sequence exactly once.
- The experience automatically plays through three scenes and reaches a stable invitation finale.
- All three scenes have configurable desktop and mobile layouts.
- Background, midground, foreground and characters move at intentionally different rates.
- A supplied sprite sheet/pose sequence plays at its configured FPS and maintains a stable anchor.
- Camera motion does not reveal empty canvas edges.
- Scene transitions are coordinated by GSAP and do not rely on unmanaged timeout chains.
- Replay restores the same initial state deterministically.
- Missing assets are reported in the manifest and do not crash the page.
- Reduced-motion and keyboard interaction work.
- The README describes asset naming, sprite metadata, scene configuration and adding a new scene.
- Any placeholder art is clearly identified and can be replaced without editing the engine.

## 16. First response required from the agent

Before broad implementation, report:
1. Existing application framework and files that will be changed.
2. Proposed scene/layer structure.
3. Full expected asset manifest with status for each asset.
4. Any assumptions that affect visual quality or asset preparation.
5. A phased implementation plan.

Then implement the first usable prototype with placeholder assets if final artwork is not yet supplied. Do not invent final production assets or silently omit mobile composition.
