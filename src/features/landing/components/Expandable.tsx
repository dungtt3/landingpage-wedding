import { useEffect, useId, useState, type ReactNode } from 'react';

interface Props {
  /** Section id: arriving on `#<id>` (e.g. "Xác nhận tham dự" on the card) opens it straight away. */
  sectionId: string;
  icon: string;
  label: string;
  hint?: string;
  children: ReactNode;
}

/**
 * A closed panel with one button; the content only unfolds (fully) when the
 * guest asks for it. While closed the content is `inert`: not focusable, not read.
 */
export function Expandable({ sectionId, icon, label, hint, children }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    const check = () => {
      if (window.location.hash === `#${sectionId}`) setOpen(true);
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, [sectionId]);

  return (
    // State lives in data-open, not className: the scroll-reveal hook adds its own class to this element.
    <div className="ld-expand" data-open={open} data-reveal-on-scroll>
      <button type="button" className="ld-expand__trigger" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        <span className="ld-expand__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="ld-expand__text">
          <strong>{open ? 'Thu gọn' : label}</strong>
          {!open && hint && <small>{hint}</small>}
        </span>
        <span className="ld-expand__chevron" aria-hidden="true" />
      </button>
      <div id={panelId} className="ld-expand__panel" inert={!open}>
        <div className="ld-expand__inner">{children}</div>
      </div>
    </div>
  );
}
