"use client";
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import CodexCard from './CodexCard';
import WarframeDetailModal from './WarframeDetailModal';
import { useOwnedItems } from '@/hooks/useOwnedItems';
import { API_BASE_URL } from '@/utils/constants';

// *** CARICA STILE HUD ***
import '@/app/hud-layout.css'; 

function CodexContent({ filesToLoad = [], pageTitle, customCategories = null, manualData = null }) {
    const [rawApiData, setRawApiData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { ownedCards, toggleOwned } = useOwnedItems(); // RIMOSSO importItems
    const [selectedItem, setSelectedItem] = useState(null);

    const defaultCat = customCategories ? customCategories[0].id : 'all';
    const subCategory = searchParams.get('sub') || defaultCat;
    const [activeSubFilter, setActiveSubFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState("");
    
    // STATI FILTRI
    const [showMissingOnly, setShowMissingOnly] = useState(false);
    const [hideVaulted, setHideVaulted] = useState(false);
    
    const [visibleCount, setVisibleCount] = useState(60);

    const activeConfig = customCategories ? customCategories.find(c => c.id === subCategory) : null;
    const filesHash = filesToLoad.join(',');

    useEffect(() => {
        async function load() {
            setLoading(true);
            setErrorMsg(null);
            
            if (manualData && manualData.length > 0) {
                 const processed = manualData
                    .filter(i => i && !i.uniqueName.includes("RANDOM") && i.imageName) 
                    .map(item => ({
                        ...item,
                        maxRank: item.fusionLimit || item.maxLevel || 30,
                        baseDrain: item.baseDrain || 0,
                        polarityIcon: item.polarity ? `https://warframe.fandom.com/wiki/File:Polarity_${item.polarity.charAt(0).toUpperCase() + item.polarity.slice(1)}.png` : null 
                    }));
                const uniqueItems = Array.from(new Map(processed.map(item => [item.name, item])).values());
                uniqueItems.sort((a, b) => a.name.localeCompare(b.name));
                setRawApiData(uniqueItems);
                setLoading(false);
                return;
            }

            try {
                if (filesToLoad.length === 0) { setLoading(false); return; }

                const promises = filesToLoad.map(f => 
                    fetch(`${API_BASE_URL}/${f}`)
                        .then(res => {
                            if (!res.ok) throw new Error(`HTTP ${res.status}`);
                            return res.json();
                        })
                        .catch(err => {
                            console.warn(`Skipping ${f}`, err);
                            return [];
                        })
                );

                const results = await Promise.all(promises);
                const merged = results.flat();
                const processed = merged
                    .filter(i => i && !i.uniqueName.includes("RANDOM") && i.imageName) 
                    .map(item => ({
                        ...item,
                        maxRank: item.fusionLimit || item.maxLevel || 30,
                        baseDrain: item.baseDrain || 0,
                        polarityIcon: item.polarity ? `https://warframe.fandom.com/wiki/File:Polarity_${item.polarity.charAt(0).toUpperCase() + item.polarity.slice(1)}.png` : null 
                    }));
                const uniqueItems = Array.from(new Map(processed.map(item => [item.name, item])).values());
                uniqueItems.sort((a, b) => a.name.localeCompare(b.name));
                
                setRawApiData(uniqueItems);
            } catch (e) { 
                console.error("Load error:", e);
                setErrorMsg(e.message);
            }
            finally { setLoading(false); }
        }
        load();
    }, [filesHash, manualData]);

    const processedData = useMemo(() => {
        return rawApiData.filter(item => {
            if (searchTerm && !item.name.toLowerCase().includes(searchTerm)) return false;
            if (showMissingOnly && ownedCards.has(item.uniqueName)) return false;
            if (hideVaulted && item.vaulted) return false;
            
            if (activeConfig && activeConfig.filter && !activeConfig.filter(item)) return false;
            if (activeConfig && activeConfig.subFilters) {
                const subLogic = activeConfig.subFilters.find(sf => sf.id === activeSubFilter);
                if (subLogic && subLogic.filter && !subLogic.filter(item)) return false;
            }
            return true;
        });
    }, [rawApiData, subCategory, activeSubFilter, searchTerm, showMissingOnly, hideVaulted, ownedCards, activeConfig]);

    const handleCategoryChange = (id) => {
        const p = new URLSearchParams(searchParams.toString());
        p.set('sub', id);
        router.push(`${pathname}?${p.toString()}`);
        setActiveSubFilter('all'); 
    };

    if (loading) return <div style={{padding:'50px', color:'#fff', textAlign:'center'}}>INITIALIZING ORDIS DATABASE...</div>;
    if (errorMsg) return <div style={{padding:'50px', color:'red', textAlign:'center'}}>{errorMsg}</div>;

    const pct = rawApiData.length > 0 ? Math.round((ownedCards.size / rawApiData.length) * 100) : 0;

    return (
        <div className="codex-layout">
            <div className="header-group">
                <div className="nav-top-row">
                    <div className="nav-brand">
                        <a href="/" className="nav-home-btn">⌂ DASHBOARD</a>
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
                            <input type="text" className="search-input" placeholder="SEARCH..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toLowerCase())} />
                        </div>
                        
                        {/* CHECKBOX HIDE VAULTED */}
                        <label className="toggle-filter">
                            <input type="checkbox" style={{display:'none'}} checked={hideVaulted} onChange={(e) => setHideVaulted(e.target.checked)} />
                            <div className="checkbox-custom">{hideVaulted && '✓'}</div>
                            HIDE VAULTED
                        </label>

                        {/* CHECKBOX MISSING */}
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