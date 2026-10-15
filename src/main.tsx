import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { App } from './App';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
);
