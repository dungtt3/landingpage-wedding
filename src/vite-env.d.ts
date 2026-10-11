/// <reference types="vite/client" />

declare module 'virtual:storybook-files' {
  /** Public paths of files that exist under public/assets/storybook. */
  const files: string[];
  export default files;
}

declare module 'virtual:landing-files' {
  /** Public paths of files that exist under public/assets/landing. */
  const files: string[];
  export default files;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
