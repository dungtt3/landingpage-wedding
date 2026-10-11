import { mainEvent, sectionIds, type WeddingContent } from '../../../content/wedding';
import { Countdown } from '../components/Countdown';
import { Photo } from '../components/Photo';

export function HeroSection({ content }: { content: WeddingContent }) {
  const event = mainEvent(content);
  return (
    <header id={sectionIds.landing} className="ld-hero" aria-labelledby="ld-hero-title">
      <div className="ld-hero__media">
        <Photo src={content.hero.photo} alt={`Ảnh cưới của ${content.groom.shortName} và ${content.bride.shortName}`} priority />
      </div>
      <div className="ld-hero__text">
        <p className="ld-eyebrow">{content.hero.eyebrow}</p>
        <h2 id="ld-hero-title" className="ld-hero__names">
          <span>{content.groom.shortName}</span>
          <span className="ld-amp" aria-label="và">
            &amp;
          </span>
          <span>{content.bride.shortName}</span>
        </h2>
        <p className="ld-hero__date">
          <time dateTime={event.start}>
            {event.timeLabel} · {event.dateLabel}
          </time>
          {event.lunarDate && <span>{event.lunarDate}</span>}
        </p>
        <Countdown target={event.start} />
        <blockquote className="ld-hero__quote">
          <p>“{content.hero.quote}”</p>
          {content.hero.quoteSource && <cite>— {content.hero.quoteSource}</cite>}
        </blockquote>
        <div className="ld-actions">
          <a className="ld-btn ld-btn--primary" href={`#${sectionIds.rsvp}`}>
            Xác nhận tham dự
          </a>
          <a className="ld-btn ld-btn--ghost" href={`#${sectionIds.events}`}>
            Thời gian & địa điểm
          </a>
        </div>
      </div>
    </header>
  );
}
