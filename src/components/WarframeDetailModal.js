"use client";
import React, { useEffect, useState } from 'react';
import { IMG_BASE_URL, API_BASE_URL } from '@/utils/constants';
import './WarframeDetailModal.css';

const HIDDEN_RESOURCES = [
    'Orokin Cell', 'Argon Crystal', 'Neural Sensors', 'Neurodes', 
    'Plastids', 'Rubedo', 'Ferrite', 'Alloy Plate', 'Polymer Bundle', 
    'Circuits', 'Salvage', 'Morphics', 'Control Module', 'Gallium', 
    'Nitain Extract', 'Tellurium', 'Cryotic', 'Oxium'
];

export default function WarframeDetailModal({ item, onClose, ownedItems, onToggle }) {
    const [smartMissions, setSmartMissions] = useState([]);
    const [lookupData, setLookupData] = useState(null); 
    const [savedPartMap, setSavedPartMap] = useState({});
    
    const [selectedRelics, setSelectedRelics] = useState(new Set());
    const [loadingStrategies, setLoadingStrategies] = useState(false);
    const [statusMsg, setStatusMsg] = useState(""); 

    if (!item) return null;

    const isOwned = ownedItems.has(item.uniqueName);
    const isRelicItem = (item.category || "").includes('Relic') || (item.type || "").includes('Relic');
    const mainDropsEmpty = !item.drops || item.drops.length === 0;
    const isVaulted = item.vaulted || (isRelicItem && mainDropsEmpty);
    const wikiUrl = `https://warframe.fandom.com/wiki/${item.name.replace(/ /g, '_')}`;

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        setSelectedRelics(new Set()); 
        
        if (!isRelicItem && (item.components || item.drops)) {
            fetchFarmingData();
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, item]);

    // --- UTILS ---
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
        if (!clean || clean.length < 2) return "MAIN BP";
        return clean.toUpperCase();
    }

    // --- HANDLER SELEZIONE ---
    const handleRelicClick = (relicId) => {
        if (!relicId) return;
        const newSet = new Set(selectedRelics);
        if (newSet.has(relicId)) {
            newSet.delete(relicId);
        } else {
            newSet.add(relicId);
        }
        setSelectedRelics(newSet);
    };

    const displayedMissions = (selectedRelics.size > 0 && lookupData) 
        ? calculateMissionsStrategy(selectedRelics, lookupData, savedPartMap)
        : smartMissions;

    function calculateMissionsStrategy(relicIdsSet, dbData, partMap) {
        const missionMap = new Map();

        relicIdsSet.forEach(relicID => {
            // lookupData qui è un oggetto dove le chiavi sono "LITH G1", ecc.
            // Se la struttura è diversa (array), va adattata. 
            // Assumo che RelicLookup.json sia { "LITH G1": [...missions], ... } o simile.
            // Se invece contiene anche info sull'immagine, possiamo usarlo.
            
            const relicInfo = dbData[relicID]; 
            // NOTA: Se dbData contiene solo missioni, non abbiamo l'immagine qui.
            // Ma stiamo usando dbData per le missioni, non per l'immagine nella card (quella la facciamo in formatDrops)

            const missions = relicInfo ? (Array.isArray(relicInfo) ? relicInfo : relicInfo.drops) : [];
            const partName = partMap[relicID] || "PART";

            if (missions) {
                missions.forEach(mission => {
                    const key = mission.node;
                    if (!missionMap.has(key)) {
                        missionMap.set(key, { missionName: key, totalScore: 0, relicsFound: [] });
                    }
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

        return Array.from(missionMap.values())
            .sort((a, b) => {
                const uniquePartsA = new Set(a.relicsFound.map(r => r.part)).size;
                const uniquePartsB = new Set(b.relicsFound.map(r => r.part)).size;
                if (uniquePartsB !== uniquePartsA) return uniquePartsB - uniquePartsA;
                return b.totalScore - a.totalScore;
            })
            .slice(0, 15);
    }

    async function fetchFarmingData() {
        setLoadingStrategies(true);
        setStatusMsg("Analyzing...");
        try {
            const neededIDs = new Set();
            const relicToPartMap = {}; 
            const scan = (drops, partNameLabel) => {
                (drops || []).forEach(d => {
                    const id = getStandardID(d.location);
                    if (id) { neededIDs.add(id); relicToPartMap[id] = getCleanPartName(partNameLabel); }
                });
            };
            (item.components || []).forEach(c => { if(!HIDDEN_RESOURCES.includes(c.name)) scan(c.drops, c.name); });
            scan(item.drops, "MAIN BP");

            setSavedPartMap(relicToPartMap);

            if (neededIDs.size === 0) { setLoadingStrategies(false); return; }

            // Carichiamo DUE file:
            // 1. RelicLookup.json per le missioni (già fatto)
            // 2. Relics.json (NUOVO) per avere le immagini corrette!
            
            const [lookupRes, relicsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/RelicLookup.json`),
                fetch(`${API_BASE_URL}/Relics.json`)
            ]);

            if (!lookupRes.ok) throw new Error("Missing Lookup DB");
            const lookupDB = await lookupRes.json();
            
            // Creiamo una mappa rapida per le immagini dalle Reliquie complete
            let imageMap = {};
            if (relicsRes.ok) {
                const relicsArr = await relicsRes.json();
                relicsArr.forEach(r => {
                    // Normalizziamo il nome per matchare "LITH G1"
                    const stdName = getStandardID(r.name);
                    if (stdName && r.imageName) {
                        imageMap[stdName] = r.imageName;
                    }
                });
            }

            // Uniamo i dati: salviamo le missioni E la mappa immagini nello state
            // Possiamo "sporcare" lookupData aggiungendo una proprietà speciale _images
            lookupDB._images = imageMap;
            
            setLookupData(lookupDB); 

            const initialStrategies = calculateMissionsStrategy(neededIDs, lookupDB, relicToPartMap);
            setSmartMissions(initialStrategies);

        } catch (e) { console.error(e); setStatusMsg("N/A"); } finally { setLoadingStrategies(false); }
    }

    // --- LOGICA FORMATTAZIONE COMPONENTI E VAULT STATUS ---
    function formatDropsWithVaultCheck(drops) {
        if(!drops || drops.length === 0) return [];
        const unique = new Map();
        
        drops.forEach(d => {
            let locRaw = d.location || "";
            let isRelic = locRaw.toUpperCase().match(/(LITH|MESO|NEO|AXI|REQUIEM)\s+[A-Z0-9]+/);
            if (isRelic && locRaw.match(/(Radiant|Flawless|Exceptional)/i)) return;
            
            let loc = locRaw.replace(' Relic', '').replace(' (Intact)', '').trim();
            let imagePath = null;
            let relicID = null;
            let isVaultedRelic = false;

            if (isRelic) {
                relicID = getStandardID(loc);
                
                // 1. TENTA DI RECUPERARE L'IMMAGINE DAL DB CARICATO (Metodo Affidabile)
                if (lookupData && lookupData._images && lookupData._images[relicID]) {
                    imagePath = `${IMG_BASE_URL}/${lookupData._images[relicID]}`;
                } else {
                    // 2. FALLBACK: Tenta lo slug (Metodo "Indovina", spesso errato ma meglio di niente)
                    const slug = loc.toLowerCase().replace(/ /g, '-') + '-relic.png';
                    imagePath = `${IMG_BASE_URL}/${slug}`;
                }
                
                // CHECK VAULT: Se il DB è caricato e l'ID non c'è, è Vaulted
                // Nota: lookupData._images non conta per il vault, controlliamo le missioni
                if (lookupData && relicID && !lookupData[relicID]) {
                    isVaultedRelic = true;
                }
            }

            if(!unique.has(loc)) {
                unique.set(loc, {
                    loc, isRelic, imagePath, relicID, isVaultedRelic,
                    pct: isRelic ? getIntactChance(d.rarity) : (d.chance ? `${(d.chance*100).toFixed(0)}%` : "-"),
                    rarityClass: getRarityClass(d.rarity), // Classe CSS per colore %
                    chance: d.chance || 0
                });
            }
        });

        // ORDINAMENTO: Prima le disponibili, poi le vaulted, poi per chance
        return Array.from(unique.values()).sort((a, b) => {
            if (a.isVaultedRelic !== b.isVaultedRelic) return a.isVaultedRelic ? 1 : -1; // False (Available) first
            return b.chance - a.chance;
        });
    }

    const sortedRewards = item.rewards ? [...item.rewards].sort((a, b) => (b.chance || 0) - (a.chance || 0)) : [];
    const filteredComponents = (item.components || []).filter(comp => !HIDDEN_RESOURCES.includes(comp.name));
    const hasComponents = filteredComponents.length > 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-simple" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>

                <div className="modal-header-row">
                    <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                        <h2 className="modal-title">{item.name}</h2>
                        <div className="type-pill">{item.type}</div>
                    </div>
                    {isVaulted ? <div className="vault-badge is-vaulted">VAULTED</div> : <div className="vault-badge is-available">AVAILABLE</div>}
                </div>

                <div className="modal-body">
                    <div className="col-left">
                        <div style={{width:'100%', display:'flex', justifyContent:'center', marginBottom:'20px'}}>
                            <img src={`${IMG_BASE_URL}/${item.imageName}`} alt={item.name} style={{maxWidth:'100%', maxHeight:'250px'}} onError={(e)=>e.target.style.display='none'} />
                        </div>
                        {item.description && <p className="warframe-description">{item.description}</p>}
                        <button onClick={() => onToggle(item.uniqueName)} className={`btn-toggle-large ${isOwned ? 'owned' : ''}`}>
                            {isOwned ? '✔ POSSEDUTO' : '+ AGGIUNGI'}
                        </button>
                        <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="wiki-btn-block">WIKI PAGE</a>
                    </div>

                    <div className="col-center">
                        <h3 className="section-title">{isRelicItem ? "REWARDS" : "COMPONENTS"}</h3>
                        {isRelicItem && (
                            <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                                {sortedRewards.map((r, i) => (
                                    <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px', borderBottom:'1px solid #222', fontSize:'13px'}}>
                                        <span style={{color: '#aaa'}}>{r.itemName || r.item?.name}</span>
                                        <span style={{fontWeight:'bold', color:'var(--gold)'}}>{(r.chance*100).toFixed(0)}%</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!isRelicItem && hasComponents && (
                            <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                                {filteredComponents.map((comp, idx) => (
                                    <div key={idx} className="component-row">
                                        <div className="component-header">
                                            <div className="component-icon"><img src={`${IMG_BASE_URL}/${comp.imageName}`} alt=""/></div>
                                            <div style={{flex:1}}>
                                                <strong style={{color:'#eee', fontSize:'13px'}}>{getCleanPartName(comp.name)}</strong>
                                            </div>
                                            <span className="count-badge">x{comp.itemCount}</span>
                                        </div>
                                        <div className="relic-cards-grid">
                                            {formatDropsWithVaultCheck(comp.drops).map((d, i) => {
                                                const isSelected = d.relicID && selectedRelics.has(d.relicID);
                                                
                                                return (
                                                    <div 
                                                        key={i} 
                                                        onClick={() => d.isRelic && handleRelicClick(d.relicID)}
                                                        className={`mini-relic-card ${!d.isRelic ? 'is-mission' : ''} ${isSelected ? 'selected' : ''} ${d.isVaultedRelic ? 'is-vaulted' : ''}`}
                                                    >
                                                        {d.isRelic && d.imagePath ? (
                                                            <img 
                                                                src={d.imagePath} 
                                                                className="relic-card-img" 
                                                                alt="" 
                                                                // Se l'immagine fallisce, nascondila e mostra l'icona SVG (il fratello successivo nel DOM)
                                                                onError={(e)=>{e.target.style.display='none'; e.target.nextSibling.style.display='block'}} 
                                                            />
                                                        ) : null}
                                                        
                                                        {/* Fallback Icona: Mostrata se non c'è imagePath O se l'immagine va in errore (gestito sopra) */}
                                                        <svg 
                                                            className="relic-icon-svg" 
                                                            viewBox="0 0 24 24" 
                                                            style={{display: (d.isRelic && d.imagePath) ? 'block' : 'block'}} // Modificato: Lasciamo che onError gestisca la visibilità
                                                        >
                                                            {/* Nota: Per evitare che si vedano entrambi prima del caricamento, meglio usare CSS o stato, ma questo è un fix rapido */}
                                                            {d.isRelic ? (
                                                                <path d="M14.5 2C13.5 2 12.5 2.5 12 3.5C11.5 2.5 10.5 2 9.5 2C6 2 4 5 4 8C4 11 6 13 8 16C9 17.5 10 19.5 10 22H14C14 19.5 15 17.5 16 16C18 13 20 11 20 8C20 5 18 2 14.5 2ZM12 17C10.5 15 9 13.5 9 11C9 9.5 10 8.5 12 8.5C14 8.5 15 9.5 15 11C15 13.5 13.5 15 12 17Z" />
                                                            ) : (
                                                                <path d="M12 2L2 12l10 10 10-10L12 2zm0 18l-8-8 8-8 8 8-8 8z"/>
                                                            )}
                                                        </svg>

                                                        <div className="card-info">
                                                            <span className="card-name">{d.loc}</span>
                                                            <span className={`card-pct ${d.rarityClass}`}>
                                                                {d.pct}
                                                                {d.isVaultedRelic && <span className="vaulted-mini-tag">V</span>}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="col-right">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'10px'}}>
                            <h3 className="section-title" style={{color:'var(--gold)', margin:0}}>
                                {loadingStrategies ? statusMsg : (selectedRelics.size > 0 ? `FILTERED FARMING (${selectedRelics.size})` : "OPTIMAL FARMING LOCATIONS")}
                            </h3>
                            {selectedRelics.size > 0 && <span style={{fontSize:'10px', color:'#666', cursor:'pointer'}} onClick={()=>setSelectedRelics(new Set())}>(CLEAR FILTERS)</span>}
                        </div>

                        {!isRelicItem && displayedMissions.length > 0 ? (
                            <div className="strategy-container">
                                {displayedMissions.map((mission, idx) => (
                                    <div key={idx} className="mission-block">
                                        <div className="mission-block-header">
                                            <div className="mission-name-large">{mission.missionName}</div>
                                            {!selectedRelics.size && <div style={{fontSize:'10px', color:'#666', fontWeight:'bold'}}>{(mission.totalScore*100).toFixed(0)}% TOT</div>}
                                        </div>
                                        <table className="mission-relics-table">
                                            <thead>
                                                <tr>
                                                    <th style={{width:'30%'}}>RELIC</th>
                                                    <th style={{width:'20%', textAlign:'center'}}>PART</th>
                                                    <th style={{width:'20%', textAlign:'center'}}>ROT</th>
                                                    <th style={{width:'30%', textAlign:'right'}}>CHANCE</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {mission.relicsFound.sort((a,b)=>b.maxChance - a.maxChance).map((r, i) => (
                                                    <tr key={i}>
                                                        <td style={{color:'#fff', fontWeight:'bold'}}>{r.id}</td>
                                                        <td style={{textAlign:'center'}}><span className="part-badge">{r.part}</span></td>
                                                        <td style={{textAlign:'center', color:'var(--gold)'}}>{(r.drops||[]).map(d=>d.rot).join(' | ')}</td>
                                                        <td style={{textAlign:'right', color:'#aaa'}}>{(r.drops||[]).map(d=>(d.chance*100).toFixed(1)+'%').join(' | ')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{textAlign:'center', padding:'40px', color:'#555', fontStyle:'italic'}}>
                                {!loadingStrategies && (selectedRelics.size > 0 ? "Selected relics are Vaulted or have no drop data." : "No farming data available.")}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function getIntactChance(r) {
    if(!r) return "-";
    r = r.toLowerCase();
    if(r.includes('rare')) return "2%";
    if(r.includes('uncommon')) return "11%";
    return "25%";
}

function getRarityClass(r) {
    if(!r) return "";
    r = r.toLowerCase();
    if(r.includes('rare')) return "pct-rare";
    if(r.includes('uncommon')) return "pct-uncommon";
    return "pct-common";
}