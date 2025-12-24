import Image from "next/image";
import Link from "next/link";
import { getBasePath } from "@/utils/basePath"; // Assicurati di aver creato il file al punto 3

export default function ModCard({ item }) {
    // URL immagine mod (gestisce fallback se manca l'immagine)
    const imageUrl = item.wikiaThumbnail || item.imageName 
        ? `https://cdn.warframestat.us/img/${item.imageName}` 
        : null;

    // Gestione Polarità:
    // 1. Convertiamo in minuscolo per combaciare coi file (es. "Madurai" -> "madurai")
    // 2. Usiamo getBasePath per risolvere l'URL su GitHub Pages
    const polarityName = item.polarity ? item.polarity.toLowerCase() : null;
    const polarityUrl = polarityName ? getBasePath(`polarities/${polarityName}.png`) : null;

    return (
        <Link href={`/mods/${item.uniqueName}`} className="block h-full">
            <div className="group relative flex flex-col h-full bg-wf-panel border border-white/10 rounded-lg overflow-hidden transition-all duration-300 hover:border-wf-gold/60 hover:shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                
                {/* Header della Card con Nome e Polarità */}
                <div className="flex items-center justify-between p-3 bg-black/20 border-b border-white/5">
                    <h3 className="text-wf-text font-bold text-sm truncate pr-2 group-hover:text-wf-gold transition-colors">
                        {item.name}
                    </h3>
                    {polarityUrl && (
                        <div className="flex-shrink-0 w-6 h-6 bg-white/5 rounded-full p-1" title={item.polarity}>
                            {/* Usiamo <img> standard per le icone piccole statiche per evitare problemi di path complessi con <Image> su export statico */}
                            <img 
                                src={polarityUrl} 
                                alt={item.polarity} 
                                className="w-full h-full object-contain invert opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                    )}
                </div>

                {/* Corpo centrale con Immagine */}
                <div className="relative flex-grow flex items-center justify-center p-4 bg-gradient-to-b from-transparent to-black/40">
                    {imageUrl ? (
                        <div className="relative w-full aspect-[2/3] max-h-40">
                            <Image
                                src={imageUrl}
                                alt={item.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-full h-32 text-wf-muted text-xs">
                            No Image
                        </div>
                    )}
                </div>

                {/* Footer con Rarity o Info Extra */}
                <div className="p-2 bg-black/40 text-center border-t border-white/5">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${
                        item.rarity === 'Legendary' ? 'text-yellow-200' :
                        item.rarity === 'Rare' ? 'text-yellow-400' :
                        item.rarity === 'Uncommon' ? 'text-gray-300' :
                        'text-amber-700'
                    }`}>
                        {item.rarity || 'Common'}
                    </span>
                </div>
            </div>
        </Link>
    );
}