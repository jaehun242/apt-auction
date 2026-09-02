/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NAVER_MAP_CLIENT_ID?: string
  readonly VITE_SAMPLE_DATA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
