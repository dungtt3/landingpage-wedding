import { type WeddingContent } from '../../../content/wedding';
import { youtubeId } from '../lib/links';

/** The couple's YouTube video, right under the love story. Renders nothing until a link is set in the content. */
export function VideoSection({ content }: { content: WeddingContent }) {
  const id = youtubeId(content.video.youtube);
  if (!id) return null;
  return (
    <section className="ld-section ld-video-section" aria-label={content.video.title}>
      <div className="ld-video" data-reveal-on-scroll>
        {/* youtube-nocookie: no tracking cookies until the guest presses play. */}
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`}
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
