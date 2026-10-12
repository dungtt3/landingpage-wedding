/**
 * Frame art around the invitation sheet, after royal-robe embroidery: red sky
 * with auspicious clouds at the top, rolling waves at the sides, and diagonal
 * "standing water" stripes meeting in a chevron at the bottom. Drawn in a
 * 690×1000 box and stretched to the card; only the edges show around the sheet.
 */

const INK = '#2b160e';
const STRIPES = ['#2d5b6e', '#fbf6ec', '#d98b2b', '#fbf6ec', '#627d3a', '#fbf6ec', '#b3161c', '#fbf6ec'];
const STRIPE_W = 14;
const WAVE_BANDS = ['#2d5b6e', '#fbf6ec', '#6aa7a8', '#fbf6ec', '#e3b04b', '#fbf6ec', '#3f7f8c', '#fbf6ec'];

/** A cloud: overlapping lobes, each with a curled centre. */
function Cloud({ x, y, r, color, curl = '#f6dfa2' }: { x: number; y: number; r: number; color: string; curl?: string }) {
  const lobes = [
    [0, 0, 1],
    [-0.95, 0.25, 0.7],
    [0.95, 0.25, 0.7],
    [0, 0.55, 0.62],
  ] as const;
  return (
    <g>
      {lobes.map(([dx, dy, s], i) => (
        <circle key={`l${i}`} cx={x + dx * r} cy={y + dy * r} r={r * s} fill={color} stroke={INK} strokeWidth="3" />
      ))}
      {lobes.map(([dx, dy, s], i) => (
        <g key={`c${i}`} fill="none" stroke={curl} strokeWidth="2.2" strokeLinecap="round">
          <path
            d={`M${x + dx * r - r * s * 0.55} ${y + dy * r}
                a${r * s * 0.55} ${r * s * 0.55} 0 1 1 ${r * s * 0.55} ${r * s * 0.55}
                a${r * s * 0.3} ${r * s * 0.3} 0 1 1 ${r * s * 0.05} -${r * s * 0.5}`}
          />
        </g>
      ))}
    </g>
  );
}

/** White foam curling over the top of a wave. */
function Foam({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g fill="#fbf6ec" stroke={INK} strokeWidth="2">
      <circle cx={x} cy={y} r={9 * s} />
      <circle cx={x + 12 * s} cy={y - 8 * s} r={7 * s} />
      <circle cx={x + 24 * s} cy={y - 2 * s} r={6 * s} />
      <circle cx={x + 6 * s} cy={y - 18 * s} r={5 * s} />
    </g>
  );
}

const sideClouds: { x: number; y: number; r: number; color: string }[] = [
  { x: 52, y: 40, r: 34, color: '#e3b04b' },
  { x: 150, y: 28, r: 26, color: '#4e7a4a' },
  { x: 60, y: 140, r: 30, color: '#3f7f8c' },
  { x: 40, y: 250, r: 34, color: '#4e7a4a' },
  { x: 58, y: 360, r: 26, color: '#8a5a2b' },
  { x: 36, y: 560, r: 26, color: '#e3b04b' },
  { x: 52, y: 690, r: 30, color: '#8a5a2b' },
  { x: 36, y: 820, r: 22, color: '#4e7a4a' },
];

export function InvitationBorder() {
  const mirror = (c: (typeof sideClouds)[number]) => ({ ...c, x: 690 - c.x });
  return (
    <svg className="sb-gate__border" viewBox="0 0 690 1000" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        {[
          ['sb-border-stripes-l', 40],
          ['sb-border-stripes-r', -40],
        ].map(([id, angle]) => (
          <pattern
            key={id}
            id={String(id)}
            width={STRIPES.length * STRIPE_W}
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${angle})`}
          >
            {STRIPES.map((c, i) => (
              <rect key={i} x={i * STRIPE_W} y="0" width={STRIPE_W} height="10" fill={c} />
            ))}
            {STRIPES.map((_, i) => (
              <line key={`s${i}`} x1={i * STRIPE_W} y1="0" x2={i * STRIPE_W} y2="10" stroke={INK} strokeWidth="1.5" />
            ))}
          </pattern>
        ))}
      </defs>

      <rect width="690" height="1000" fill="#b3161c" />

      {/* Waves rising from both sides. */}
      {[0, 690].map((cx) => (
        <g key={cx}>
          {WAVE_BANDS.map((c, i) => (
            <circle key={i} cx={cx} cy="760" r={320 - i * 30} fill={c} stroke={INK} strokeWidth="2" />
          ))}
        </g>
      ))}
      <Foam x={20} y={455} s={1.2} />
      <Foam x={90} y={520} />
      <Foam x={640} y={455} s={1.2} />
      <Foam x={572} y={520} />

      {/* Standing-water stripes, meeting in a chevron at the bottom centre. */}
      <polygon points="0,730 345,860 345,1000 0,1000" fill="url(#sb-border-stripes-l)" />
      <polygon points="690,730 345,860 345,1000 690,1000" fill="url(#sb-border-stripes-r)" />
      <polyline points="0,730 345,860 690,730" fill="none" stroke={INK} strokeWidth="3" />

      {[...sideClouds, ...sideClouds.map(mirror)].map((c, i) => (
        <Cloud key={i} {...c} />
      ))}
      <Cloud x={260} y={30} r={24} color="#3f7f8c" />
      <Cloud x={430} y={30} r={24} color="#e3b04b" />
      <Cloud x={345} y={22} r={18} color="#fbf6ec" curl="#b3161c" />
    </svg>
  );
}
