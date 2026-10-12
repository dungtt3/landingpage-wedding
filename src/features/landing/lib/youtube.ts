/** The slice of the YouTube IFrame Player API this site uses. */
interface YTNamespace {
  Player: new (
    iframe: HTMLIFrameElement,
    options: { events: { onStateChange?: (e: { data: number }) => void } },
  ) => unknown;
  PlayerState: { PLAYING: number; BUFFERING: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let api: Promise<YTNamespace> | null = null;

/** Loads https://www.youtube.com/iframe_api once and resolves with `window.YT`. */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (api) return api;
  api = new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      api = null;
      reject(new Error('YouTube API failed to load'));
    };
    document.head.appendChild(script);
  });
  return api;
}
