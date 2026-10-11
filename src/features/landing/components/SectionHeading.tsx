export function SectionHeading({ id, eyebrow, title }: { id: string; eyebrow?: string; title: string }) {
  return (
    <div className="ld-heading" data-reveal-on-scroll>
      {eyebrow && <p className="ld-eyebrow">{eyebrow}</p>}
      <h2 id={id}>{title}</h2>
      <span className="ld-heading__rule" aria-hidden="true" />
    </div>
  );
}
