"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { VirtuosoGrid } from 'react-virtuoso';
import { IMG_BASE_URL } from '@/utils/constants';
import { getBasePath } from '@/utils/basePath'; 
import '@/app/hud-layout.css'; 
import './mods.css';

const STORAGE_KEY = 'warframe_codex_mods_v1';

// --- CONFIGURAZIONE CATEGORIE (TYPE-BASED) ---
const TABS = [
    { id: 'all', label: 'ALL' },
    { id: 'warframe', label: 'WARFRAME' },
    { id: 'primary', label: 'PRIMARY' },
    { id: 'shotgun', label: 'SHOTGUN' },
    { id: 'secondary', label: 'SECONDARY' },
    { id: 'melee', label: 'MELEE' },
    { id: 'companion', label: 'COMPANION' },
    { id: 'archwing', label: 'ARCHWING' },
    { id: 'arch-gun', label: 'ARCH-GUN' },
    { id: 'arch-melee', label: 'ARCH-MELEE' },
    { id: 'k-drive', label: 'K-DRIVE' },
    { id: 'railjack', label: 'RAILJACK' },
    { id: 'necramech', label: 'NECRAMECH' },
    { id: 'parazon', label: 'PARAZON' }
];

export default function ModsClientPage({ initialData = [] }) {
    const [rawApiData, setRawApiData] = useState([]);
    const [ownedCards, setOwnedCards] = useState(new Set());
    const [loading, setLoading] = useState(true);

    const [currentCategory, setCurrentCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentSort, setCurrentSort] = useState('name');
    const [showMissingOnly, setShowMissingOnly] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(searchTerm); }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // --- CARICAMENTO DATI ---
    useEffect(() => {
        if(initialData && initialData.length > 0) {
            const uniqueMap = new Map();
            
            initialData.forEach(item => {
                // Filtri Pulizia
                if(item.name.includes("Riven Mod")) return;
                if(item.uniqueName && item.uniqueName.includes("/PVP")) return;
                if(item.type === "Fusion Core") return;
                if(item.type === "Mod Set Mod") return;
                if(item.type === "Focus Way") return;

                // MAPPING CATEGORIE (Basato su Type)
                let mappedCategory = 'other';
                const t = (item.type || "").toLowerCase();

                // Specifici prima
                if (t.includes('arch-melee')) mappedCategory = 'arch-melee';
                else if (t.includes('arch-gun')) mappedCategory = 'arch-gun';
                else if (t.includes('shotgun')) mappedCategory = 'shotgun';
                else if (t.includes('k-drive')) mappedCategory = 'k-drive';
                else if (t.includes('necramech')) mappedCategory = 'necramech';
                else if (t.includes('railjack') || t.includes('plexus')) mappedCategory = 'railjack';
                else if (t.includes('parazon')) mappedCategory = 'parazon';
                else if (t === 'archwing mod') mappedCategory = 'archwing';
                // Generici dopo
                else if (t.includes('warframe') || t.includes('aura')) mappedCategory = 'warframe';
                else if (t.includes('primary') || t.includes('rifle') || t.includes('bow') || t.includes('sniper') || t.includes('launcher')) mappedCategory = 'primary';
                else if (t.includes('secondary') || t.includes('pistol')) mappedCategory = 'secondary';
                else if (t.includes('melee') || t.includes('stance')) mappedCategory = 'melee';
                else if (t.includes('companion') || t.includes('sentinel') || t.includes('beast')) mappedCategory = 'companion';

                let cleanDesc = item.description || "";
                if (Array.isArray(item.description)) cleanDesc = item.description.join(" ");
                if (!cleanDesc && item.levelStats?.length > 0) {
                    cleanDesc = item.levelStats[item.levelStats.length - 1].stats.join(" ");
                }

                if(!uniqueMap.has(item.name)) {
                    uniqueMap.set(item.name, {
                        ...item,
                        myCategory: mappedCategory,
                        description: cleanDesc,
                        maxRank: item.fusionLimit || 5,
                        baseDrain: item.baseDrain || 2,
                        searchStr: `${item.name} ${item.type} ${mappedCategory}`.toLowerCase()
                    });
                }
            });

            const processed = Array.from(uniqueMap.values()).sort((a,b) => a.name.localeCompare(b.name));
            setRawApiData(processed);
            setLoading(false);
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) { try { setOwnedCards(new Set(JSON.parse(saved))); } catch (e) {} }
    }, [initialData]);

    useEffect(() => {
        if (!loading) localStorage.setItem(STORAGE_KEY, JSON.stringify([...ownedCards]));
    }, [ownedCards, loading]);

    // --- FILTRAGGIO ---
    const filteredData = useMemo(() => {
        return rawApiData.filter(item => {
            if (debouncedSearch && !item.searchStr.includes(debouncedSearch)) return false;
            if (showMissingOnly && ownedCards.has(item.uniqueName)) return false;
            if (currentCategory !== 'all' && item.myCategory !== currentCategory) return false;
            return true;
        }).sort((a, b) => {
            if (currentSort === 'name') return a.name.localeCompare(b.name);
            if (currentSort === 'drain') return (b.baseDrain || 0) - (a.baseDrain || 0);
            if (currentSort === 'rarity') {
                const map = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Legendary': 4, 'Arcane': 5 };
                return (map[b.rarity] || 0) - (map[a.rarity] || 0) || a.name.localeCompare(b.name);
            }
            return 0;
        });
    }, [rawApiData, debouncedSearch, currentCategory, currentSort, showMissingOnly, ownedCards]);

    const toggleOwned = (id) => {
        const newSet = new Set(ownedCards);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setOwnedCards(newSet);
    };

    const pct = rawApiData.length > 0 ? Math.round((ownedCards.size / rawApiData.length) * 100) : 0;

    if (loading) return <div style={{color:'#fff', padding:'50px', textAlign:'center'}}>LOADING MOD MODULES...</div>;

    return (
        <div className="codex-layout">
            {/* Header Group: Stessa struttura delle altre pagine */}
            <div className="header-group">
                <div className="nav-top-row">
                    <div className="nav-brand">
                        <Link href="/" className="nav-home-btn">⌂ HOME</Link>
                        <h1 className="page-title">MODS DATABASE</h1>
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
                    {/* TABS SCROLLABILI: Usiamo le tue classi originali 'category-tabs' e 'tab-btn' */}
                    <div className="filters-left" style={{overflowX:'auto', whiteSpace:'nowrap', paddingBottom:'5px'}}>
                        <div className="category-tabs" style={{display:'inline-flex', gap:'5px'}}>
                            {TABS.map(tab => (
                                <button 
                                    key={tab.id}
                                    className={`tab-btn ${currentCategory === tab.id ? 'active' : ''}`}
                                    onClick={() => setCurrentCategory(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="filters-right">
                        <div className="search-wrapper">
                            <input 
                                type="text" className="search-input" placeholder="SEARCH MOD..." 
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toLowerCase())} 
                            />
                        </div>

                        <select 
                            className="search-input" 
                            style={{width:'auto', cursor:'pointer'}}
                            value={currentSort}
                            onChange={(e) => setCurrentSort(e.target.value)}
                        >
                            <option value="name">NAME</option>
                            <option value="rarity">RARITY</option>
                            <option value="drain">COST</option>
                        </select>

                        <label className="toggle-filter" style={{display:'flex', alignItems:'center', gap:'5px', color:'#ccc', fontSize:'10px', fontWeight:'bold', cursor:'pointer', border:'1px solid #444', padding:'5px 10px', borderRadius:'4px', background: showMissingOnly ? 'rgba(255,255,255,0.1)' : 'transparent'}}>
                            <input type="checkbox" style={{display:'none'}} checked={showMissingOnly} onChange={(e) => setShowMissingOnly(e.target.checked)} />
                            <span style={{color: showMissingOnly ? '#5fffa5' : '#666'}}>
                                {showMissingOnly ? '✓ MISSING' : 'SHOW ALL'}
                            </span>
                        </label>
                    </div>
                </div>
                <div className="progress-line-container"><div className="progress-line-fill" style={{width: `${pct}%`}}></div></div>
            </div>

            <div className="gallery-scroll-area">
                <VirtuosoGrid
                    style={{ height: '100%', width: '100%' }}
                    totalCount={filteredData.length}
                    overscan={200}
                    components={{
                        List: (props) => <div {...props} className="card-gallery" style={{...props.style, display: 'flex', flexWrap: 'wrap', justifyContent:'center', gap:'25px', paddingBottom: '100px'}} />,
                        Item: (props) => <div {...props} style={{...props.style, margin: 0}} />
                    }}
                    itemContent={(index) => {
                        const item = filteredData[index];
                        return (
                            <div style={{padding:'0'}}>
                                <ModCard 
                                    item={item} 
                                    isOwned={ownedCards.has(item.uniqueName)} 
                                    onToggle={() => toggleOwned(item.uniqueName)} 
                                />
                            </div>
                        );
                    }}
                />
            </div>
        </div>
    );
}

// --- CARD COMPONENT ---
function ModCard({ item, isOwned, onToggle }) {
    const [flipped, setFlipped] = useState(false);
    const maxRank = item.maxRank || 0;
    const [rank, setRank] = useState(0); 

    const increaseRank = (e) => { e.stopPropagation(); setRank(Math.min(maxRank, rank + 1)); };
    const decreaseRank = (e) => { e.stopPropagation(); setRank(Math.max(0, rank - 1)); };

    const getDescription = () => {
        if(!item.description) return "No description.";
        return item.description.replace(/(\d+(\.\d+)?)/g, (match) => {
            const val = parseFloat(match);
            if(isNaN(val) || val > 1000) return match; 
            const scaled = (val / (maxRank + 1)) * (rank + 1);
            if(!isFinite(scaled)) return match;
            const fmt = Number.isInteger(scaled) ? scaled : scaled.toFixed(1).replace(/\.0$/, '');
            return `<b>${fmt}</b>`;
        }).replace(/\r\n|\n/g, "<br>");
    };

    const getPolarityIcon = () => {
        if (!item.polarity) return null;
        const p = item.polarity.toLowerCase().trim();
        const map = {
            'madurai': 'madurai.png', 'naramon': 'naramon.png', 'vazarin': 'vazarin.png',
            'zenurik': 'zenurik.png', 'unairu': 'unairu.png', 'penjaga': 'penjaga.png',
            'universal': 'any.png', 'umbra': 'umbra.png'
        };
        const fileName = map[p] || (p.charAt(0).toUpperCase() + p.slice(1) + '.png');
        return getBasePath(`polarities/${fileName}`);
    };
    const polIconUrl = getPolarityIcon();
    
    // Badge Label
    const getBadgeLabel = () => {
        if (item.name.includes("Peculiar")) return "PECULIAR";
        if (item.type) return item.type.replace(" Mod", "").toUpperCase();
        return "MOD";
    };

    const imageUrl = item.imageName ? `${IMG_BASE_URL}/${item.imageName}` : null;
    const currentDrain = (item.baseDrain || 0) + rank;
    const wikiUrl = `https://warframe.fandom.com/wiki/${item.name.replace(/ /g, '_')}`;

    return (
        <div 
            className={`mod-card-wrapper ${isOwned ? 'owned' : ''} ${flipped ? 'flipped' : ''}`}
            data-rarity={item.rarity || 'Common'}
            onClick={() => setFlipped(!flipped)}
        >
            <div className="mod-card-inner">
                {/* FRONT */}
                <div className="mod-card-front">
                    <div className="mod-image-area">
                        {imageUrl ? (
                             <Image src={imageUrl} alt={item.name} fill className="mod-img" unoptimized />
                        ) : (
                            <div className="no-image-placeholder" style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#444', fontSize:'12px'}}>NO IMAGE</div>
                        )}
                    </div>
                    <div className="mod-top-bar">
                        <div className={`mod-status-btn ${isOwned ? 'owned' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                            {isOwned ? 'OWNED' : 'MISSING'}
                        </div>
                        <div className="mod-drain-box">
                            <span>{currentDrain}</span>
                            {polIconUrl && (
                                <img src={polIconUrl} alt={item.polarity} className="mod-polarity-icon" style={{ filter: 'invert(1)', width: '16px', height: '16px' }} onError={(e) => e.target.style.display='none'} />
                            )}
                        </div>
                    </div>
                    <div className="mod-info-front">
                        <div className="mod-type-badge">{getBadgeLabel()}</div>
                        <div className="mod-name" style={{color: getRarityColor(item.rarity)}}>{item.name}</div>
                        <div className="mod-desc-text" dangerouslySetInnerHTML={{__html: getDescription()}} />
                        
                        {maxRank > 0 && (
                            <div className="mod-rank-controls" onClick={(e) => e.stopPropagation()}>
                                <div className="rank-buttons-row">
                                    <div className="rank-btn" onClick={decreaseRank}>-</div>
                                    <div className="rank-label">RANK {rank}/{maxRank}</div>
                                    <div className="rank-btn" onClick={increaseRank}>+</div>
                                </div>
                                <div className="mod-rank-dots-container">
                                    {Array.from({length: maxRank}).map((_, i) => (
                                        <div key={i} className={`rank-dot ${i < rank ? 'active' : ''}`}></div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* BACK */}
                <div className="mod-card-back">
                    <div className="mod-back-header">
                        <div className="mod-back-top">
                            <span className="back-title">DROP SOURCES</span>
                            <span className="flip-icon" onClick={(e) => { e.stopPropagation(); setFlipped(false); }}>↺</span>
                        </div>
                    </div>
                    <div className="mod-drops-list">
                        {(!item.drops || item.drops.length === 0) ? (
                            <div style={{padding:'20px', fontStyle:'italic', color:'#555', textAlign:'center', fontSize:'11px'}}>Source Unknown / Quest</div>
                        ) : (
                            item.drops.slice(0, 10).map((d, i) => (
                                <div key={i} className="drop-item">
                                    <div className="drop-name">
                                        <span style={{color:'#ccc'}}>{d.location}</span>
                                    </div>
                                    <div className="drop-meta">
                                        <span>{d.rotation ? `Rot ${d.rotation}` : ''}</span>
                                        <span style={{color: getRarityColor(d.rarity)}}>{(d.chance * 100).toFixed(2)}%</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="mod-wiki-link" onClick={(e) => e.stopPropagation()}>OPEN WIKI</a>
                </div>
            </div>
        </div>
    );
}

function getRarityColor(rarity) {
    switch(rarity) {
        case 'Rare': return '#d4af37';
        case 'Legendary': return '#b0c9ec';
        case 'Arcane': return '#00ffcc';
        case 'Uncommon': return '#c0c0c0';
        default: return '#fff';
    }
}