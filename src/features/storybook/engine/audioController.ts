/**
 * Minimal cue player. Audio is only ever started from the timeline after the
 * user has activated the envelope (a user gesture), never on page load.
 */
export class AudioController {
  private elements = new Map<string, HTMLAudioElement>();
  private muted = false;

  constructor(private resolveSrc: (assetId: string) => string | null) {}

  play(assetId: string, volume = 1) {
    if (this.muted) return;
    const src = this.resolveSrc(assetId);
    if (!src) return;
    let el = this.elements.get(assetId);
    if (!el) {
      el = new Audio(src);
      this.elements.set(assetId, el);
    }
    el.volume = volume;
    el.currentTime = 0;
    void el.play().catch(() => undefined);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.stopAll();
  }

  stopAll() {
    this.elements.forEach((el) => {
      el.pause();
      el.currentTime = 0;
    });
  }

  dispose() {
    this.stopAll();
    this.elements.clear();
  }
}
