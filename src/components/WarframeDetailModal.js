"use client";
import React, { useEffect } from 'react';
import { IMG_BASE_URL } from '@/utils/constants';

// Mappa di priorità per l'ordinamento (Logica "Other Author")
// 1 = Rare (In alto o in basso a seconda della preferenza), qui mettiamo Common in alto (più probabile)
const RARITY_PRIORITY = {
    'Common': 10,
    'Uncommon': 5,
    'Rare': 1,
    'Legendary': 0
};

export default function WarframeDetailModal({ item, onClose, ownedItems, onToggle }) {
    if (!item) return null;

    const isOwned = ownedItems.has(item.uniqueName);
    
    // Controllo Categoria flessibile (Relics, Relic, ecc.)
    const isRelic = (item.category || "").includes('Relic') || (item.type || "").includes('Relic');
    
    // Logica Vaulted
    const isVaulted = item.vaulted || (isRelic && (!item.drops || item.drops.length === 0));
    
    const wikiUrl = `https://warframe.fandom.com/wiki/${item.name.replace(/ /g, '_')}`;

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // --- LOGICA DATI ROBUSTA ---

    // 1. REWARDS (Contenuto)
    // Usa una logica di sort sicura: se manca 'chance', usa la 'rarity'
    const sortedRewards = item.rewards ? [...item.rewards].sort((a, b) => {
        // Se entrambi hanno la chance, usa quella (decrescente)
        if (a.chance && b.chance) return b.chance - a.chance;
        
        // Altrimenti usa la priorità della rarità (Common prima di Rare)
        const pA = RARITY_PRIORITY[a.rarity] || 5;
        const pB = RARITY_PRIORITY[b.rarity] || 5;
        return pA - pB; // Ordine decrescente di priorità (Common(10) -> Rare(1))
    }) : [];

    // 2. DROPS (Missioni)
    const sortedDrops = item.drops ? [...item.drops].sort((a, b) => (b.chance || 0) - (a.chance || 0)) : [];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-simple" onClick={(e) => e.stopPropagation()}>
                
                <button className="close-btn" onClick={onClose}>&times;</button>

                <div className="modal-body">
                    
                    {/* HEADER */}
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', paddingBottom:'15px', borderBottom:'1px solid #222'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                            <h2 style={{ fontSize:'28px', fontWeight:'900', margin:0, color:'#fff', textTransform:'uppercase' }}>{item.name}</h2>
                            <div className="type-pill" style={{fontSize:'11px', background:'#222', padding:'4px 10px', borderRadius:'10px', color:'#888'}}>{item.type}</div>
                        </div>
                        {isVaulted ? 
                            <div className="vault-badge is-vaulted">VAULTED</div> : 
                            <div className="vault-badge is-available">AVAILABLE</div>
                        }
                    </div>

                    {/* LAYOUT A 3 COLONNE */}
                    <div className="modal-grid-layout">
                        
                        {/* COLONNA 1: INFO */}
                        <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                            <div style={{marginBottom:'20px', width:'100%', display:'flex', justifyContent:'center', background:'radial-gradient(circle, #1a1a1e 0%, transparent 70%)', padding:'20px', borderRadius:'8px'}}>
                                <img 
                                    src={`${IMG_BASE_URL}/${item.imageName}`} 
                                    alt={item.name} 
                                    style={{maxHeight:'200px', maxWidth:'100%', filter: 'drop-shadow(0 0 25px rgba(0,0,0,0.6))'}}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                            <button onClick={() => onToggle(item.uniqueName)} className={`btn-toggle-large ${isOwned ? 'owned' : ''}`}>
                                {isOwned ? '✔ POSSEDUTO' : '+ AGGIUNGI'}
                            </button>
                            <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="wiki-btn-block">WIKI PAGE</a>
                        </div>

                        {/* COLONNA 2: CONTENUTO (REWARDS) */}
                        <div className="scroll-col" style={{background:'#0e0e10', borderRadius:'6px', padding:'15px', border:'1px solid #222'}}>
                            <h3 className="section-title">RELIQUARY CONTENTS</h3>
                            
                            {sortedRewards.length > 0 ? (
                                <table className="codex-table rewards-table">
                                    <tbody>
                                        {sortedRewards.map((reward, idx) => {
                                            // LOGICA RECUPERO NOME (Extra sicura)
                                            let itemName = reward.itemName || (reward.item && reward.item.name) || reward.text || "Unknown Item";
                                            itemName = itemName.replace(" Blueprint", " BP");

                                            // GESTIONE RARITÀ & CHANCE
                                            const rarityStr = reward.rarity || "Unknown";
                                            // Se chance esiste usala, altrimenti stima base (Common 25%, Unc 11%, Rare 2%)
                                            let chanceVal = reward.chance;
                                            if (!chanceVal) {
                                                if(rarityStr === 'Common') chanceVal = 0.2533;
                                                else if(rarityStr === 'Uncommon') chanceVal = 0.11;
                                                else if(rarityStr === 'Rare') chanceVal = 0.02;
                                                else chanceVal = 0;
                                            }
                                            
                                            const chanceTxt = (chanceVal * 100).toFixed(0) + '%';
                                            const rarityColor = getRarityColorByString(rarityStr); // Usa stringa se chance manca
                                            
                                            return (
                                                <tr key={idx} style={{borderLeft: `3px solid ${rarityColor}`}}>
                                                    <td style={{paddingLeft:'10px'}}>
                                                        <div className="reward-name" style={{fontSize:'12px', color:'#eee'}}>{itemName}</div>
                                                        <div className="reward-rarity" style={{color: rarityColor, fontSize:'9px'}}>
                                                            {rarityStr.toUpperCase()}
                                                        </div>
                                                    </td>
                                                    <td style={{textAlign:'right', fontWeight:'bold', color:'#666', fontSize:'12px', width:'40px'}}>
                                                        {chanceTxt}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{padding:'30px', textAlign:'center', color:'#555', fontSize:'12px', fontStyle:'italic'}}>
                                    Nessun contenuto trovato.
                                </div>
                            )}
                        </div>

                        {/* COLONNA 3: MISSIONI (DROPS) */}
                        <div className="scroll-col">
                            <h3 className="section-title">DROP SOURCES {isVaulted && "(ARCHIVED)"}</h3>
                            {sortedDrops.length > 0 ? (
                                <table className="codex-table">
                                    <thead>
                                        <tr>
                                            <th>LOCATION</th>
                                            <th style={{textAlign:'center'}}>ROT</th>
                                            <th style={{textAlign:'right'}}>%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedDrops.map((drop, idx) => {
                                            // PULIZIA NOME E ROTAZIONE
                                            let locName = drop.location;
                                            let rot = drop.rotation;
                                            if (!rot) {
                                                const rotMatch = locName.match(/(?:Rotation|Rot)\s*([A-C])/i);
                                                if (rotMatch) {
                                                    rot = rotMatch[1].toUpperCase();
                                                    locName = locName.replace(/\s*\(?(?:Rotation|Rot)\s*[A-C]\)?/i, '').trim();
                                                    locName = locName.replace(/\(\s*\)/, '').trim();
                                                }
                                            }

                                            return (
                                                <tr key={idx} className="drop-table-row">
                                                    <td>
                                                        <div className="drop-loc">{locName}</div>
                                                        <div className="drop-type">{drop.type}</div>
                                                    </td>
                                                    <td style={{textAlign:'center', color:'var(--gold)', fontWeight:'bold', fontSize:'14px'}}>
                                                        {rot ? rot : '-'}
                                                    </td>
                                                    <td style={{textAlign:'right'}}>
                                                        <span className="drop-chance">{(drop.chance * 100).toFixed(2)}%</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{padding:'20px', background: 'rgba(255,50,50,0.1)', border:'1px dashed #aa4444', borderRadius:'6px', color:'#ccc', fontSize:'12px'}}>
                                    <strong style={{color:'#ff6666'}}>VAULTED / NON DISPONIBILE</strong>
                                    <br/><br/>Questa reliquia non ha drop table attive.
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper aggiornato per usare la STRINGA di rarità se la chance manca
function getRarityColorByString(rarity) {
    if (!rarity) return '#888';
    const r = rarity.toLowerCase();
    if (r.includes('common') && !r.includes('uncommon')) return '#cd7f32'; // Bronze
    if (r.includes('uncommon')) return '#c0c0c0'; // Silver
    if (r.includes('rare')) return '#d4af37'; // Gold
    return '#888';
}