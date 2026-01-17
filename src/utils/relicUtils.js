// src/utils/relicUtils.js
import { fetchGameData } from '@/utils/serverData';

// Mappa globale per la sessione client
let relicCache = null;

export async function getRelicDatabase() {
    if (relicCache) return relicCache;

    try {
        // Scarica il file Relics.json (che ora è locale grazie a serverData)
        // Nota: In Next.js App Router, per i client component, usiamo una API route interna
        // Ma per semplificare, possiamo fare una chiamata fetch al file statico o usare l'API che creeremo
        const res = await fetch('/database_api/Relics.json'); // Legge dalla cartella public o via API
        
        // Se non funziona, rimandiamo al server o a un endpoint dedicato
        let data;
        if (!res.ok) {
             console.warn("Relic DB not available on client.");
             return new Map(); 
        } else {
             data = await res.json();
        }

        const map = new Map();
        
        data.forEach(item => {
            // FILTRO RIGIDO: Solo Reliquie, NO Radiant/Flawless/Exceptional
            if (item.category === 'Relics' && 
                !item.name.includes('(Radiant)') && 
                !item.name.includes('(Flawless)') && 
                !item.name.includes('(Exceptional)')) {
                
                // Pulizia Nome: "Lith G1 Relic (Intact)" -> "Lith G1"
                const cleanName = item.name
                    .replace(" Relic", "")
                    .replace(" (Intact)", "")
                    .trim();
                
                map.set(cleanName, {
                    id: item.uniqueName,
                    name: cleanName,
                    image: item.imageName,
                    drops: item.drops || [], // Dove si trova questa reliquia
                    vaulted: !item.drops || item.drops.length === 0
                });
            }
        });

        relicCache = map;
        return map;
    } catch (e) {
        console.error("Relic DB Error", e);
        return new Map();
    }
}
