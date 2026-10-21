import { guestEvents, sectionIds, type WeddingContent } from '../../../content/wedding';
import { SectionHeading } from '../components/SectionHeading';
import { guestSearch } from '../lib/guests';
import { googleCalendarUrl, mapsUrl } from '../lib/links';

/** Line icons for the event buttons (24×24, stroke = currentColor). */
const ICONS = {
  map: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  calendar: 'M4 6.5h16v13.5H4zM4 10.5h16M8.5 3.5v5M15.5 3.5v5M12 13v5M9.5 15.5h5',
} as const;

function ButtonIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg className="ld-btn__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d={ICONS[name]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EventsSection({ content }: { content: WeddingContent }) {
  const couple = `${content.groom.shortName} & ${content.bride.shortName}`;
  // `?place=` invites the guest to one party only: show just that one, larger.
  const events = guestEvents(content, guestSearch());
  const single = events.length === 1;
  return (
    <section id={sectionIds.events} className="ld-section ld-section--tint" aria-labelledby="ld-events-title">
      <SectionHeading id="ld-events-title" eyebrow="Trân trọng kính mời" title="Thời gian & Địa điểm" />
      <div className={single ? 'ld-events ld-events--single' : 'ld-events'}>
        {events.map((event) => (
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
                <ButtonIcon name="map" />
                Chỉ đường
              </a>
              <a
                className="ld-btn ld-btn--ghost"
                href={googleCalendarUrl(event, `${event.title} · ${couple}`)}
                target="_blank"
                rel="noreferrer"
              >
                <ButtonIcon name="calendar" />
                Thêm vào lịch
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
