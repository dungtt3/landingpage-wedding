/** Small line icons for the section nav (24×24, stroke = currentColor). */
const PATHS = {
  couple:
    'M8 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 20c.6-3.6 2.8-5.5 5.5-5.5s4.9 1.9 5.5 5.5m-2.5-4.6c1.1-.6 2.4-.9 5-.9 2.7 0 4.9 1.9 5.5 5.5',
  events: 'M4 6.5h16v13.5H4zM4 10.5h16M8.5 3.5v5M15.5 3.5v5M8 14h3m2 0h3m-8 3h3',
  story: 'M12 20s-7.5-4.6-7.5-10A4.4 4.4 0 0 1 12 7.2 4.4 4.4 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z',
  gallery: 'M3.5 7.5h3.2l1.6-2.5h7.4l1.6 2.5h3.2v11.5h-17zM12 16.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z',
  rsvp: 'M3.5 6h17v12.5h-17zM3.8 6.3 12 13l8.2-6.7M9 15.5l2 2 4-4',
  wishes: 'M4 18.5V6a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 6v8.5a1.5 1.5 0 0 1-1.5 1.5H8.5L4 18.5ZM8 9h8m-8 3h5',
  gifts: 'M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-1.6-3.6-6-3.4-5.2-.6M12 7c1.6-3.6 6-3.4 5.2-.6',
} as const;

export type NavIconName = keyof typeof PATHS;

export function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg className="ld-nav__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
