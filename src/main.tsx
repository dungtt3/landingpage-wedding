import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { App } from './App';
import { resolveGuestLink } from './features/landing/lib/guests';
// Fonts are bundled and served from this site (no fonts.googleapis.com, which some networks block or slow down).
// Each file declares every subset with `unicode-range`, so a browser only downloads the Vietnamese/Latin ones it needs.
import '@fontsource/quicksand/400.css';
import '@fontsource/quicksand/500.css';
import '@fontsource/quicksand/600.css';
import '@fontsource/quicksand/700.css';
import '@fontsource/pacifico/400.css';
import '@fontsource/great-vibes/400.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/800.css';
import './styles/global.css';

const root = createRoot(document.getElementById('root')!);
const path = window.location.pathname;

if (/^\/admin\/?$/.test(path)) {
  // The link maker: its own chunk, so guests never download it.
  void import('./features/admin/AdminPage').then(({ AdminPage }) =>
    root.render(
      <StrictMode>
        <AdminPage />
      </StrictMode>,
    ),
  );
} else {
  // A `/g/<code>` link: find the guest first, so the card opens with their name already on it.
  void resolveGuestLink(path).then(() =>
    root.render(
      <StrictMode>
        <App />
        <Analytics />
        <SpeedInsights />
      </StrictMode>,
    ),
  );
}
