/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    
    // FONDAMENTALE: Il nome del tuo repository GitHub
    basePath: '/warframecodex-next',
    assetPrefix: '/warframecodex-next/',
    
    images: {
        unoptimized: true,
    },
};

export default nextConfig;