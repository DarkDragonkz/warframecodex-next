/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export", // Necessario per GitHub Pages
    reactStrictMode: true,
    
    // Configurazione BASE PATH per GitHub Pages
    // Sostituisci 'warframecodex-next' se cambi nome alla repo
    basePath: process.env.NODE_ENV === "production" ? "/warframecodex-next" : "",
    
    images: {
        // GitHub Pages non supporta l'ottimizzazione immagini di default di Next.js
        unoptimized: true,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cdn.warframestat.us",
            },
        ],
    },
};

export default nextConfig;