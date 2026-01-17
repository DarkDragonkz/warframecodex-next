"use client";
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { IMG_BASE_URL, API_BASE_URL } from '@/utils/constants';
import './WarframeDetailModal.css';

// LISTA ESTESA DI RISORSE DA NASCONDERE
const HIDDEN_RESOURCES = [
    // Risorse Comuni/Non Comuni/Rare
    'Orokin Cell', 'Argon Crystal', 'Neural Sensors', 'Neurodes', 
    'Plastids', 'Rubedo', 'Ferrite', 'Alloy Plate', 'Polymer Bundle', 
    'Circuits', 'Salvage', 'Morphics', 'Control Module', 'Gallium', 
    'Nitain Extract', 'Tellurium', 'Cryotic', 'Oxium', 'Nano Spores',
    'Detonite Ampule', 'Fieldron Sample', 'Mutagen Sample',
    
    // Clan Tech & Speciali
    'Detonite Injector', 'Fieldron', 'Mutagen Mass', 'Forma', 'Kuva',
    'Void Traces', 'Credits', 'Endo', 'Synthetic Eidolon Shard',
    
    // Open World (Piane/Vallis/Deimos)
    'Iradite', 'Grokdrul', 'Maprico', 'Nistlepod', 'Condroc Wing', 
    'Kuaka Spinal Claw', 'Breath of the Eidolon', 'Eidolon Shard', 'Cetus Wisp',
    'Gorgaricus Spore', 'Mytocardia Spore', 'Thermal Sludge', 'Tepa Nodule',
    'Hexenon', 'Carbides', 'Cubic Diodes', 'Pustrels', 'Copernics', 
    'Isos', 'Aucrux Capacitors', 'Komms', 'Nullstones'
];

const dropSearchCache = new Map();

function getDropSearchName(componentName, itemName) {
    if (!componentName) return null;
    let name = componentName;
    if (itemName) {
        name = name.replace(itemName, '');
    }
    name = name.replace(/Blueprint/gi, '').replace(/\s+/g, ' ').trim();
    if (!name || name.length < 3) return null;
    if (/^main$/i.test(name) || /main bp/i.test(name)) return null;
    return name;
}

export default function WarframeDetailModal({ item, onClose, ownedItems, onToggle }) {
    const [smartMissions, setSmartMissions] = useState([]);
    const [baseStrategies, setBaseStrategies] = useState([]); 
    const [lookupData, setLookupData] = useState(null); 
    const [savedPartMap, setSavedPartMap] = useState({});
    const [relicIds, setRelicIds] = useState(new Set());
    const [relicPartMap, setRelicPartMap] = useState({});
    const [selectedRelics, setSelectedRelics] = useState(new Set());
    const [loadingStrategies, setLoadingStrategies] = useState(false);
    const [statusMsg, setStatusMsg] = useState(""); 
    const [showVaultedRelics, setShowVaultedRelics] = useState(false);
    const [dropSearchMap, setDropSearchMap] = useState({});
    const autoShowVaultedRef = useRef(false);

    if (!item) return null;
    const isOwned = ownedItems.has(item.uniqueName);
    const isRelicItem = (item.category || "").includes('Relic') || (item.type || "").includes('Relic');
    const isPrime = item.name.includes("Prime");
    const relicIdList = Array.from(relicIds).filter(id => !id.startsWith("DIRECT:"));
    const hasRelicIds = relicIdList.length > 0;
    const allRelicVaulted = isPrime
        && lookupData
        && hasRelicIds
        && relicIdList.every(id => {
            if (lookupData._vaulted && Object.prototype.hasOwnProperty.call(lookupData._vaulted, id)) {
                return lookupData._vaulted[id];
            }
            return !lookupData[id];
        });
    
    // Logica Vaulted
    const jsonVaulted = !!item.vaulted;
    const computedVaulted = !isRelicItem && !loadingStrategies && smartMissions.length === 0 && baseStrategies.length === 0;
    const isVaulted = jsonVaulted || (isPrime && (allRelicVaulted || computedVaulted)); 

    const wikiUrl = `https://warframe.fandom.com/wiki/${item.name.replace(/ /g, '_')}`;

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        setSelectedRelics(new Set()); 
        setShowVaultedRelics(false);
        autoShowVaultedRef.current = false;
        
        if (!isRelicItem && (item.components || item.drops)) {
            fetchFarmingData();
        } else {
            setLoadingStrategies(false);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, item]);

    useEffect(() => {
        if (allRelicVaulted && !autoShowVaultedRef.current) {
            setShowVaultedRelics(true);
            autoShowVaultedRef.current = true;
        }
    }, [allRelicVaulted]);

    useEffect(() => {
        if (isPrime || isRelicItem) return;
        if (!item || !item.components) return;
        let cancelled = false;

        const names = item.components
            .map(c => getDropSearchName(c.name, item.name))
            .filter(Boolean);
        const unique = Array.from(new Set(names));

        if (unique.length === 0) return;

        (async () => {
            const results = {};
            for (const name of unique) {
                const key = name.toLowerCase();
                if (dropSearchCache.has(key)) {
                    results[key] = dropSearchCache.get(key);
                    continue;
                }
                try {
                    const res = await fetch(`https://api.warframestat.us/drops/search/${encodeURIComponent(name)}`);
                    if (!res.ok) continue;
                    const data = await res.json();
                    dropSearchCache.set(key, data);
                    results[key] = data;
                } catch (e) {
                    // Ignore network errors for optional drop lookup
                }
            }
            if (!cancelled && Object.keys(results).length > 0) {
                setDropSearchMap(prev => ({ ...prev, ...results }));
            }
        })();

        return () => { cancelled = true; };
    }, [item, isPrime, isRelicItem]);

    useEffect(() => {
        if (!lookupData || relicIds.size === 0) return;
        const idsToUse = selectedRelics.size > 0 ? selectedRelics : relicIds;
        setSmartMissions(calculateMissionsStrategy(idsToUse, lookupData, relicPartMap));
    }, [selectedRelics, lookupData, relicIds, relicPartMap]);

    // --- UTILS ---
    function formatCredits(value) {
        if (typeof value !== 'number' || Number.isNaN(value)) return null;
        return value.toLocaleString('en-US');
    }

    function formatDuration(totalSeconds) {
        if (typeof totalSeconds !== 'number' || totalSeconds <= 0) return null;
        let seconds = totalSeconds;
        const days = Math.floor(seconds / 86400);
        seconds -= days * 86400;
        const hours = Math.floor(seconds / 3600);
        seconds -= hours * 3600;
        const minutes = Math.floor(seconds / 60);
        const parts = [];
        if (days) parts.push(`${days}d`);
        if (hours) parts.push(`${hours}h`);
        if (!days && minutes) parts.push(`${minutes}m`);
        return parts.join(' ');
    }

    function getBlueprintSourceInfo(currentItem) {
        if (!currentItem) return null;
        if (currentItem.bpCost) {
            return `Market (Blueprint ${formatCredits(currentItem.bpCost)} credits)`;
        }
        if (currentItem.marketCost) {
            return `Market (Built ${formatCredits(currentItem.marketCost)} platinum)`;
        }
        return null;
    }

    function getBuildInfo(currentItem) {
        if (!currentItem) return [];
        const parts = [];
        if (currentItem.buildPrice) {
            parts.push(`Cost ${formatCredits(currentItem.buildPrice)} credits`);
        }
        if (currentItem.buildTime) {
            const duration = formatDuration(currentItem.buildTime);
            if (duration) parts.push(`Time ${duration}`);
        }
        if (currentItem.skipBuildTimePrice) {
            parts.push(`Rush ${currentItem.skipBuildTimePrice} platinum`);
        }
        return parts;
    }

    function extractResourceLocation(text) {
        if (!text) return null;
        const match = text.match(/Location:\s*([^\n]+)/i);
        return match ? match[1].trim() : null;
    }
    function getStandardID(name) {
        if (!name) return null;
        const match = name.toUpperCase().match(/(LITH|MESO|NEO|AXI|REQUIEM)\s+([A-Z0-9]+)/);
        if (match) return `${match[1]} ${match[2]}`;
        return null;
    }

    function getCleanPartName(fullComponentName) {
        if (!fullComponentName || fullComponentName === "MAIN BP") return "MAIN BP";
        const safeItemName = item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
        const nameRegex = new RegExp(safeItemName, "gi");
        let clean = fullComponentName.replace(nameRegex, "").replace(/Blueprint/gi, "").replace(/Relic/gi, "").trim();
        if (fullComponentName.match(/Chassis/i)) return "CHASSIS";
        if (fullComponentName.match(/Systems/i)) return "SYSTEMS";
        if (fullComponentName.match(/Neuroptics/i)) return "NEURO";
        if (fullComponentName.match(/Harness/i)) return "HARNESS";
        if (fullComponentName.match(/Wings/i)) return "WINGS";
        
        // Per le armi, puliamo nomi comuni
        if (fullComponentName.match(/Barrel/i)) return "BARREL";
        if (fullComponentName.match(/Receiver/i)) return "RECEIVER";
        if (fullComponentName.match(/Stock/i)) return "STOCK";
        if (fullComponentName.match(/Handle/i)) return "HANDLE";
        if (fullComponentName.match(/Blade/i)) return "BLADE";
        if (fullComponentName.match(/Grip/i)) return "GRIP";
        if (fullComponentName.match(/String/i)) return "STRING";
        if (fullComponentName.match(/Limb/i)) return "LIMB";
        
        if (!clean || clean.length < 2) return "MAIN BP";
        return clean.toUpperCase();
    }

    const handleRelicClick = (relicId) => {
        if (!relicId) return;
        const newSet = new Set(selectedRelics);
        if (newSet.has(relicId)) newSet.delete(relicId);
        else newSet.add(relicId);
        setSelectedRelics(newSet);
    };

    // --- CALCOLATORE STRATEGIA ---
    function calculateMissionsStrategy(relicIdsSet, dbData, partMap) {
        const missionMap = new Map();
        relicIdsSet.forEach(relicID => {
            if (relicID.startsWith("DIRECT:")) return; 
            const relicInfo = dbData ? dbData[relicID] : null; 
            const missions = relicInfo ? (Array.isArray(relicInfo) ? relicInfo : relicInfo.drops) : [];
            const partName = partMap[relicID] || "PART";
            if (missions) {
                missions.forEach(mission => {
                    const key = mission.node;
                    if (!missionMap.has(key)) missionMap.set(key, { missionName: key, totalScore: 0, relicsFound: [] });
                    const entry = missionMap.get(key);
                    let relicEntry = entry.relicsFound.find(r => r.id === relicID);
                    if (!relicEntry) {
                        relicEntry = { id: relicID, part: partName, drops: [], maxChance: 0 };
                        entry.relicsFound.push(relicEntry);
                    }
                    const dropExists = relicEntry.drops.some(d => d.rot === mission.rot);
                    if (!dropExists) {
                        relicEntry.drops.push({ rot: mission.rot, chance: mission.chance });
                        if (mission.chance > relicEntry.maxChance) relicEntry.maxChance = mission.chance;
                        entry.totalScore += mission.chance;
                    }
                });
            }
        });
        return Array.from(missionMap.values()).sort((a, b) => b.totalScore - a.totalScore).slice(0, 15);
    }

    function calculateBaseStrategy(relicIdsSet) {
        const componentMap = new Map();
        relicIdsSet.forEach(relicID => {
            if (relicID.startsWith("DIRECT:")) {
                const info = JSON.parse(relicID.substring(7)); 
                const part = info.part; 
                if (!componentMap.has(part)) componentMap.set(part, []);
                const list = componentMap.get(part);
                if (!list.some(m => m.loc === info.loc && m.rot === info.rarity)) {
                    list.push({ loc: info.loc, rot: info.rarity || "-", chance: info.chance || 0 });
                }
            }
        });
        const strategyObj = {};
        componentMap.forEach((missions, part) => {
            strategyObj[part] = missions.sort((a, b) => b.chance - a.chance).slice(0, 5);
        });
        return strategyObj;
    }

    async function fetchFarmingData() {
        setLoadingStrategies(true);
        setStatusMsg("Analyzing...");
        try {
            const neededIDs = new Set();
            const relicToPartMap = {}; 
            
            // Helper check risorsa
            const isHiddenResource = (name) => {
                const n = name.toLowerCase().trim();
                return HIDDEN_RESOURCES.some(h => {
                    const hLower = h.toLowerCase();
                    return n === hLower || n === hLower + 's'; // Controlla anche plurale
                });
            };

            const scan = (drops, partNameLabel) => {
                (drops || []).forEach(d => {
                    const id = getStandardID(d.location);
                    const cleanPart = getCleanPartName(partNameLabel);
                    if (id) { 
                        neededIDs.add(id); 
                        relicToPartMap[id] = cleanPart; 
                    } else {
                        const fakeID = `DIRECT:${JSON.stringify({ loc: d.location, part: cleanPart, chance: d.chance, rarity: d.rarity })}`;
                        neededIDs.add(fakeID);
                    }
                });
            };

            // SCAN COMPONENTI (Filtrando risorse)
            (item.components || []).forEach(c => { 
                if(!isHiddenResource(c.name)) {
                    scan(c.drops, c.name);
                }
            });
            scan(item.drops, "MAIN BP");
            setSavedPartMap(relicToPartMap);
            setRelicPartMap(relicToPartMap);

            if (neededIDs.size === 0) { 
                setLoadingStrategies(false);
                return; 
            }

            const [lookupRes, relicsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/RelicLookup.json`),
                fetch(`${API_BASE_URL}/Relics.json`)
            ]);
            
            let lookupDB = {}; 
            if (lookupRes.ok) lookupDB = await lookupRes.json();
            
            let imageMap = {};
            let vaultedMap = {};
            if (relicsRes.ok) {
                const relicsArr = await relicsRes.json();
                relicsArr.forEach(r => {
                    const stdName = getStandardID(r.name);
                    if (stdName && r.imageName) imageMap[stdName] = r.imageName;
                    if (stdName) vaultedMap[stdName] = !r.drops || r.drops.length === 0;
                });
            }
            lookupDB._images = imageMap;
            lookupDB._vaulted = vaultedMap;
            setLookupData(lookupDB); 

            setRelicIds(new Set(neededIDs));
            setSmartMissions(calculateMissionsStrategy(neededIDs, lookupDB, relicToPartMap));
            setBaseStrategies(calculateBaseStrategy(neededIDs));
        } catch (e) { 
            console.error(e); 
            setStatusMsg("N/A"); 
        } finally { 
            setLoadingStrategies(false);
        }
    }

    // --- RENDER HELPERS ---
    function formatDropsWithVaultCheck(drops) {
        if(!drops || drops.length === 0) return [];
        const unique = new Map();
        drops.forEach(d => {
            let loc = d.location;
            let isRelic = loc.toUpperCase().match(/(LITH|MESO|NEO|AXI|REQUIEM)\s+[A-Z0-9]+/);
            if(isRelic && loc.match(/(Radiant|Flawless|Exceptional)/i)) return; 
            if(isRelic) {
                let cleanLoc = loc.replace(' Relic', '').replace(' (Intact)', '').trim();
                let relicID = getStandardID(cleanLoc);
                let imagePath = null;
                let isVaultedRelic = false;
                
                if (lookupData && lookupData._images && lookupData._images[relicID]) {
                    imagePath = `${IMG_BASE_URL}/${lookupData._images[relicID]}`;
                } else {
                    imagePath = `${IMG_BASE_URL}/${cleanLoc.toLowerCase().replace(/ /g, '-')}-relic.png`;
                }
                if (lookupData && relicID) {
                    if (lookupData._vaulted && Object.prototype.hasOwnProperty.call(lookupData._vaulted, relicID)) {
                        isVaultedRelic = lookupData._vaulted[relicID];
                    } else if (!lookupData[relicID]) {
                        isVaultedRelic = true;
                    }
                }

                if(!unique.has(cleanLoc)) {
                    unique.set(cleanLoc, {
                        loc: cleanLoc, isRelic: true, imagePath, relicID, isVaultedRelic,
                        rarityClass: getRarityClass(d.rarity)
                    });
                }
            }
        });
        return Array.from(unique.values()).sort((a,b) => (a.isVaultedRelic === b.isVaultedRelic) ? 0 : a.isVaultedRelic ? 1 : -1);
    }

    // --- COSTRUZIONE LISTA COMPONENTI ---
    let fullComponentsList = [];
    if (!isRelicItem) {
        const foundBpComponent = (item.components || []).find(c => c.name.toLowerCase().includes('blueprint'));
        const mainBpDrops = foundBpComponent ? foundBpComponent.drops : (item.drops || []);
        fullComponentsList.push({
            uniqueName: item.uniqueName + "_BP",
            name: "MAIN BP",
            itemCount: 1,
            imageName: item.imageName,
            drops: mainBpDrops 
        });

        // FILTRO MIGLIORATO PER NASCONDERE RISORSE
        const subs = (item.components || []).filter(comp => {
            const nameLower = comp.name.toLowerCase().trim();
            const isResource = HIDDEN_RESOURCES.some(h => {
                const hLower = h.toLowerCase();
                return nameLower === hLower || nameLower === hLower + 's';
            });
            const isBp = nameLower.includes('blueprint');
            return !isResource && !isBp;
        });
        
        fullComponentsList = [...fullComponentsList, ...subs];
    }
    
    const sortedRewards = item.rewards ? [...item.rewards].sort((a, b) => (b.chance || 0) - (a.chance || 0)) : [];
    function getRarityClass(r) {
        if(!r) return ""; r = r.toLowerCase();
        if(r.includes('rare')) return "pct-rare";
        if(r.includes('uncommon')) return "pct-uncommon";
        return "pct-common";
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content-simple ${!isPrime && !isRelicItem ? 'base-mode' : 'prime-mode'}`} onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>

                <div className="modal-body">
                    {/* COLONNA 1: INFO */}
                    <div className="col-left">
                        <div className="modal-info-header">
                            <h2 className="modal-title">{item.name}</h2>
                            <div className="type-pill">{item.type}</div>
                            
                            {/* BADGE AVAILABLE/VAULTED */}
                            <div style={{marginTop:'10px'}}>
                                {isVaulted 
                                    ? <div className="vault-badge is-vaulted">VAULTED</div> 
                                    : <div className="vault-badge is-available">AVAILABLE</div>
                                }
                            </div>
                        </div>

                        <div className="det-img-box">
                            <Image 
                                src={`${IMG_BASE_URL}/${item.imageName}`} 
                                alt={item.name} 
                                fill
                                style={{objectFit:'contain'}}
                                unoptimized
                            />
                        </div>
                        
                        <div className="det-desc-container">
                            {item.description && <p className="warframe-description">{item.description}</p>}
                        </div>

                        <div className="det-actions">
                            <button onClick={() => onToggle(item.uniqueName)} className={`btn-toggle-large ${isOwned ? 'owned' : ''}`}>
                                {isOwned ? '✔ OWNED' : '+ ADD TO COLLECTION'}
                            </button>
                            <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="wiki-btn-block">WIKI PAGE</a>
                        </div>
                    </div>

                    {/* COLONNA 2: COMPONENTI */}
                    <div className="col-center" style={{flex: !isPrime && !isRelicItem ? 2 : 1}}>
                        <div className="col-header-sticky">
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <h3 className="section-title">{isRelicItem ? "REWARDS" : "COMPONENTS & ACQUISITION"}</h3>
                                {isPrime && !isRelicItem && (
                                    <button className={`vault-toggle ${showVaultedRelics ? 'active' : ''}`} onClick={() => setShowVaultedRelics(!showVaultedRelics)}>
                                        {showVaultedRelics ? 'HIDE VAULTED' : 'SHOW VAULTED'}
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className={`col-content-scroll ${(!isRelicItem && !isPrime) ? 'components-grid' : ''}`}>
                            {isRelicItem && (
                                <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                                    {sortedRewards.map((r, i) => (
                                        <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'10px', background:'#18181b', borderRadius:'4px', fontSize:'13px', border:'1px solid #333'}}>
                                            <span style={{color: '#ddd'}}>{r.itemName || r.item?.name}</span>
                                            <span style={{fontWeight:'bold', color:'var(--gold)'}}>{(r.chance*100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isRelicItem && fullComponentsList.map((comp, idx) => {
                                const cleanName = getCleanPartName(comp.name);
                                const partMissions = baseStrategies[cleanName] || [];
                                const compImage = comp.imageName || item.imageName;
                                const fallbackDrops = comp.drops || [];
                                const dropSearchName = getDropSearchName(comp.name, item.name);
                                const dropSearchKey = dropSearchName ? dropSearchName.toLowerCase() : null;
                                const dropSearch = dropSearchKey ? (dropSearchMap[dropSearchKey] || []) : [];
                                const isMainBlueprint = cleanName === "MAIN BP";
                                const blueprintSource = isMainBlueprint ? getBlueprintSourceInfo(item) : null;
                                const buildInfo = isMainBlueprint ? getBuildInfo(item) : [];
                                const resourceLocation = extractResourceLocation(comp.description);
                                const missionEntries = partMissions.length > 0
                                    ? partMissions.map(m => ({
                                        loc: m.loc,
                                        rot: `ROT ${m.rot || '-'}`,
                                        chance: `${(m.chance * 100).toFixed(1)}%`
                                    }))
                                    : fallbackDrops.length > 0
                                    ? fallbackDrops.map(d => ({
                                        loc: d.location || 'Unknown location',
                                        rot: (d.rotation || d.rarity || '-').toString(),
                                        chance: typeof d.chance === 'number' ? `${(d.chance * 100).toFixed(1)}%` : '-'
                                    }))
                                    : dropSearch.length > 0
                                    ? dropSearch.map(d => {
                                        const match = (d.place || '').match(/Rot\s+([A-C])/i);
                                        const rot = match ? match[1] : '-';
                                        const chance = typeof d.chance === 'number'
                                            ? (d.chance > 1 ? d.chance : d.chance * 100)
                                            : null;
                                        return {
                                            loc: `${d.place || 'Unknown'}${d.item ? ` - ${d.item}` : ''}`,
                                            rot: `ROT ${rot}`,
                                            chance: chance !== null ? `${chance.toFixed(1)}%` : '-'
                                        };
                                    })
                                    : resourceLocation
                                    ? [{
                                        loc: resourceLocation,
                                        rot: 'RESOURCE',
                                        chance: 'FARM'
                                    }]
                                    : [];
                                const maxEntries = 1;
                                const visibleEntries = missionEntries.slice(0, maxEntries);
                                
                                return (
                                    <div key={idx} className={`component-row ${!isPrime ? 'base-component-card' : ''}`}>
                                        {isPrime && (
                                            <div className="component-header">
                                                <div className="component-icon" style={{position:'relative', width:'24px', height:'24px'}}>
                                                    <Image 
                                                        src={`${IMG_BASE_URL}/${comp.imageName}`} 
                                                        alt="" 
                                                        fill
                                                        style={{objectFit:'contain', opacity: comp.name === "MAIN BP" ? 0.7 : 1}}
                                                        unoptimized
                                                    />
                                                </div>
                                                <div style={{flex:1, marginLeft:'10px'}}>
                                                    <strong style={{color:'#eee', fontSize:'13px', letterSpacing:'0.5px'}}>{cleanName}</strong>
                                                </div>
                                                <span className="count-badge">x{comp.itemCount}</span>
                                            </div>
                                        )}

                                        {/* SE È PRIME: MOSTRA LE RELIQUIE */}
                                        {isPrime && (
                                            <div className="relic-cards-grid relic-cards-scroll">
                                                {formatDropsWithVaultCheck(comp.drops)
                                                    .filter(d => showVaultedRelics || !d.isVaultedRelic)
                                                    .map((d, i) => {
                                                    const isSelected = d.relicID && selectedRelics.has(d.relicID);
                                                    return (
                                                        <div key={i} onClick={() => d.isRelic && handleRelicClick(d.relicID)}
                                                            className={`mini-relic-card ${d.rarityClass} ${isSelected ? 'selected' : ''} ${d.isVaultedRelic ? 'is-vaulted' : ''}`}
                                                        >
                                                            {d.imagePath && <img src={d.imagePath} className="relic-card-img" onError={(e)=>{e.target.style.display='none'}} />}
                                                            <div className="card-info">
                                                                <span className="card-era">{d.loc.split(' ')[0]}</span>
                                                                <span className="card-code">{d.loc.split(' ').slice(1).join(' ')}</span>
                                                                <span className="card-rarity-row">
                                                                     <span className={`card-pct ${d.rarityClass}`}></span>
                                                                     {d.isVaultedRelic && <span className="vaulted-mini-tag">V</span>}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* SE È BASE: MOSTRA TABELLA MISSIONI */}
                                        {!isPrime && (
                                            <div className="base-component-body">
                                                {compImage && (
                                                    <div className="base-component-image">
                                                        <img src={`${IMG_BASE_URL}/${compImage}`} alt={cleanName} />
                                                    </div>
                                                )}
                                                <div className="base-component-title">
                                                    <span className="base-component-name">{cleanName}</span>
                                                    <span className="base-component-count">x{comp.itemCount}</span>
                                                </div>
                                                {isMainBlueprint && (blueprintSource || buildInfo.length > 0) && (
                                                    <div className="bp-info-block">
                                                        {blueprintSource && (
                                                            <div className="bp-info-row">
                                                                <span className="bp-info-label">BLUEPRINT</span>
                                                                <span className="bp-info-value">{blueprintSource}</span>
                                                            </div>
                                                        )}
                                                        {buildInfo.map((entry, infoIdx) => (
                                                            <div key={infoIdx} className="bp-info-row">
                                                                <span className="bp-info-label">BUILD</span>
                                                                <span className="bp-info-value">{entry}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className={`mission-list ${missionEntries.length > maxEntries ? 'scrollable' : ''}`}>
                                                    {missionEntries.length > 0 ? (
                                                        missionEntries.map((entry, i) => (
                                                            <div key={i} className="mission-row">
                                                                <span className="mission-loc">{entry.loc}</span>
                                                                <div className="mission-meta">
                                                                    <span className="mission-rot">{entry.rot}</span>
                                                                    <span className="mission-chance">{entry.chance}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="mission-empty">No location data available.</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* COLONNA 3: STRATEGIA (solo Prime) */}
                    {isPrime && !isRelicItem && (
                        <div className="col-right">
                             <div className="col-header-sticky">
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                                    <h3 className="section-title" style={{color:'var(--gold)', margin:0}}>
                                        {loadingStrategies ? statusMsg : (selectedRelics.size > 0 ? `FILTERED FARMING` : "OPTIMAL LOCATIONS")}
                                    </h3>
                                    {selectedRelics.size > 0 && (
                                        <span style={{fontSize:'10px', color:'#666', cursor:'pointer', textDecoration:'underline'}} onClick={()=>setSelectedRelics(new Set())}>
                                            CLEAR FILTER
                                        </span>
                                    )}
                                </div>
                             </div>
                            
                            <div className="col-content-scroll strategy-container">
                                {smartMissions.length > 0 ? smartMissions.map((mission, idx) => (
                                    <div key={idx} className="mission-block">
                                        <div className="mission-block-header">
                                            <div className="mission-name-large">{mission.missionName}</div>
                                            {!selectedRelics.size && (
                                                <div style={{fontSize:'11px', color:'#fff', fontWeight:'bold', background:'rgba(255,255,255,0.1)', padding:'2px 6px', borderRadius:'3px'}}>
                                                    {(mission.totalScore*100).toFixed(0)}%
                                                </div>
                                            )}
                                        </div>
                                        <table className="mission-relics-table">
                                            <thead>
                                                <tr>
                                                    <th style={{width:'35%', textAlign:'left', paddingLeft:'10px'}}>RELIC</th>
                                                    <th style={{width:'25%', textAlign:'center'}}>PART</th>
                                                    <th style={{width:'15%', textAlign:'center'}}>ROT</th>
                                                    <th style={{width:'25%', textAlign:'right', paddingRight:'10px'}}>%</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {mission.relicsFound.sort((a,b)=>b.maxChance - a.maxChance).map((r, i) => (
                                                    <tr key={i}>
                                                        <td style={{color:'#ddd', fontWeight:'bold', paddingLeft:'10px'}}>{r.id}</td>
                                                        <td style={{textAlign:'center'}}><span className="part-badge">{r.part}</span></td>
                                                        <td style={{textAlign:'center', color:'var(--gold)'}}>{(r.drops||[]).map(d=>d.rot).join('|')}</td>
                                                        <td style={{textAlign:'right', color:'#aaa', paddingRight:'10px'}}>{(r.drops||[]).map(d=>(d.chance*100).toFixed(0)).join('|')}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )) : (
                                    <div style={{textAlign:'center', padding:'40px', color:'#555', fontStyle:'italic'}}>
                                        No farming data available (Vaulted).
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
