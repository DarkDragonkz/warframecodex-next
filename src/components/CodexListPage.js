"use client";
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CodexCard from './CodexCard';
import dynamic from 'next/dynamic';
import { useOwnedItems } from '@/hooks/useOwnedItems';
import { CATEGORY_CONFIGS } from '@/utils/clientCategories';
import { VirtuosoGrid } from 'react-virtuoso';
import '@/app/hud-layout.css'; 

const WarframeDetailModal = dynamic(() => import('./WarframeDetailModal'), {
    loading: () => <div className="loading-overlay">Loading Interface...</div>,
    ssr: false
});

function CodexContent({ pageTitle, categoryMode, initialData = [], lookupData = null }) {
    const customCategories = categoryMode ? CATEGORY_CONFIGS[categoryMode] : null;

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
    
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // FILTRO 3 STATI (ALL -> MISSING -> OWNED)
    const [filterState, setFilterState] = useState('all');
    const [showVaulted, setShowVaulted] = useState(false);

    const activeConfig = customCategories ? customCategories.find(c => c.id === subCategory) : null;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Ciclo Stati Filtro
    const cycleFilterState = () => {
        if (filterState === 'all') setFilterState('missing');
        else if (filterState === 'missing') setFilterState('owned');
        else setFilterState('all');
    };

    useEffect(() => {
        if (initialData) {
            const activeRelicsSet = new Set(lookupData ? Object.keys(lookupData) : []);
            
            const processed = initialData
                .filter(i => i && !i.uniqueName.includes("RANDOM") && i.imageName) 
                .map(item => {
                    let computedVaulted = !!item.vaulted; 

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

            const uniqueItems = Array.from(new Map(processed.map(item => [item.uniqueName, item])).values());
            uniqueItems.sort((a, b) => a.name.localeCompare(b.name));
            
            setRawApiData(uniqueItems);
            setLoading(false);
        }
    }, [initialData, lookupData]);

    const processedData = useMemo(() => {
        return rawApiData.filter(item => {
            if (debouncedSearch && !item.name.toLowerCase().includes(debouncedSearch)) return false;
            
            // LOGICA 3 STATI
            const isOwned = ownedCards.has(item.uniqueName);
            if (filterState === 'missing' && isOwned) return false; // Mostra solo mancanti
            if (filterState === 'owned' && !isOwned) return false;  // Mostra solo posseduti

            if (!showVaulted && item.vaulted) return false;
            
            if (activeConfig && activeConfig.filter && !activeConfig.filter(item)) return false;
            if (activeConfig && activeConfig.subFilters) {
                const subLogic = activeConfig.subFilters.find(sf => sf.id === activeSubFilter);
                if (subLogic && subLogic.filter && !subLogic.filter(item)) return false;
            }
            return true;
        });
    }, [rawApiData, subCategory, activeSubFilter, debouncedSearch, filterState, showVaulted, ownedCards, activeConfig]);

    const handleCategoryChange = (id) => {
        const p = new URLSearchParams(searchParams.toString());
        p.set('sub', id);
        router.push(`${pathname}?${p.toString()}`);
        setActiveSubFilter('all'); 
    };

    const ownedCount = useMemo(() => {
        return rawApiData.reduce((count, item) => {
            return count + (ownedCards.has(item.uniqueName) ? 1 : 0);
        }, 0);
    }, [rawApiData, ownedCards]);

    const pct = rawApiData.length > 0 ? Math.round((ownedCount / rawApiData.length) * 100) : 0;
    
    if (loading) return <div className="loading-screen">INITIALIZING ORDIS DATABASE...</div>;

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
                            <div className="stat-value"><span>{ownedCount}</span> / {rawApiData.length}</div>
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
                            <input type="text" className="search-input" placeholder="SEARCH..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toLowerCase())} />
                        </div>
                        
                        {/* CHECKBOX SHOW VAULTED (Mantenuta) */}
                        <label className="toggle-filter">
                            <input type="checkbox" style={{display:'none'}} checked={showVaulted} onChange={(e) => setShowVaulted(e.target.checked)} />
                            <div className="checkbox-custom">{showVaulted && '✓'}</div>
                            SHOW VAULTED
                        </label>

                        {/* BOTTONE CICLICO CON TESTO (Sostituisce la vecchia checkbox "Missing") */}
                        <button 
                            className={`cycle-btn state-${filterState}`} 
                            onClick={cycleFilterState}
                        >
                            {filterState === 'all' && 'SHOW: ALL'}
                            {filterState === 'missing' && 'SHOW: MISSING'}
                            {filterState === 'owned' && 'SHOW: OWNED'}
                        </button>
                    </div>
                </div>
                <div className="progress-line-container"><div className="progress-line-fill" style={{width: `${pct}%`}}></div></div>
            </div>

            <div className="gallery-scroll-area">
                <VirtuosoGrid
                    style={{ height: '100%', width: '100%' }}
                    totalCount={processedData.length}
                    overscan={200}
                    components={{
                        List: (props) => <div {...props} className="card-gallery" />,
                        Item: (props) => <div {...props} className="card-item" />
                    }}
                    itemContent={(index) => {
                        const item = processedData[index];
                        return (
                            <div onClick={() => setSelectedItem(item)} style={{cursor:'pointer'}}>
                                <CodexCard item={item} isOwned={ownedCards.has(item.uniqueName)} onToggleOwned={toggleOwned} />
                            </div>
                        );
                    }}
                />
            </div>

            <nav className="mobile-bottom-nav">
                <Link href="/" className="mobile-bottom-link">Home</Link>
                <Link href="/arsenal" className="mobile-bottom-link">Arsenal</Link>
                <Link href="/entities" className="mobile-bottom-link">Entities</Link>
                <Link href="/upgrades" className="mobile-bottom-link">Upgrades</Link>
            </nav>
            
            {selectedItem && (
                <WarframeDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} ownedItems={ownedCards} onToggle={toggleOwned} />
            )}
        </div>
    );
}

export default function CodexListPage(props) {
    return (
        <Suspense fallback={<div className="loading-screen">Loading Interface...</div>}>
            <CodexContent {...props} />
        </Suspense>
    );
}
