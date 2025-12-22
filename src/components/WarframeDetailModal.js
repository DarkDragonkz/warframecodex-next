"use client";
import React, { useEffect, useState } from 'react';
import { IMG_BASE_URL, API_BASE_URL } from '@/utils/constants';

const HIDDEN_RESOURCES = [
    'Orokin Cell', 'Argon Crystal', 'Neural Sensors', 'Neurodes', 
    'Plastids', 'Rubedo', 'Ferrite', 'Alloy Plate', 'Polymer Bundle', 
    'Circuits', 'Salvage', 'Morphics', 'Control Module', 'Gallium', 
    'Nitain Extract', 'Tellurium', 'Cryotic', 'Oxium'
];

export default function WarframeDetailModal({ item, onClose, ownedItems, onToggle }) {
    const [smartMissions, setSmartMissions] = useState([]);
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
        if (!isRelicItem && (item.components || item.drops)) fetchFarmingData();
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, item]);

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

            if (neededIDs.size === 0) { setLoadingStrategies(false); return; }

            const res = await fetch(`${API_BASE_URL}/RelicLookup.json`);
            if (!res.ok) throw new Error("Missing DB");
            const lookupDB = await res.json();
            const missionMap = new Map();

            neededIDs.forEach(relicID => {
                const missions = lookupDB[relicID]; 
                const partName = relicToPartMap[relicID] || "PART";
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

            const sorted = Array.from(missionMap.values()).sort((a, b) => {
                const uniquePartsA = new Set(a.relicsFound.map(r => r.part)).size;
                const uniquePartsB = new Set(b.relicsFound.map(r => r.part)).size;
                if (uniquePartsB !== uniquePartsA) return uniquePartsB - uniquePartsA;
                return b.totalScore - a.totalScore;
            }).slice(0, 15);

            setSmartMissions(sorted);
        } catch (e) { console.error(e); setStatusMsg("N/A"); } finally { setLoadingStrategies(false); }
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
                    {/* COL 1: INFO */}
                    <div className="col-left">
                        <div style={{width:'100%', display:'flex', justifyContent:'center', marginBottom:'20px'}}>
                            <img src={`${IMG_BASE_URL}/${item.imageName}`} alt={item.name} style={{maxWidth:'100%', maxHeight:'250px'}} onError={(e)=>e.target.style.display='none'} />
                        </div>
                        <button onClick={() => onToggle(item.uniqueName)} className={`btn-toggle-large ${isOwned ? 'owned' : ''}`}>
                            {isOwned ? '✔ POSSEDUTO' : '+ AGGIUNGI'}
                        </button>
                        <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="wiki-btn-block">WIKI PAGE</a>
                    </div>

                    {/* COL 2: COMPONENTI (NUOVO STILE "DATA CHIP") */}
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
                            <div style={{display:'flex', flexDirection:'column'}}>
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
                                            {formatDrops(comp.drops).map((d, i) => (
                                                <div key={i} className={`mini-relic-card ${!d.isRelic ? 'is-mission' : ''}`}>
                                                    {/* SVG ICONA RELIQUIA (Forma di Cavolo/Reliquia) */}
                                                    <svg className="relic-icon-svg" viewBox="0 0 24 24">
                                                        {d.isRelic ? (
                                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                                                        ) : (
                                                            <path d="M12 2L2 12l10 10 10-10L12 2zm0 18l-8-8 8-8 8 8-8 8z"/>
                                                        )}
                                                    </svg>
                                                    <div className="card-info">
                                                        <span className="card-name">{d.loc}</span>
                                                        <span className="card-pct">{d.pct}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* COL 3: STRATEGIA */}
                    <div className="col-right">
                        <h3 className="section-title" style={{color:'var(--gold)'}}>
                            {loadingStrategies ? statusMsg : "OPTIMAL FARMING LOCATIONS"}
                        </h3>
                        {!isRelicItem && smartMissions.length > 0 ? (
                            <div className="strategy-container">
                                {smartMissions.map((mission, idx) => (
                                    <div key={idx} className="mission-block">
                                        <div className="mission-block-header">
                                            <div className="mission-name-large">{mission.missionName}</div>
                                            <div style={{fontSize:'10px', color:'#666', fontWeight:'bold'}}>{(mission.totalScore*100).toFixed(0)}% TOT</div>
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
                                {!loadingStrategies && "No farming data available."}
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

function formatDrops(drops) {
    if(!drops || drops.length === 0) return [];
    const unique = new Map();
    drops.forEach(d => {
        let locRaw = d.location || "";
        let isRelic = locRaw.toUpperCase().match(/(LITH|MESO|NEO|AXI|REQUIEM)\s+[A-Z0-9]+/);
        if (isRelic && locRaw.match(/(Radiant|Flawless|Exceptional)/i)) return;
        let loc = locRaw.replace(' Relic', '').replace(' (Intact)', '').trim();
        if(!unique.has(loc)) {
            unique.set(loc, {
                loc, isRelic,
                pct: isRelic ? getIntactChance(d.rarity) : (d.chance ? `${(d.chance*100).toFixed(0)}%` : "-"),
                chance: d.chance || 0
            });
        }
    });
    return Array.from(unique.values()).sort((a,b) => b.chance - a.chance);
}