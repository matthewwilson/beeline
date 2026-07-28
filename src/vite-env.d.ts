/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_POSTHOG_PROJECT_TOKEN?: string
  readonly VITE_POSTHOG_HOST?: string
  readonly VITE_HABITAT_NETWORKS_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
