// Recupera il percorso base definito in next.config.mjs
// Se siamo in locale (npm run dev), questa variabile solitamente è vuota, il che va bene.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Costruiamo gli URL completi dinamici
export const API_BASE_URL = `${BASE_PATH}/database_api`;
export const IMG_BASE_URL = `${BASE_PATH}/images`; 

export const APP_VERSION = "6.6 - Env Path Fix";