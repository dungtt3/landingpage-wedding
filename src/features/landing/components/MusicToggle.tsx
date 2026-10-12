import { useSyncExternalStore } from 'react';
import type { BackgroundMusic } from '../lib/music';

/** Round button fixed to the bottom-right corner that turns the background song on and off. */
export function MusicToggle({ music, title }: { music: BackgroundMusic; title: string }) {
  const playing = useSyncExternalStore(music.subscribe, () => music.playing);
  return (
    <button
      type="button"
      className="ld-music"
      data-playing={playing}
      aria-pressed={playing}
      aria-label={playing ? `Tắt nhạc: ${title}` : `Bật nhạc: ${title}`}
      title={playing ? 'Tắt nhạc' : 'Bật nhạc'}
      onClick={() => music.toggle()}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M9 18V5l11-2v13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="18" r="3" fill="currentColor" />
        <circle cx="17" cy="16" r="3" fill="currentColor" />
        {!playing && <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
      </svg>
    </button>
  );
}
