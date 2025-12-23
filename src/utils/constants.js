// Configurazione per GitHub Pages
const REPO_NAME = '/warframecodex-next'; 

// Verifica se siamo in produzione (GitHub) o sviluppo (Localhost)
const isProd = process.env.NODE_ENV === 'production';

// Se siamo in produzione, usiamo il nome del repo come prefisso.
export const BASE_PATH = isProd ? REPO_NAME : '';

// Costruiamo gli URL completi
export const API_BASE_URL = `${BASE_PATH}/database_api`;
export const IMG_BASE_URL = `${BASE_PATH}/images`; 

export const APP_VERSION = "6.5 - GitHub Fix Final";