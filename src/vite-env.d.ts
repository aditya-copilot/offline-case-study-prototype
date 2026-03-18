/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_FEATURE_BLE: string;
  readonly VITE_FEATURE_ANALYTICS: string;
  readonly VITE_FEATURE_PUSH: string;
  readonly VITE_FEATURE_SYNC: string;
  readonly VITE_FEATURE_GAMIFICATION: string;
  readonly VITE_FEATURE_AI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.mp3' {
  const content: string;
  export default content;
}

declare module '*.mp4' {
  const content: string;
  export default content;
}
