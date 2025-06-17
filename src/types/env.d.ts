declare global {
  interface Window {
    env: {
      DIGIFLAZZ_USERNAME: string;
      DIGIFLAZZ_API_KEY: string;
    };
  }
}

export {};
