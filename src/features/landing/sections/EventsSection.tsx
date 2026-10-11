import { sectionIds, type WeddingContent } from '../../../content/wedding';
import { SectionHeading } from '../components/SectionHeading';
import { googleCalendarUrl, mapsUrl } from '../lib/links';

export function EventsSection({ content }: { content: WeddingContent }) {
  const couple = `${content.groom.shortName} & ${content.bride.shortName}`;
  return (
    <section id={sectionIds.events} className="ld-section ld-section--tint" aria-labelledby="ld-events-title">
      <SectionHeading id="ld-events-title" eyebrow="Trân trọng kính mời" title="Thời gian & Địa điểm" />
      <div className="ld-events">
        {content.events.map((event) => (
          <article key={event.id} className="ld-event" data-reveal-on-scroll aria-labelledby={`ld-event-${event.id}`}>
            <h3 id={`ld-event-${event.id}`}>{event.title}</h3>
            <p className="ld-event__time">
              <time dateTime={event.start}>{event.timeLabel}</time>
            </p>
            <p className="ld-event__date">{event.dateLabel}</p>
            {event.lunarDate && <p className="ld-muted">({event.lunarDate})</p>}
            <p className="ld-event__venue">
              <strong>{event.venueName}</strong>
              <span>{event.address}</span>
            </p>
            {event.note && <p className="ld-event__note">{event.note}</p>}
            <div className="ld-actions">
              <a className="ld-btn ld-btn--primary" href={mapsUrl(event.map)} target="_blank" rel="noreferrer">
                Chỉ đường
              </a>
              <a
                className="ld-btn ld-btn--ghost"
                href={googleCalendarUrl(event, `${event.title} · ${couple}`)}
                target="_blank"
                rel="noreferrer"
              >
                Thêm vào lịch
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
