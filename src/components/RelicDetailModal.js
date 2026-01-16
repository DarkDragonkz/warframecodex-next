"use client";
import React, { useEffect } from 'react';
import Image from 'next/image';
import { IMG_BASE_URL } from '@/utils/constants';
import './WarframeDetailModal.css'; 

export default function RelicDetailModal({ item, onClose, ownedItems, onToggle }) {
    if (!item) return null;

    const isOwned = ownedItems.has(item.uniqueName);
    const isVaulted = !item.drops || item.drops.length === 0;

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const sortedRewards = item.rewards ? [...item.rewards].sort((a, b) => a.chance - b.chance) : [];

    const getRarityConfig = (chance) => {
        if (chance > 0.20) return { color: '#cd7f32', name: 'COMMON' }; 
        if (chance > 0.10) return { color: '#c0c0c0', name: 'UNCOMMON' }; 
        return { color: '#d4af37', name: 'RARE' }; 
    };

    // --- FUNZIONE DI PARSING ---
    // Input: "Ceres/Hapke (Spy), Rotation B"
    // Output: { planet: "Ceres", node: "Hapke", type: "Spy", rot: "B" }
    const parseLocation = (locString) => {
        try {
            // Rimuove eventuali residui come "Lith G14 Relic"
            let clean = locString.split(',')[0]; // Prendi tutto prima della virgola (Rotation è di solito dopo)
            let rotation = locString.match(/Rotation\s+([A-C])/i)?.[1] || "-";
            
            // "Ceres/Hapke (Spy)" -> split "/"
            let parts = clean.split('/');
            let planet = parts[0].trim();
            let rest = parts[1] || "";

            // "Hapke (Spy)" -> extract node and type
            let node = rest.split('(')[0].trim();
            let typeMatch = rest.match(/\((.*?)\)/);
            let type = typeMatch ? typeMatch[1] : "Mission";

            return { planet, node, type, rotation };
        } catch (e) {
            return { planet: locString, node: "-", type: "-", rotation: "-" };
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-simple relic-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>

                <div className="modal-body">
                    {/* COLONNA SINISTRA */}
                    <div className="col-left relic-col-left">
                        <div className="modal-info-header relic-modal-info-header">
                            <h2 className={`modal-title relic-modal-title ${isVaulted ? 'vaulted' : ''}`}>
                                {item.simpleName}
                            </h2>
                            <div className="modal-status">
                                {isVaulted 
                                    ? <div className="vault-badge is-vaulted">VAULTED RELIC</div> 
                                    : <div className="vault-badge is-available">AVAILABLE IN MISSION</div>
                                }
                            </div>
                        </div>

                        <div className="det-img-box relic-det-img">
                            <Image 
                                src={`${IMG_BASE_URL}/${item.imageName}`} 
                                alt={item.name} 
                                fill
                                style={{objectFit:'contain'}}
                                unoptimized
                            />
                        </div>

                        <div className="col-header-sticky relic-header-plain">
                            <h3 className="section-title">POSSIBLE REWARDS</h3>
                        </div>

                        <div className="col-content-scroll relic-col-content">
                            {sortedRewards.map((r, i) => {
                                const conf = getRarityConfig(r.chance);
                                return (
                                    <div
                                        key={i}
                                        className="relic-reward-card"
                                        style={{ '--relic-color': conf.color }}
                                    >
                                        <div className="relic-reward-row">
                                            <span className={`relic-reward-name ${conf.name === 'RARE' ? 'relic-reward-name-rare' : ''}`}>
                                                {r.itemName || "Unknown Item"}
                                            </span>
                                            <span className="relic-reward-chance">
                                                {(r.chance * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        {/* Barra Visiva */}
                                        <div className="relic-reward-bar">
                                            <div
                                                className="relic-reward-bar-fill"
                                                style={{ '--relic-width': `${Math.min(100, r.chance * 100 * 2)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="det-actions relic-actions">
                            <button onClick={() => onToggle(item.uniqueName)} className={`btn-toggle-large ${isOwned ? 'owned' : ''}`}>
                                {isOwned ? '✔ IN COLLECTION' : '+ ADD TO COLLECTION'}
                            </button>
                        </div>
                    </div>

                    {/* COLONNA DESTRA: Drop Locations (Nuova Tabella) */}
                    <div className="col-center relic-col-center">
                        <div className="col-header-sticky relic-header-sticky">
                            <h3 className="section-title">DROP LOCATIONS</h3>
                        </div>
                        
                        <div className="col-content-scroll relic-col-content">
                            {!isVaulted ? (
                                <table className="relic-table">
                                    <thead className="relic-table-head">
                                        <tr>
                                            <th className="relic-th">PLANET</th>
                                            <th className="relic-th">NODE</th>
                                            <th className="relic-th">TYPE</th>
                                            <th className="relic-th relic-th-center">ROT</th>
                                            <th className="relic-th relic-th-right">CHANCE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {item.drops.sort((a,b) => b.chance - a.chance).map((drop, idx) => {
                                            const info = parseLocation(drop.location);
                                            return (
                                                <tr key={idx} className="relic-table-row">
                                                    <td className="relic-td relic-td-planet">{info.planet}</td>
                                                    <td className="relic-td relic-td-node">{info.node}</td>
                                                    <td className="relic-td relic-td-type">{info.type}</td>
                                                    <td className="relic-td relic-td-rot">{info.rotation}</td>
                                                    <td className="relic-td relic-td-chance">
                                                        {(drop.chance * 100).toFixed(2)}%
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="relic-empty">
                                    <div className="relic-empty-icon">🔒</div>
                                    <h3 className="relic-empty-title">PRIME VAULT SEALED</h3>
                                    <p className="relic-empty-text">
                                        This Relic has been retired from the drop tables.<br/>
                                        It cannot be farmed currently.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
