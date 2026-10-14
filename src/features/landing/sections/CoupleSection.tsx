import { sectionIds, type Person, type WeddingContent } from '../../../content/wedding';
import { Photo } from '../components/Photo';
import { SectionHeading } from '../components/SectionHeading';

function PersonCard({ person }: { person: Person }) {
  return (
    <article className="ld-person" data-reveal-on-scroll>
      <Photo className="ld-person__photo" src={person.photo} alt={`Ảnh ${person.role.toLowerCase()} ${person.name}`} />
      <p className="ld-eyebrow">{person.role}</p>
      <h3 className="ld-person__name">{person.name}</h3>
      <p className="ld-person__family">
        <span className="ld-eyebrow">{person.family}</span>
        <span>Ông Bà</span>
        <span className="ld-person__parents">{person.father}</span>
        <span className="ld-person__parents">{person.mother}</span>
        <span className="ld-muted">{person.home}</span>
      </p>
    </article>
  );
}

export function CoupleSection({ content }: { content: WeddingContent }) {
  return (
    <section id={sectionIds.couple} className="ld-section" aria-labelledby="ld-couple-title">
      <SectionHeading id="ld-couple-title" eyebrow="Hai nhà trân trọng báo tin" title="Chú rể & Cô dâu" />
      <div className="ld-couple">
        <PersonCard person={content.groom} />
        <span className="ld-couple__heart" aria-hidden="true">
          ♥
        </span>
        <PersonCard person={content.bride} />
      </div>
    </section>
  );
}
