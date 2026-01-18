// src/hooks/useItemStrategy.js
import { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '@/utils/constants';

// Utility pulizia nomi
const cleanRelicName = (fullName) => {
    return fullName.replace(" Relic", "").replace(/\s*\(.*?\)/g, "").trim();
};

let relicLookupCache = null;

export function useItemStrategy(item) {
    const [relicMap, setRelicMap] = useState(new Map());
    const [selectedRelics, setSelectedRelics] = useState(new Set());
    const [loadingRelics, setLoadingRelics] = useState(false);

    const isRelicItem = item?.category === 'Relics';

    // 1. Parsing Componenti
    const componentsList = useMemo(() => {
        if (isRelicItem || !item || !item.components) return [];
        
        const validParts = ['Blueprint', 'Chassis', 'Neuroptics', 'Systems', 'Harness', 'Wings', 'Engine', 'Cortex', 'Carapace', 'Cerebrum'];
        const filteredComponents = item.components.filter(comp => validParts.some(part => comp.name.includes(part)));
        
        // Ordinamento logico
        const order = ['Blueprint', 'Neuroptics', 'Chassis', 'Systems'];
        const sorted = [...filteredComponents].sort((a, b) => {
            const ia = order.findIndex(k => a.name.includes(k));
            const ib = order.findIndex(k => b.name.includes(k));
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });

        // Estrazione nomi reliquie necessarie
        return sorted.map(comp => {
            const rawRelics = (comp.drops || []).filter(d => d.location.includes(" Relic"));
            const uniqueRelics = new Map();
            
            rawRelics.forEach(d => {
                const baseName = cleanRelicName(d.location);
                if (!uniqueRelics.has(baseName)) {
                    uniqueRelics.set(baseName, { 
                        name: baseName, 
                        rarity: d.rarity || 'Common', 
                        chance: d.chance 
                    });
                }
            });

            return {
                name: comp.name.replace(item.name, "").replace("Blueprint", "BP").trim(),
                uniqueName: comp.uniqueName,
                relics: Array.from(uniqueRelics.values()).sort((a,b) => a.name.localeCompare(b.name))
            };
        });
    }, [item, isRelicItem]);

    // 2. Fetch Ottimizzato Reliquie (Solo quelle necessarie)
    useEffect(() => {
        if (!item) return;

        let relicsToFetch = [];
        if (isRelicItem) {
            relicsToFetch.push(cleanRelicName(item.name));
            setSelectedRelics(new Set([cleanRelicName(item.name)])); // Auto-select se è reliquia
        } else {
            // Raccogli tutti i nomi delle reliquie dai componenti
            componentsList.forEach(c => c.relics.forEach(r => relicsToFetch.push(r.name)));
        }

        // Rimuovi duplicati
        relicsToFetch = [...new Set(relicsToFetch)];

        if (relicsToFetch.length > 0) {
            setLoadingRelics(true);
            (async () => {
                try {
                    let lookupDB = relicLookupCache;
                    if (!lookupDB) {
                        const res = await fetch(`${API_BASE_URL}/RelicLookup.json`);
                        if (!res.ok) {
                            setRelicMap(new Map());
                            return;
                        }
                        lookupDB = await res.json();
                        relicLookupCache = lookupDB;
                    }

                    const map = new Map();
                    relicsToFetch.forEach(name => {
                        const entry = lookupDB[name];
                        if (!entry) return;
                        const drops = Array.isArray(entry) ? entry : (entry.drops || entry);
                        map.set(name, { name, drops });
                    });
                    setRelicMap(map);
                } finally {
                    setLoadingRelics(false);
                }
            })();
        }
    }, [item, componentsList, isRelicItem]);

    // 3. Calcolo Strategia Farming
    const farmingStrategy = useMemo(() => {
        if (selectedRelics.size === 0) return null;
        const missions = [];
        const noDataRelics = [];

        selectedRelics.forEach(relicName => {
            const info = relicMap.get(relicName);
            // Se info manca ma siamo nella vista reliquia, usiamo i drop dell'item stesso
            const drops = info?.drops?.length > 0 ? info.drops : (isRelicItem ? item.drops : []);

            if (!drops || drops.length === 0) {
                noDataRelics.push(relicName);
            } else {
                drops.forEach(d => {
                    missions.push({
                        location: d.location,
                        relic: relicName,
                        chance: d.chance,
                        rotation: d.rotation
                    });
                });
            }
        });

        return {
            missions: missions.sort((a, b) => b.chance - a.chance).slice(0, 50),
            noData: noDataRelics
        };
    }, [selectedRelics, relicMap, item, isRelicItem]);

    const toggleRelic = (name) => {
        setSelectedRelics(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    return { 
        componentsList, 
        farmingStrategy, 
        selectedRelics, 
        toggleRelic,
        loadingRelics,
        isRelicItem
    };
}
