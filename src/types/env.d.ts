declare const APP_VERSION: string;

interface ImportMetaEnv {
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
