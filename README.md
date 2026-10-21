# Thiệp cưới — 2.5D storybook intro + landing page

React + TypeScript + GSAP online wedding invitation, in two parts:

1. **Opening card (`CardIntro.tsx` in `src/features/storybook/components/`)** —
   a full-screen layer over the landing page. The guest taps a red gatefold
   card (click, tap, Enter or Space; Escape skips): the 囍 medallion lifts off,
   both panels swing open on 3D hinges to reveal the greeting inside, the card
   rushes past the camera and the backdrop fades straight onto the landing
   page, then the layer removes itself. Scroll is locked until then. Only the
   card's own assets are loaded. If they fail, the page shows directly.
2. **Landing page (`src/features/landing/`)** — hero + countdown, couple,
   events (maps / add-to-calendar), love story, gallery with lightbox, RSVP,
   gift accounts, footer, with a sticky nav. Arriving on a section link
   (e.g. `#rsvp`) scrolls there once the card is gone.

> The 2.5D storybook (diorama scenes, walking couple, finale card;
> `StorybookExperience.tsx` and the scene engine) is no longer used by `App.tsx`.
> The code is kept: render `<StorybookExperience>` in `App.tsx` again to bring it back.

**Short guest links (recommended):** open `/admin`, type the guest's name and
pick the party, and it makes `/g/<code>` (6 letters). The code is looked up
in Supabase (`guests` table, migration `20261022000000_guest_links.sql`)
before the page renders and works exactly like `?place=&name=` below; an
unknown code shows the generic card. The table is closed to the public key:
the site only calls `create_guest()` and `guest_by_code()`, so nobody can list
the guests. `/admin` itself has no password (a link it makes can say no more
than a hand-written `?name=` link could); it is just not linked anywhere.

**Guest links:** add `?place=1` (nhà gái, 01.11.2026 16:00) or `?place=2`
(nhà trai, 03.11.2026 11:00) to the invitation link. It selects the party
the countdown, hero date, finale card and opening card point at, and
pre-selects the RSVP side. No or an unknown value falls back to
`mainEventId`. The numbers are the `place` field of each event. The RSVP is recorded as a guest of that side
(no `place` → "both"); the form itself only asks for the name and yes/no.
Add `&name=Anh%20Nam` (any letter case, e.g. `Name=`) to greet the guest by
name inside the opening card ("Kính gửi Anh Nam") and pre-fill the RSVP name.
Links survive chat apps: params are read leniently, so Zalo's appended
`?zarsrc=…`, `&amp;` in place of `&`, double percent-encoding and Messenger's
`fbclid` do not break them. Always send the name percent-encoded (`%20`, not
a raw space): a raw space ends the link when Zalo/Messenger auto-link it.

**All copy for both parts lives in `src/content/wedding.ts`.** `App.tsx`
derives the text inside the opening card from it. Landing photos go in `public/assets/landing/`
at the paths listed in that file; a missing photo shows a labelled
`PLACEHOLDER` box with its expected path. Photos are WebP; next to each
`name.webp` (1280 px wide) put `name-960.webp` and `name-480.webp` and
`<Photo>` serves the smallest one that fits the screen (`srcset`).

**Backend: Supabase.** RSVPs and the guestbook (`#loi-chuc`, 10 ready-made
wishes in `wishes.templates` of `src/content/wedding.ts`) are stored in Supabase
through its REST API (`src/features/landing/lib/supabase.ts`, no SDK):

1. Create a Supabase project, open SQL Editor and run `supabase/schema.sql`
   (tables `rsvps` and `wishes` with Row Level Security).
2. Copy `.env.example` to `.env.local` and fill in the project URL and the
   anon / publishable key (Project Settings → API). On Vercel, add the same two
   variables under Project → Settings → Environment Variables and redeploy.
3. Guests can only add RSVPs, never read them: read them in the Table Editor.
   Wishes are public; hide one by setting `hidden = true`.

Without these variables the site still works: RSVPs are not sent and wishes
stay in the guest's own browser (the page says so).

**Hosting: Vercel** (`vercel.json`), domain `maidung.online`. Link previews
(Zalo / Facebook) use the meta tags in `index.html` and `public/og-image.jpg`.

> **All artwork is currently a placeholder.** Every generated placeholder is
> stamped `PLACEHOLDER · <asset id>`. Put the real file at the path listed in
> [`ASSETS.md`](ASSETS.md) and it replaces the placeholder automatically. You
> do not need to change any code.

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # config/camera/sprite/state-machine checks
npm run build          # typecheck + production build
npm run assets:check   # regenerate ASSETS.md + public/assets/storybook/manifest/asset-report.json
```

URL flags for testing: `?debug` (asset checklist panel and `window.__storybook.timeline`),
`?motion=reduce|full` (overrides `prefers-reduced-motion`), `?noPlaceholders`
(turns placeholders off to test the error state).

## Architecture

```text
src/features/storybook/
  components/   React: lifecycle and DOM only
    CardIntro.tsx             opening card only (used by App): card assets, open timeline, then onDone
    StorybookExperience.tsx   (unused) full 2.5D storybook: state machine, asset loading, timeline build/rebuild/cleanup
    EnvelopeIntro.tsx         opening gatefold card <button> (panels, seal, inside), loading progress
    DioramaStage.tsx          viewport + virtual stage scaled to "cover"
    SceneRenderer.tsx         renders a scene's layers/characters in z order (+ wipe element)
    SceneLayer.tsx            depth ▸ motion ▸ ambient wrappers around one cutout
    CharacterSprite.tsx       foot-anchored character rig, one element per animation state
    InvitationOverlay.tsx     names/date/venue/actions inside the finale's text-safe area
    SceneControls.tsx         Skip (also Escape) / Replay
    AccessibilityController.tsx  reduced motion, Escape, scroll lock, live region
    AssetReport.tsx           ?debug checklist
  engine/       framework-free logic
    createMasterTimeline.ts   paused master timeline, labels, states, gate, audio, finish/dispose
    createSceneTimeline.ts    layers (enter/exit/ambient), camera moves, transitions
    envelopeTimeline.ts       seal lifts → panels swing open → inside greeting → exit
    characterController.ts    script → state/facing segments, FPS-exact frame stepping
    cameraController.ts       camera/depth maths, camera coverage validator
    parallaxController.ts     projects camera state onto layers each tick, pointer parallax
    spriteSheet.ts            frame index / sheet cell maths
    assetLoader.ts            preload + decode, placeholder fallback, never throws
    placeholderArt.ts         labelled SVG placeholders (incl. multi-frame sprite sheets)
    stateMachine.ts, stageGeometry.ts, sceneAssets.ts, refRegistry.ts, timing.ts, sceneTypes.ts
  scenes/       configuration only (no JSX)
    storybook.config.ts       stages, timeline labels, state labels, envelope, audio, scene list
    scene-01/02/03.config.ts  desktop + mobile layouts per scene
    characters.config.ts      sprite metadata
    scene-manifest.ts         every expected file and its placeholder
```

**GSAP is the only source of motion.** A single paused master timeline is
built inside one `gsap.context()`. Child tweens are placed at label times from
`storybook.config.ts`. Camera state objects are tweened by that same timeline,
and `ParallaxController` projects them onto the layers. The project uses no CSS
transitions on animated properties and no `setTimeout` chains. The deferred-asset
wait uses a `gsap.delayedCall`. Elements are found through an instance-scoped
`RefRegistry`, not document selectors.

**Each layer has three wrappers**, so different kinds of motion never fight
over `transform`:

1. *depth*: layout position (CSS left/top/size), plus the camera/parallax transform.
2. *motion*: the enter and exit tweens.
3. *ambient*: looping sway or drift.

**State machine:** `loading → ready → opening → assembling → story → transitioning → complete`
(and `error`). The envelope is a disabled `<button>` until the critical assets
are decoded. It starts the sequence once per run. Timeline callbacks can only
move the state forward.

**Lifecycle**
- *Resize* or a desktop↔mobile switch rebuilds the timeline for the new layout
  and seeks to the same time. Labels are shared across layouts, so the result is
  deterministic.
- *Replay* reverts the context, which restores the initial inline styles, then
  rebuilds and plays from 0.
- *Unmount* kills the timelines, loops, ticker, pointer listeners and audio.

## Camera and parallax

A camera is a point `C` (in stage px) kept at the centre of the frame, plus a
zoom `Z ≥ 1`. A layer with depth `p` is transformed as follows:

```
s = 1 + (Z − 1)·p
screen = centre + s·(P − centre − (C − centre)·p)
```

- `p = 0` stays fixed to the screen.
- `p = 1` is locked to the camera (characters, path).
- `p > 1` is foreground that moves faster.

`validateCameraCoverage()` samples every camera path, including the
pointer-parallax margin. It fails a test if any `coversCamera` layer would
reveal empty canvas.

## Desktop and mobile

There are two separate compositions:

| | Desktop | Mobile |
|---|---|---|
| Virtual stage | 1920×1080 | 1080×1920 |
| Used when | otherwise | width ≤ 640 or aspect < 0.9 |

Both use the same renderer and timeline. Mobile has its own coordinates, a
tighter camera path, fewer side props and a lower text-safe area. Character
sprites are shared; mobile only uses a larger `scale`. The stage is scaled to
*cover* the viewport, so keep important art inside the central ~85 % of the
width.

## Opening card

The card is cut from one photo, `art-source/gatefold-card.jpg`, by
`scripts/split-gatefold-card.py` (Pillow) into `gate-left.webp`,
`gate-right.webp` and `gate-seal.webp` in `public/assets/storybook/shared/`.
The panel areas under the medallion are re-filled with the card's own paper
texture. The 囍 medallion is kept as photographed. The Chinese lettering on the right
panel (喜结良缘) is removed by the script and replaced in HTML by
`envelope.text.panel` (written top to bottom, one word per line), positioned by
`parts.panelLabel` and set in Pacifico. `envelope.text.inside` is the glyph
shown inside the open card. The script prints the part rects; they go in
`storybook.config.ts → envelope.parts` (plus `aspect`). To use another card,
export the three parts yourself with the same roles (or adapt the measurements
in the script) and update those numbers. The inside greeting is HTML, styled in
`storybook.css` (`.sb-gate__inside`), with text taken from the finale card
content. The backdrop is the tiled pattern `envelope-backdrop.webp`
(`envelope.backdrop`: colour, tile size, opacity).

Behind the card sits a floral paper-cut medallion (`MedallionBackdrop`), cut
from `art-source/medallion.jpg` by `scripts/split-medallion.py` into
`medallion-*.webp`:

- a still layer (`medallion-deco`): ivory centre, leaves, phoenixes;
- the lattice ring (`medallion-ring`). It is rebuilt from one clean
  half-motif mirrored round the circle, so it can turn in place without a
  seam. One turn takes `envelope.medallion.ring.turnSeconds`.
- 8 flowers and 4 leaf sprigs as separate sprites. Each sways on its own
  pivot and rhythm using CSS keyframes `sb-sway` / `sb-spin`.

Any tap on the intro fires a burst of paper petals from that point
(`engine/petalConfetti.ts`, a canvas that runs only while petals are in the
air). Tapping a flower also makes it pop. Under reduced motion, nothing turns,
sways or bursts. The layers are optional: without the files the medallion is
simply not drawn.

Current sources (re-rendered at higher resolution) are
`art-source/medallion.jpg` (2048²), `art-source/gatefold-card.jpg`
(1792×2400) and `art-source/envelope-backdrop.jpg`; the first versions are
kept as `*-v1*.jpg`. Both split scripts hold measurements of their photo
(card outline, seam, 囍 circle, tassel; ring centre/radii, sprite circles),
so a new render needs those re-measured before re-running.

## Asset naming and export

The full checklist is in [`ASSETS.md`](ASSETS.md) (status `available` /
`placeholder` / `optional` / `missing`).

- Names follow `scene-0N-[desktop|mobile]-<part>.webp` for layout-specific art
  and `scene-0N-<part>.webp` for art shared by both layouts. Examples:
  `couple-walk.png`, `envelope-flap.webp`.
- Folders: `public/assets/storybook/{shared,characters,audio,scenes/scene-0N/{desktop,mobile}}`.
- Export at the size listed in the manifest. Only the aspect ratio has to
  match; layer *width* comes from the scene config. Backgrounds include extra
  bleed for camera travel.
- Transparent layers should be PNG or WebP with alpha. Use WebP, AVIF or JPEG
  for backgrounds, and MP3 or OGG for audio.
- Never crop a layer independently of its documented anchor. If you change a
  file's aspect ratio, update `width`/`height` in `scene-manifest.ts`.

## Sprite metadata

Sprite metadata lives in `scenes/characters.config.ts`. Copy the values from
the exporter:

```ts
walk: {
  kind: 'sheet', state: 'walk', asset: 'couple-walk',
  frameWidth: 360, frameHeight: 480,    // one frame, source px
  frameCount: 8, columns: 4, rows: 2,   // grid is read from here, never assumed
  fps: 10, loop: true,
  facing: 'right',                      // direction as drawn
  anchor: { x: 180, y: 460 },           // foot point inside a frame — keep it identical in every frame
  paddedFrames: true, mirrorable: true, // mirror only if the art is symmetric enough
}
```

- To use individual frame files, set `kind: 'frames'` with `frames: [assetId…]`.
- Authored opposite-facing art goes under `mirrored`. The engine prefers it
  over flipping.
- Different states may use different frame sizes. The anchor keeps the feet in
  place when the state changes.
- Recommended: 6–8 walk frames and an optional idle loop.
- Match walk speed to stride length. Distance per cycle is
  `frameCount / fps × walk speed`; tune `duration` in the scene's `walk` action
  so the feet don't slide.

## Scene configuration

Each scene (`scene-0N.config.ts`) has an `id`, a `background`, a
`transitionIn` (`cut | crossfade | wipe | iris`), an optional `endsAt` label,
and `layouts.desktop` / `layouts.mobile`. Each layout contains the following:

- `layers[]`: `asset`, `role`, `depth`, `z`, `x`/`y` (anchor position in stage
  px), `width`, `anchor`, `coversCamera`, plus optional `enter`/`exit`
  (`{ at: label, offset, duration, ease, from, to }`) and `ambient`
  (`{ property, amplitude, period }`).
- `characters[]`: position, `scale`, `depth`, and a `script` of
  `appear | play | walk | face | hide` actions at label times.
- `camera`: `start` and `moves[]` (`{ at, offset, duration, target: {x, y, zoom} }`),
  plus `pointerParallax` on the finale.
- `textSafeArea` (finale): a normalised rect where the invitation card is placed.

Timing is tuned in `storybook.config.ts → timeline.labels`. The current values
are 0 → 12.1 s: the brief's blueprint, shifted by 1.7 s after `envelopeOpen`
to give the gatefold card time to open.

## Adding a scene or replacing art

1. **Replace art:** put the file at its manifest path, then run
   `npm run assets:check`. Nothing else is needed.
2. **New asset:** add an `entry(...)` to `scene-manifest.ts` with a
   `placeholder` spec.
3. **New scene:**
   1. Create `scene-04.config.ts` with desktop and mobile layouts.
   2. Add it to `storybookConfig.scenes`.
   3. If it needs new timing points, add labels to `TimelineLabel` and
      `timeline.labels`.
   4. Run `npm test`. It checks that both layouts exist, that every asset is in
      the manifest, and that the camera coverage is valid.

## Assumptions and open items

- No story, artwork or photos have been supplied yet. The current story
  (envelope → blossom garden → the couple walks to a house → floral arch) and
  all text in `src/content/wedding.ts` are placeholders.
- Audio support is wired up but disabled (`audio.enabled = false`) until the
  files exist. Audio only plays after the envelope gesture.
- The RSVP form only works in the browser for now (it has no backend).
  A public guest-wishes wall is not built yet.
- Final art may need changes to timing, ease, depth and stride.
- Validate desktop and mobile composition against the reference images once
  they are supplied.
