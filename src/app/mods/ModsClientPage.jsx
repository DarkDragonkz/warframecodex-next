"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { VirtuosoGrid } from 'react-virtuoso';
import { IMG_BASE_URL } from '@/utils/constants';
import { getBasePath } from '@/utils/basePath'; 
import '@/app/hud-layout.css'; 
import './mods.css';
import MobileBottomNav from '@/components/MobileBottomNav';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { UI_TEXT } from '@/utils/uiText';
import { BLUR_DATA_URL } from '@/utils/imagePlaceholders';
import useThrottledValue from '@/hooks/useThrottledValue';

const STORAGE_KEY = 'warframe_codex_mods_v1';

// --- CONFIGURAZIONE CATEGORIE (TYPE-BASED) ---
const MOD_TABS = [
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

const ARCANE_TABS = [
    { id: 'warframe', label: 'WARFRAME' },
    { id: 'primary', label: 'PRIMARY' },
    { id: 'archgun', label: 'ARCHGUN' },
    { id: 'secondary', label: 'SECONDARY' },
    { id: 'archgun-melee', label: 'ARCHGUN MELEE' },
    { id: 'kitgun', label: 'KITGUN' },
    { id: 'zaw', label: 'ZAW' },
    { id: 'operator', label: 'OPERATOR' },
    { id: 'amp', label: 'AMP' },
    { id: 'tektolyst', label: 'TEKTOLYST' },
    { id: 'artifact', label: 'ARTIFACT' }
];

const ARCANE_NAME_CATEGORIES = {
    'arcane acceleration': 'primary',
    'arcane momentum': 'primary',
    'arcane primary charger': 'primary',
    'arcane rage': 'primary',
    'arcane tempo': 'primary',
    'arcane awakening': 'secondary',
    'arcane pistoleer': 'secondary',
    'arcane velocity': 'secondary',
    'arcane precision': 'secondary',
    'arcane blade charger': 'archgun-melee',
    'arcane fury': 'archgun-melee',
    'arcane strike': 'archgun-melee',
    'arcane reaper': 'archgun-melee',
    'arcane tanker': 'archgun',
    'arcane power ramp': 'amp'
};

const ARCANE_RULES = [
    { id: 'primary', test: /\bprimary\b|\bprimaries\b|\brifle\b|\brifles\b|\bsniper\b|\bsnipers\b|\bshotgun\b|\bshotguns\b/i },
    { id: 'secondary', test: /\bsecondary\b|\bsecondaries\b|\bpistol\b|\bpistols\b/i },
    { id: 'secondary', test: /^cascadia\b/i },
    { id: 'archgun', test: /\barch[- ]?gun\b/i },
    { id: 'archgun-melee', test: /\barch[- ]?melee\b/i },
    { id: 'archgun-melee', test: /\bmelee\b/i },
    { id: 'kitgun', test: /\bkitgun\b/i },
    { id: 'kitgun', test: /^pax\b/i },
    { id: 'kitgun', test: /^residual\b/i },
    { id: 'zaw', test: /\bzaw\b/i },
    { id: 'zaw', test: /^exodia\b/i },
    { id: 'operator', test: /\boperator\b/i },
    { id: 'operator', test: /^magus\b/i },
    { id: 'amp', test: /\bamp\b|\bamps\b/i },
    { id: 'amp', test: /^virtuos\b/i },
    { id: 'amp', test: /^eternal\b/i },
    { id: 'tektolyst', test: /\btektolyst\b/i },
    { id: 'artifact', test: /\bartifact\b/i }
];

const getArcaneCategory = (item) => {
    const name = (item.name || '');
    const type = (item.type || '');
    const category = (item.category || '');
    const desc = Array.isArray(item.description) ? item.description.join(' ') : (item.description || '');
    const haystack = `${name} ${type} ${category} ${desc}`.toLowerCase();
    const nameLower = name.toLowerCase().trim();

    if (ARCANE_NAME_CATEGORIES[nameLower]) {
        return ARCANE_NAME_CATEGORIES[nameLower];
    }

    for (const rule of ARCANE_RULES) {
        if (rule.test.test(haystack) || rule.test.test(nameLower)) {
            return rule.id;
        }
    }

    if (type.toLowerCase().includes('warframe')) return 'warframe';
    if (type.toLowerCase().includes('arcane')) return 'warframe';
    return 'warframe';
};

export default function ModsClientPage({ initialData = [], mode = 'mods' }) {
    const [rawApiData, setRawApiData] = useState([]);
    const [ownedCards, setOwnedCards] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [scrollParent, setScrollParent] = useState(null);

    const isArcaneMode = mode === 'arcanes';
    const activeTabs = isArcaneMode ? ARCANE_TABS : MOD_TABS;
    const defaultCategory = isArcaneMode ? 'warframe' : 'all';
    const [currentCategory, setCurrentCategory] = useState(defaultCategory);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebouncedValue(searchTerm, 300);
    const throttledSearch = useThrottledValue(searchTerm, 200);
    const useThrottle = rawApiData.length > 4000;
    const searchValue = useThrottle ? throttledSearch : debouncedSearch;
    const [currentSort, setCurrentSort] = useState('name');
    const [showMissingOnly, setShowMissingOnly] = useState(false);

    useEffect(() => {
        const media = window.matchMedia('(max-width: 900px)');
        const update = () => setIsMobile(media.matches);
        update();
        if (media.addEventListener) media.addEventListener('change', update);
        else media.addListener(update);
        return () => {
            if (media.removeEventListener) media.removeEventListener('change', update);
            else media.removeListener(update);
        };
    }, []);

    useEffect(() => {
        setCurrentCategory(defaultCategory);
    }, [defaultCategory]);

    const scrollParentRef = useCallback((node) => {
        setScrollParent(node);
    }, []);

    // --- CARICAMENTO DATI ---
    useEffect(() => {
        if(initialData && initialData.length > 0) {
            const uniqueMap = new Map();
            
            initialData.forEach(item => {
                if (isArcaneMode && item.name && item.name.trim().toLowerCase() === 'arcane') return;
                // Filtri Pulizia
                if(item.name.includes("Riven Mod")) return;
                if(item.uniqueName && item.uniqueName.includes("/PVP")) return;
                if(item.type === "Fusion Core") return;
                if(item.type === "Mod Set Mod") return;
                if(item.type === "Focus Way") return;

                // MAPPING CATEGORIE (Basato su Type / Nome)
                let mappedCategory = 'other';
                const t = (item.type || "").toLowerCase();

                if (isArcaneMode) {
                    mappedCategory = getArcaneCategory(item);
                } else {
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
                }

                let cleanDesc = item.description || "";
                if (Array.isArray(item.description)) cleanDesc = item.description.join(" ");
                if (!cleanDesc && item.levelStats?.length > 0) {
                    cleanDesc = item.levelStats[item.levelStats.length - 1].stats.join(" ");
                }

                if(!uniqueMap.has(item.name)) {
                    const nameLower = (item.name || '').toLowerCase();
                    const typeLower = (item.type || '').toLowerCase();
                    const categoryLower = (item.category || '').toLowerCase();

                    uniqueMap.set(item.name, {
                        ...item,
                        myCategory: mappedCategory,
                        description: cleanDesc,
                        maxRank: item.fusionLimit || 5,
                        baseDrain: item.baseDrain || 2,
                        searchStr: `${nameLower} ${typeLower} ${categoryLower} ${mappedCategory}`.trim()
                    });
                }
            });

            const processed = Array.from(uniqueMap.values()).sort((a,b) => a.name.localeCompare(b.name));
            setRawApiData(processed);
            setLoading(false);
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) { try { setOwnedCards(new Set(JSON.parse(saved))); } catch (e) {} }
    }, [initialData, isArcaneMode]);

    useEffect(() => {
        if (loading) return undefined;
        const handler = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...ownedCards]));
        }, 800);
        return () => clearTimeout(handler);
    }, [ownedCards, loading]);

    // --- FILTRAGGIO ---
    const filteredData = useMemo(() => {
        return rawApiData.filter(item => {
            if (searchValue && !item.searchStr.includes(searchValue)) return false;
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
    }, [rawApiData, searchValue, currentCategory, currentSort, showMissingOnly, ownedCards]);

    const toggleOwned = useCallback((id) => {
        setOwnedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
            return newSet;
        });
    }, []);

    const pct = rawApiData.length > 0 ? Math.round((ownedCards.size / rawApiData.length) * 100) : 0;

    if (loading) return <div className="loading-screen">{UI_TEXT.loadingMods}</div>;

    const gridStyle = isMobile ? { width: '100%' } : { height: '100%', width: '100%' };
    const overscan = isMobile ? 120 : 300;

    return (
        <div className={`codex-layout ${isMobile ? 'mobile-mode' : ''}`}>
            <div className="codex-scroll" ref={scrollParentRef}>
            {/* Header Group: Stessa struttura delle altre pagine */}
            <div className="header-group">
                <div className="nav-top-row">
                    <div className="nav-brand">
                        <Link href="/" className="nav-home-btn">⌂ HOME</Link>
                        <h1 className="page-title">{isArcaneMode ? 'ARCANES DATABASE' : 'MODS DATABASE'}</h1>
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
                    <div className="filters-left filters-scroll">
                        <div className="category-tabs">
                            {activeTabs.map(tab => (
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
                                type="text" className="search-input" placeholder={isArcaneMode ? 'SEARCH ARCANE...' : 'SEARCH MOD...'} 
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toLowerCase())} 
                            />
                        </div>

                        <select 
                            className="search-input select-compact" 
                            value={currentSort}
                            onChange={(e) => setCurrentSort(e.target.value)}
                        >
                            <option value="name">NAME</option>
                            <option value="rarity">RARITY</option>
                            <option value="drain">COST</option>
                        </select>

                                                <label className={`toggle-filter ${showMissingOnly ? 'active' : ''}`}>
                            <input type="checkbox" style={{display:'none'}} checked={showMissingOnly} onChange={(e) => setShowMissingOnly(e.target.checked)} />
                            <div className="checkbox-custom">{showMissingOnly && 'V'}</div>
                            SHOW MISSING
                        </label>
                    </div>
                </div>
                <div className="progress-line-container"><div className="progress-line-fill" style={{width: `${pct}%`}}></div></div>
            </div>

            <div className="gallery-scroll-area">
                <VirtuosoGrid
                    style={gridStyle}
                    totalCount={filteredData.length}
                    overscan={overscan}
                    customScrollParent={isMobile ? (scrollParent || undefined) : undefined}
                    components={{
                        List: (props) => <div {...props} className="card-gallery" />,
                        Item: (props) => <div {...props} className="card-item" />
                    }}
                    itemContent={(index) => {
                        const item = filteredData[index];
                        return (
                            <div className="mod-card-item">
                                <ModCard 
                                    item={item} 
                                    isOwned={ownedCards.has(item.uniqueName)} 
                                    onToggleOwned={toggleOwned}
                                />
                            </div>
                        );
                    }}
                />
            </div>
            </div>

            <MobileBottomNav />
        </div>
    );
}

// --- CARD COMPONENT ---
const ModCard = React.memo(function ModCard({ item, isOwned, onToggleOwned }) {
    const [flipped, setFlipped] = useState(false);
    const maxRank = item.maxRank || 0;
    const [rank, setRank] = useState(0); 
    const handleToggle = useCallback((e) => {
        e.stopPropagation();
        onToggleOwned(item.uniqueName);
    }, [item.uniqueName, onToggleOwned]);

    const increaseRank = (e) => { e.stopPropagation(); setRank(Math.min(maxRank, rank + 1)); };
    const decreaseRank = (e) => { e.stopPropagation(); setRank(Math.max(0, rank - 1)); };

    const renderDescription = () => {
        if (!item.description) return "No description.";

        const numberRegex = /(\d+(\.\d+)?)/g;
        const lines = item.description.split(/\r\n|\n/);

        return lines.map((line, lineIndex) => {
            const parts = [];
            let lastIndex = 0;
            let match;

            while ((match = numberRegex.exec(line)) !== null) {
                const raw = match[0];
                const start = match.index;
                const end = start + raw.length;

                if (start > lastIndex) {
                    parts.push(line.slice(lastIndex, start));
                }

                const val = parseFloat(raw);
                let next = raw;
                if (!isNaN(val) && val <= 1000 && maxRank >= 0) {
                    const scaled = (val / (maxRank + 1)) * (rank + 1);
                    if (isFinite(scaled)) {
                        next = Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1).replace(/\.0$/, '');
                    }
                }
                parts.push(<strong key={`num-${lineIndex}-${start}`}>{next}</strong>);
                lastIndex = end;
            }

            if (lastIndex < line.length) {
                parts.push(line.slice(lastIndex));
            }

            return (
                <React.Fragment key={`line-${lineIndex}`}>
                    {parts}
                    {lineIndex < lines.length - 1 && <br />}
                </React.Fragment>
            );
        });
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
                             <Image
                                 src={imageUrl}
                                 alt={item.name}
                                 fill
                                 className="mod-img"
                                 loading="lazy"
                                 placeholder="blur"
                                 blurDataURL={BLUR_DATA_URL}
                                 unoptimized
                             />
                        ) : (
                            <div className="no-image-placeholder">NO IMAGE</div>
                        )}
                    </div>
                    <div className="mod-top-bar">
                        <div className={`mod-status-btn ${isOwned ? 'owned' : ''}`} onClick={handleToggle}>
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
                        <div className="mod-desc-text">{renderDescription()}</div>
                        
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
});

function getRarityColor(rarity) {
    switch(rarity) {
        case 'Rare': return '#d4af37';
        case 'Legendary': return '#b0c9ec';
        case 'Arcane': return '#00ffcc';
        case 'Uncommon': return '#c0c0c0';
        default: return '#fff';
    }
}
