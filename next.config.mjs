/** @type {import('next').NextConfig} */
const repoName = '/warframecodex-next'; // Il nome ESATTO del tuo repository

const nextConfig = {
    output: 'export', // Fondamentale per GitHub Pages
    
    // Configurazione Percorsi Base
    basePath: repoName,
    assetPrefix: repoName, // Assicura che CSS/JS vengano caricati giusti
    
    // Passiamo questa variabile al codice (constants.js)
    env: {
        NEXT_PUBLIC_BASE_PATH: repoName,
    },
    
    images: {
        unoptimized: true, // Necessario per l'export statico
    },
};

export default nextConfig;