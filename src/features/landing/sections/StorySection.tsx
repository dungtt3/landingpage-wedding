import { useEffect, useRef } from 'react';
import { sectionIds, type WeddingContent } from '../../../content/wedding';
import { SectionHeading } from '../components/SectionHeading';
import { youtubeId } from '../lib/links';
import type { BackgroundMusic } from '../lib/music';
import { loadYouTubeApi } from '../lib/youtube';

/** The love story, told by the couple's YouTube video. Renders nothing until a link is set in the content. */
export function StorySection({ content, music }: { content: WeddingContent; music?: BackgroundMusic }) {
  const id = youtubeId(content.video.youtube);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // The background song pauses while the video plays and comes back when it stops.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !music) return;
    let cancelled = false;
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        new YT.Player(iframe, {
          events: {
            onStateChange: ({ data }) => {
              if (cancelled) return;
              if (data === YT.PlayerState.PLAYING || data === YT.PlayerState.BUFFERING) music.holdForVideo();
              else music.releaseFromVideo();
            },
          },
        });
      })
      .catch(() => {});
    // No player.destroy(): it would remove the iframe React owns.
    return () => {
      cancelled = true;
    };
  }, [id, music]);

  if (!id) return null;
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    // A hint only: YouTube still picks the quality from the player size and the guest's connection.
    vq: 'hd1080',
    enablejsapi: '1',
    origin: window.location.origin,
  });
  return (
    <section id={sectionIds.story} className="ld-section" aria-labelledby="ld-story-title">
      <SectionHeading id="ld-story-title" eyebrow="Hành trình của chúng mình" title="Chuyện tình yêu" />
      <div className="ld-video" data-reveal-on-scroll>
        {/* youtube-nocookie: no tracking cookies until the guest presses play. */}
        <iframe
          ref={iframeRef}
          src={`https://www.youtube-nocookie.com/embed/${id}?${params}`}
          title={content.video.title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </section>
  );
}
