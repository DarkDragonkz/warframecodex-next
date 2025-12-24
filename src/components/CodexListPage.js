"use client";
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CodexCard from './CodexCard';
// Import Dinamico per il Modale (Code Splitting)
import dynamic from 'next/dynamic';
import { useOwnedItems } from '@/hooks/useOwnedItems';
import '@/app/hud-layout.css'; 

// Carica il modale solo quando richiesto dal browser
const WarframeDetailModal = dynamic(() => import('./WarframeDetailModal'), {
    loading: () => <div style={{position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.8)', color:'white'}}>Loading Interface...</div>,
    ssr: false // Il modale non serve lato server
});

function CodexContent({ pageTitle, customCategories = null, initialData = [], lookupData = null }) {
    // initialData viene ora passato dal Server Component
    const [rawApiData, setRawApiData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { ownedCards, toggleOwned } = useOwnedItems();
    const [selectedItem, setSelectedItem] = useState(null);

    const defaultCat = customCategories ? customCategories[0].id : 'all';
    const subCategory = searchParams.get('sub') || defaultCat;
    const [activeSubFilter, setActiveSubFilter] = useState('all');
    
    // Gestione Ricerca con Debounce
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [showMissingOnly, setShowMissingOnly] = useState(false);
    const [hideVaulted, setHideVaulted] = useState(false);
    const [visibleCount, setVisibleCount] = useState(60);

    const activeConfig = customCategories ? customCategories.find(c => c.id === subCategory) : null;

    // Effetto Debounce per la ricerca
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300); // Ritardo di 300ms
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Processamento Iniziale Dati (Eseguito una sola volta all'avvio)
    useEffect(() => {
        if (initialData && initialData.length > 0) {
            const activeRelicsSet = new Set(lookupData ? Object.keys(lookupData) : []);
            
            const processed = initialData
                .filter(i => i && !i.uniqueName.includes("RANDOM") && i.imageName) 
                .map(item => {
                    let computedVaulted = !!item.vaulted; 

                    // Logica calcolo Vaulted per i Prime basata sul Lookup passato dal server
                    if (item.name.includes('Prime') && lookupData) {
                        const relicNames = [];
                        if (item.components) {
                            item.components.forEach(c => {
                                if(c.drops) c.drops.forEach(d => {
                                    const match = d.location.toUpperCase().match(/(LITH|MESO|NEO|AXI|REQUIEM)\s+([A-Z0-9]+)/);
                                    if (match) relicNames.push(`${match[1]} ${match[2]}`);
                                });
                            });
                        }
                        
                        if (relicNames.length > 0) {
                            const hasActiveRelic = relicNames.some(r => activeRelicsSet.has(r));
                            if (!hasActiveRelic) computedVaulted = true; 
                            else computedVaulted = false; 
                        }
                    }

                    return {
                        ...item,
                        vaulted: computedVaulted, 
                        maxRank: item.fusionLimit || item.maxLevel || 30,
                        baseDrain: item.baseDrain || 0,
                        polarityIcon: item.polarity ? `https://warframe.fandom.com/wiki/File:Polarity_${item.polarity.charAt(0).toUpperCase() + item.polarity.slice(1)}.png` : null 
                    };
                });

            // Rimuovi duplicati e ordina
            const uniqueItems = Array.from(new Map(processed.map(item => [item.name, item])).values());
            uniqueItems.sort((a, b) => a.name.localeCompare(b.name));
            
            setRawApiData(uniqueItems);
            setLoading(false);
        }
    }, [initialData, lookupData]);

    const processedData = useMemo(() => {
        return rawApiData.filter(item => {
            // Usa debouncedSearch invece di searchTerm diretto
            if (debouncedSearch && !item.name.toLowerCase().includes(debouncedSearch)) return false;
            if (showMissingOnly && ownedCards.has(item.uniqueName)) return false;
            if (hideVaulted && item.vaulted) return false;
            
            if (activeConfig && activeConfig.filter && !activeConfig.filter(item)) return false;
            if (activeConfig && activeConfig.subFilters) {
                const subLogic = activeConfig.subFilters.find(sf => sf.id === activeSubFilter);
                if (subLogic && subLogic.filter && !subLogic.filter(item)) return false;
            }
            return true;
        });
    }, [rawApiData, subCategory, activeSubFilter, debouncedSearch, showMissingOnly, hideVaulted, ownedCards, activeConfig]);

    const handleCategoryChange = (id) => {
        const p = new URLSearchParams(searchParams.toString());
        p.set('sub', id);
        router.push(`${pathname}?${p.toString()}`);
        setActiveSubFilter('all'); 
    };

    if (loading) return <div style={{padding:'50px', color:'#fff', textAlign:'center'}}>INITIALIZING ORDIS DATABASE...</div>;

    const pct = rawApiData.length > 0 ? Math.round((ownedCards.size / rawApiData.length) * 100) : 0;

    return (
        <div className="codex-layout">
            <div className="header-group">
                <div className="nav-top-row">
                    <div className="nav-brand">
                        <Link href="/" className="nav-home-btn">⌂ HOME</Link>
                        <h1 className="page-title">{pageTitle}</h1>
                    </div>
                    <div className="stats-right">
                        <div className="stat-box">
                            <div className="stat-label">COLLECTED</div>
                            <div className="stat-value"><span>{ownedCards.size}</span> / {rawApiData.length}</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-label">COMPLETION</div>
                            <div className="stat-value">{pct}%</div>
                        </div>
                    </div>
                </div>

                <div className="controls-row">
                    <div className="filters-left">
                        {customCategories && customCategories.length > 1 && (
                            <div className="category-tabs">
                                {customCategories.map(c => (
                                    <button key={c.id} className={`tab-btn ${subCategory === c.id ? 'active' : ''}`} onClick={() => handleCategoryChange(c.id)}>
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        )}
                         {activeConfig && activeConfig.subFilters && (
                            <div className="category-tabs">
                                {activeConfig.subFilters.map(sf => (
                                    <button key={sf.id} onClick={() => setActiveSubFilter(sf.id)} className={`tab-btn ${activeSubFilter === sf.id ? 'active' : ''}`}>
                                        {sf.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="filters-right">
                         <div className="search-wrapper">
                            <input 
                                type="text" 
                                className="search-input" 
                                placeholder="SEARCH..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value.toLowerCase())} 
                            />
                        </div>
                        <label className="toggle-filter">
                            <input type="checkbox" style={{display:'none'}} checked={hideVaulted} onChange={(e) => setHideVaulted(e.target.checked)} />
                            <div className="checkbox-custom">{hideVaulted && '✓'}</div>
                            HIDE VAULTED
                        </label>
                        <label className="toggle-filter">
                            <input type="checkbox" style={{display:'none'}} checked={showMissingOnly} onChange={(e) => setShowMissingOnly(e.target.checked)} />
                            <div className="checkbox-custom">{showMissingOnly && '✓'}</div>
                            MISSING
                        </label>
                    </div>
                </div>
                <div className="progress-line-container"><div className="progress-line-fill" style={{width: `${pct}%`}}></div></div>
            </div>

             <div className="gallery-scroll-area" onScroll={(e) => {
                if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 500) setVisibleCount(p => p + 60);
            }}>
                <div className="card-gallery">
                    {processedData.slice(0, visibleCount).map(item => (
                        <div key={item.uniqueName} onClick={() => setSelectedItem(item)} style={{cursor:'pointer'}}>
                            <CodexCard item={item} isOwned={ownedCards.has(item.uniqueName)} onToggleOwned={toggleOwned} />
                        </div>
                    ))}
                </div>
            </div>
            
            {selectedItem && (
                <WarframeDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} ownedItems={ownedCards} onToggle={toggleOwned} />
            )}
        </div>
    );
}

export default function CodexListPage(props) {
    return (
        <Suspense fallback={<div style={{color:'#fff', padding:'50px', textAlign:'center'}}>Loading Interface...</div>}>
            <CodexContent {...props} />
        </Suspense>
    );
}