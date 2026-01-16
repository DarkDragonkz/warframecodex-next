import { BASE_PATH } from './constants';

export const getBasePath = (path) => {
    // Rimuove lo slash iniziale se presente per evitare doppi slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // In produzione (GitHub Pages), aggiunge il nome della repo
    if (process.env.NODE_ENV === 'production') {
        return `${BASE_PATH}/${cleanPath}`;
    }
    
    // In locale ritorna il path normale
    return `/${cleanPath}`;
};
