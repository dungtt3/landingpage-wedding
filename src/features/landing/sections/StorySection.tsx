import { sectionIds, type WeddingContent } from '../../../content/wedding';
import { Photo } from '../components/Photo';
import { SectionHeading } from '../components/SectionHeading';

export function StorySection({ content }: { content: WeddingContent }) {
  return (
    <section id={sectionIds.story} className="ld-section" aria-labelledby="ld-story-title">
      <SectionHeading id="ld-story-title" eyebrow="Hành trình của chúng mình" title="Chuyện tình yêu" />
      <ol className="ld-story">
        {content.story.map((m) => (
          <li key={m.title} className="ld-story__item" data-reveal-on-scroll>
            <span className="ld-story__dot" aria-hidden="true" />
            {m.photo && <Photo className="ld-story__photo" src={m.photo} alt={m.title} />}
            <div className="ld-story__text">
              {m.date && <p className="ld-story__date">{m.date}</p>}
              <h3>{m.title}</h3>
              <p>{m.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
