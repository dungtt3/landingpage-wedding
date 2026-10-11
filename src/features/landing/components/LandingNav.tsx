import { useEffect, useState } from 'react';
import { NavIcon, type NavIconName } from './NavIcon';

export interface NavItem {
  id: string;
  label: string;
  icon: NavIconName;
}

/**
 * Sticky section nav at the top of the landing page.
 */
export function LandingNav({ items, brand }: { items: NavItem[]; brand: string }) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const sections = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setCurrent(visible[0].target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav className="ld-nav" aria-label="Mục lục thiệp">
      <a className="ld-nav__brand" href="#top">
        {brand}
      </a>
      <ul className="ld-nav__list">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} aria-current={current === item.id ? 'location' : undefined}>
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
