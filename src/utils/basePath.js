// src/utils/basePath.js

export const getBasePath = (path) => {
    // Rimuove lo slash iniziale se presente per evitare doppi slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // In produzione su GitHub Pages, aggiunge il nome della repo
    if (process.env.NODE_ENV === 'production') {
        return `/warframecodex-next/${cleanPath}`;
    }
    
    // In locale ritorna il path normale
    return `/${cleanPath}`;
};