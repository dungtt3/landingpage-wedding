/**
 * The page's background song: one looping <audio>, shared by the card intro
 * (which starts it), the video (which pauses it) and the corner toggle.
 */
export class BackgroundMusic {
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<() => void>();
  /** The guest switched the music off: only the toggle may start it again. */
  private mutedByGuest = false;
  /** Paused because the video is playing: resumes when the video stops. */
  private heldByVideo = false;

  constructor(private src: string) {}

  get playing() {
    return !!this.audio && !this.audio.paused;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Call from a tap/click where possible: browsers block sound that starts without one. */
  start() {
    if (!this.mutedByGuest && !this.heldByVideo) this.play();
  }

  toggle() {
    if (this.playing) {
      this.mutedByGuest = true;
      this.audio?.pause();
    } else {
      this.mutedByGuest = false;
      this.heldByVideo = false;
      this.play();
    }
  }

  holdForVideo() {
    if (!this.playing) return;
    this.heldByVideo = true;
    this.audio?.pause();
  }

  releaseFromVideo() {
    if (!this.heldByVideo) return;
    this.heldByVideo = false;
    if (!this.mutedByGuest) this.play();
  }

  /** The card was closed: silence until it is opened again. */
  stop() {
    this.heldByVideo = false;
    this.audio?.pause();
  }

  private play() {
    if (!this.src) return;
    if (!this.audio) {
      this.audio = new Audio(this.src);
      this.audio.loop = true;
      this.audio.volume = 0.6;
      const emit = () => this.listeners.forEach((l) => l());
      this.audio.addEventListener('play', emit);
      this.audio.addEventListener('pause', emit);
    }
    // Rejected when the browser wants a tap first; the toggle then shows "off".
    this.audio.play().catch(() => {});
  }
}
