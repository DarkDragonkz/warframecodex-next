"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
// IMPORTANTE: Link per il routing corretto su GitHub
import Link from 'next/link';
import { API_BASE_URL, IMG_BASE_URL } from '@/utils/constants';
import '@/app/hud-layout.css'; 
import './mods.css';

const STORAGE_KEY = 'warframe_codex_mods_v1';

export default function ModsPage() {
    const router = useRouter();
    const [rawApiData, setRawApiData] = useState([]);
    const [ownedCards, setOwnedCards] = useState(new Set());
    const [loading, setLoading] = useState(true);
    
    // Filtri
    const [currentCategory, setCurrentCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentSort, setCurrentSort] = useState('name');
    const [showMissingOnly, setShowMissingOnly] = useState(false);

    // Infinite Scroll
    const [visibleCount, setVisibleCount] = useState(60);
    
    // --- 1. CARICAMENTO DATI ---
    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            setLoading(true);
            try {
                const [modsRes, arcanesRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/Mods.json`),
                    fetch(`${API_BASE_URL}/Arcanes.json`)
                ]);
                
                if (!isMounted) return;
                if (!modsRes.ok || !arcanesRes.ok) throw new Error("API Error");

                const modsData = await modsRes.json();
                const arcanesData = await arcanesRes.json();
                const combined = [...modsData, ...arcanesData];

                const processed = [];
                const ids = new Set();

                combined.forEach(item => {
                    if (!item.imageName || item.name.includes("Riven") || (item.uniqueName && item.uniqueName.includes("/PVP"))) return;
                    if (item.uniqueName && item.uniqueName.toLowerCase().includes("setmod")) return; 
                    if (ids.has(item.name)) return; 
                    
                    ids.add(item.name);
                    
                    const dropLocs = item.drops ? item.drops.map(d => d.location).join(" ") : "";
                    item.searchString = `${item.name} ${item.type} ${item.category || ""} ${dropLocs}`.toLowerCase();
                    
                    item.maxRank = (typeof item.fusionLimit === 'number') ? item.fusionLimit : 5;
                    
                    processed.push(item);
                });

                processed.sort((a, b) => a.name.localeCompare(b.name));
                setRawApiData(processed);
                
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    try { setOwnedCards(new Set(JSON.parse(saved))); } catch (e) { console.error(e); }
                }

            } catch (e) { console.error("Error loading mods:", e); } 
            finally { if (isMounted) setLoading(false); }
        }
        loadData();
        return () => { isMounted = false; };
    }, []);

    // 2. Salvataggio
    useEffect(() => {
        if (!loading && typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...ownedCards]));
        }
    }, [ownedCards, loading]);

    // 3. Filtri
    const filteredData = useMemo(() => {
        let data = rawApiData.filter(item => {
            if (searchTerm && !item.searchString.includes(searchTerm)) return false;
            if (showMissingOnly && ownedCards.has(item.uniqueName)) return false;
            
            const t = (item.type || "").toLowerCase();
            const slot = (item.slot || "").toLowerCase();
            const cat = (item.category || "").toLowerCase();
            const isAugment = item.isAugment || item.name.includes("Augment");
            const isAura = t.includes("aura") || slot === "aura";
            const isArcane = cat.includes("arcane") || t.includes("arcane");

            switch (currentCategory) {
                case 'all': return true;
                case 'warframe': return t.includes("warframe") && !isAura && !isAugment && !isArcane;
                case 'aura': return isAura;
                case 'augment': return isAugment;
                case 'arcane': return isArcane;
                case 'primary': return (t.includes("rifle") || t.includes("bow") || t.includes("shotgun") || t.includes("sniper")) && !isAugment;
                case 'secondary': return (t.includes("pistol") || t.includes("secondary")) && !isAugment;
                case 'melee': return (t.includes("melee")) && !isAugment;
                case 'exilus': return item.isExilus || slot === "exilus";
                case 'companion': return t.includes("companion") || t.includes("sentinel") || t.includes("beast");
                case 'archwing': return t.includes("archwing") || t.includes("arch-gun");
                default: return true;
            }
        });

        const rarityMap = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Legendary': 4 };
        data.sort((a, b) => {
            if (currentSort === 'name') return a.name.localeCompare(b.name);
            if (currentSort === 'drain') return (b.baseDrain || 0) - (a.baseDrain || 0);
            if (currentSort === 'rarity') {
                const rA = rarityMap[a.rarity] || 0;
                const rB = rarityMap[b.rarity] || 0;
                if (rA !== rB) return rB - rA;
                return a.name.localeCompare(b.name);
            }
            if (currentSort === 'chance') {
                const maxA = a.drops && a.drops.length ? Math.max(...a.drops.map(d=>d.chance)) : 0;
                const maxB = b.drops && b.drops.length ? Math.max(...b.drops.map(d=>d.chance)) : 0;
                return maxA - maxB;
            }
            return 0;
        });

        return data;
    }, [rawApiData, currentCategory, searchTerm, currentSort, showMissingOnly, ownedCards]);

    const toggleOwned = (id) => {
        const newSet = new Set(ownedCards);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setOwnedCards(newSet);
    };

    const pct = rawApiData.length > 0 ? Math.round((ownedCards.size / rawApiData.length) * 100) : 0;

    return (
        <div className="codex-layout">
            <div className="header-group">
                <div className="nav-top-row">
                    <div className="nav-brand">
                        {/* FIX: Link gestisce il basePath automaticamente */}
                        <Link href="/" className="nav-home-btn">⌂ HOME</Link>
                        <h1 className="page-title">MODS & ARCANES</h1>
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
                    <div className="filters-left" style={{overflowX:'auto', maxWidth:'60%'}}>
                        <div className="category-tabs" style={{flexWrap:'nowrap'}}>
                            {['all','warframe','aura','augment','arcane','primary','secondary','melee','exilus','companion','archwing'].map(cat => (
                                <button 
                                    key={cat}
                                    className={`tab-btn ${currentCategory === cat ? 'active' : ''}`}
                                    onClick={() => { setCurrentCategory(cat); setVisibleCount(60); }}
                                >
                                    {cat.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="filters-right">
                        <div className="legend-box">
                            <div className="legend-item"><span className="dot-leg mission"></span>MISSION</div>
                            <div className="legend-item"><span className="dot-leg enemy"></span>ENEMY</div>
                            <div className="legend-item"><span className="dot-leg shop"></span>SHOP</div>
                        </div>

                        <div className="search-wrapper">
                            <input 
                                type="text" className="search-input" placeholder="SEARCH..." 
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
                            <option value="chance">DROP %</option>
                        </select>

                        <label className="toggle-filter">
                            <input type="checkbox" style={{display:'none'}} checked={showMissingOnly} onChange={(e) => setShowMissingOnly(e.target.checked)} />
                            <div className="checkbox-custom">{showMissingOnly && '✓'}</div>
                            MISSING
                        </label>
                    </div>
                </div>
                <div className="progress-line-container"><div className="progress-line-fill" style={{width: `${pct}%`}}></div></div>
            </div>

            <div 
                className="gallery-scroll-area" 
                onScroll={(e) => {
                    if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 500) setVisibleCount(p => p + 60);
                }}
            >
                {loading ? (
                    <div style={{color:'#fff', padding:'50px', textAlign:'center'}}>INITIALIZING ORDIS DATABASE...</div>
                ) : (
                    <div className="card-gallery">
                        {filteredData.slice(0, visibleCount).map(item => (
                            <ModCard 
                                key={item.uniqueName} 
                                item={item} 
                                isOwned={ownedCards.has(item.uniqueName)} 
                                onToggle={() => toggleOwned(item.uniqueName)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// --- MOD CARD COMPONENT ---
function ModCard({ item, isOwned, onToggle }) {
    const [flipped, setFlipped] = useState(false);
    const [rank, setRank] = useState(0);
    const maxRank = item.maxRank || 0; 

    const getDescription = () => {
        let desc = item.description || "";
        if (item.levelStats && item.levelStats.length > 0) {
            const statIndex = Math.min(rank, item.levelStats.length - 1);
            return item.levelStats[statIndex].stats.join('<br>');
        }
        return desc.replace(/(\d+(\.\d+)?)/g, (match) => {
            const maxVal = parseFloat(match);
            const baseVal = maxVal / (maxRank + 1);
            const currentVal = baseVal * (rank + 1);
            return currentVal % 1 === 0 ? currentVal.toFixed(0) : currentVal.toFixed(1).replace(/\.0$/, '');
        }).replace(/\r\n|\n/g, "<br>");
    };

    const currentDrain = (item.baseDrain || 0) + rank;
    const imgUrl = `${IMG_BASE_URL}/${item.imageName}`;
    
    const rarity = item.rarity || "Common";
    let nameColor = '#fff';
    if (rarity === 'Rare') nameColor = '#f0e68c';
    if (rarity === 'Legendary') nameColor = '#b0c9ec';
    if (item.category === 'Arcanes') nameColor = '#00ffcc';

    const openWiki = (e) => {
        e.stopPropagation();
        const safeName = item.name.replace(/ /g, '_');
        window.open(`https://warframe.fandom.com/wiki/${safeName}`, '_blank');
    };

    const renderDrops = () => {
        if (!item.drops || item.drops.length === 0) return <div className="mod-no-drop">Source Unknown / Quest / Market</div>;
        
        const getDropType = (d) => d.location.includes("Rot") || d.type?.includes("Mission") ? 'mission' : 'enemy';

        return item.drops.slice(0, 8).map((d, i) => {
            const type = getDropType(d);
            const barColor = type === 'mission' ? 'var(--mission)' : 'var(--enemy)';
            
            return (
                <div key={i} className="mod-drop-row">
                    <div className="mod-drop-header">
                        <span className="mod-drop-loc">
                            <span className={`dot-leg ${type}`} style={{display:'inline-block', marginRight:'5px'}}></span>
                            {d.location}
                        </span>
                        <span className="mod-drop-pct">{(d.chance * 100).toFixed(2)}%</span>
                    </div>
                    <div className="mod-drop-bar-bg">
                        <div className="mod-drop-bar-fill" style={{width:`${Math.min(100, d.chance * 100 * 4)}%`, background: barColor}}></div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div 
            className={`mod-card-wrapper ${isOwned ? 'owned' : ''} ${flipped ? 'flipped' : ''}`}
            data-rarity={rarity}
            onClick={() => setFlipped(!flipped)}
        >
            <div className="mod-card-inner">
                {/* FRONT */}
                <div className="mod-card-front">
                    <div className="mod-owned-check" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
                        {isOwned ? '✔' : '+'}
                    </div>
                    <div className="mod-drain-box">
                        {currentDrain} {item.polarity && <span style={{fontSize:'10px'}}>{item.polarity.substring(0,1)}</span>}
                    </div>
                    
                    <div className="mod-card-img-container">
                        <img 
                            src={imgUrl} 
                            className="mod-card-img" 
                            alt={item.name} 
                            loading="lazy" 
                            onError={(e)=>{e.target.style.display='none';}} 
                        />
                    </div>

                    <div className="mod-info-area">
                        <div className="mod-type-pill">{item.type}</div>
                        <div className="mod-name" style={{color: nameColor}}>{item.name}</div>
                        <div className="mod-desc" dangerouslySetInnerHTML={{__html: getDescription()}}></div>

                        {maxRank > 0 && (
                            <div className="mod-rank-controls" onClick={(e) => e.stopPropagation()}>
                                <button className="mod-rank-btn" onClick={() => setRank(Math.max(0, rank - 1))}>-</button>
                                <div className="mod-ranks-dots">
                                    {Array.from({length: maxRank + 1}).map((_, i) => (
                                        <div key={i} className={`mod-dot ${i <= rank && i > 0 ? 'active' : ''}`}></div>
                                    ))}
                                </div>
                                <button className="mod-rank-btn" onClick={() => setRank(Math.min(maxRank, rank + 1))}>+</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* BACK */}
                <div className="mod-card-back">
                    <div className="mod-back-header">
                        <div className="mod-back-title">ACQUISITION</div>
                        {item.tradable && <span className="mod-trade-badge">TRADE</span>}
                    </div>
                    <div className="mod-source-content">
                        {renderDrops()}
                    </div>
                    <div className="mod-wiki-btn" onClick={openWiki}>
                        OPEN WIKI
                    </div>
                </div>
            </div>
        </div>
    );
}