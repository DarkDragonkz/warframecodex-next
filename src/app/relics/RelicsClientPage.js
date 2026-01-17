"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { VirtuosoGrid } from 'react-virtuoso';
import { IMG_BASE_URL } from '@/utils/constants';
import RelicDetailModal from '@/components/RelicDetailModal'; 
import '@/app/hud-layout.css'; 
import './relics.css'; 
import MobileBottomNav from '@/components/MobileBottomNav';

const STORAGE_KEY = 'warframe_codex_relics_v1';

export default function RelicsClientPage({ initialData = [] }) {
    const [rawApiData, setRawApiData] = useState([]);
    const [ownedCards, setOwnedCards] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    const [currentEra, setCurrentEra] = useState('all'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    // FILTRO 3 STATI
    const [filterState, setFilterState] = useState('all');
    const [showVaulted, setShowVaulted] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(searchTerm); }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

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
        const method = isMobile ? 'add' : 'remove';
        document.body.classList[method]('mobile-scroll-enabled');
        document.documentElement.classList[method]('mobile-scroll-enabled');
        return () => {
            document.body.classList.remove('mobile-scroll-enabled');
            document.documentElement.classList.remove('mobile-scroll-enabled');
        };
    }, [isMobile]);

    const cycleFilterState = () => {
        if (filterState === 'all') setFilterState('missing');
        else if (filterState === 'missing') setFilterState('owned');
        else setFilterState('all');
    };

    useEffect(() => {
        if (initialData) {
            const processed = initialData.filter(item =>
                item.name.includes('Intact') &&
                item.category === 'Relics'
            ).map(item => ({
                ...item,
                isVaulted: !item.drops || item.drops.length === 0,
                era: item.name.split(' ')[0],
                code: item.name.split(' ')[1],
                simpleName: item.name.replace(' Intact', '').replace(' Relic', '').trim()
            }));

            const eraOrder = { 'Lith': 1, 'Meso': 2, 'Neo': 3, 'Axi': 4, 'Requiem': 5 };
            processed.sort((a, b) => {
                if (eraOrder[a.era] !== eraOrder[b.era]) return (eraOrder[a.era] || 9) - (eraOrder[b.era] || 9);
                return a.name.localeCompare(b.name);
            });

            setRawApiData(processed);
            setLoading(false);
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { setOwnedCards(new Set(JSON.parse(saved))); } catch (e) { console.error(e); }
        }
    }, [initialData]);

    useEffect(() => {
        if (!loading && typeof window !== 'undefined') {
            const handler = setTimeout(() => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify([...ownedCards]));
            }, 1000);
            return () => clearTimeout(handler);
        }
    }, [ownedCards, loading]);

    const filteredData = useMemo(() => {
        return rawApiData.filter(item => {
            if (debouncedSearch && !item.simpleName.toLowerCase().includes(debouncedSearch)) return false;
            
            const isOwned = ownedCards.has(item.uniqueName);
            if (filterState === 'missing' && isOwned) return false;
            if (filterState === 'owned' && !isOwned) return false;

            if (!showVaulted && item.isVaulted) return false;
            if (currentEra !== 'all' && item.era !== currentEra) return false;
            return true;
        });
    }, [rawApiData, currentEra, debouncedSearch, filterState, showVaulted, ownedCards]);

    const toggleOwned = (id) => {
        const newSet = new Set(ownedCards);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setOwnedCards(newSet);
    };

    const pct = rawApiData.length > 0 ? Math.round((ownedCards.size / rawApiData.length) * 100) : 0;

    if (loading) return <div className="loading-screen">DECODING VOID SIGNALS...</div>;

    const gridStyle = isMobile ? { width: '100%' } : { height: '100%', width: '100%' };

    return (
        <div className={`codex-layout ${isMobile ? 'mobile-scroll' : ''}`}>
            <div className="header-group">
                <div className="nav-top-row">
                    <div className="nav-brand">
                        <Link href="/" className="nav-home-btn">⌂ HOME</Link>
                        <h1 className="page-title">VOID RELICS</h1>
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
                    <div className="filters-left filters-scroll">
                        <div className="category-tabs">
                            {['all', 'Lith', 'Meso', 'Neo', 'Axi', 'Requiem'].map(era => (
                                <button 
                                    key={era}
                                    className={`tab-btn ${currentEra === era ? 'active' : ''}`}
                                    onClick={() => setCurrentEra(era)}
                                >
                                    {era.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="filters-right">
                        <div className="search-wrapper">
                            <input 
                                type="text" className="search-input" placeholder="SEARCH (Ex: G1)..." 
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toLowerCase())} 
                            />
                        </div>
                        
                        <label className="toggle-filter">
                            <input type="checkbox" style={{display:'none'}} checked={showVaulted} onChange={(e) => setShowVaulted(e.target.checked)} />
                            <div className="checkbox-custom">{showVaulted && '✓'}</div>
                            SHOW VAULTED
                        </label>

                        <button 
                            className={`cycle-btn state-${filterState}`} 
                            onClick={cycleFilterState}
                        >
                            {filterState === 'all' && 'SHOW: ALL'}
                            {filterState === 'missing' && 'SHOW: MISSING'}
                            {filterState === 'owned' && 'SHOW: OWNED'}
                        </button>
                    </div>
                </div>
                <div className="progress-line-container"><div className="progress-line-fill" style={{width: `${pct}%`}}></div></div>
            </div>

            <div className="gallery-scroll-area relics-gallery-scroll">
                <VirtuosoGrid
                    style={gridStyle}
                    totalCount={filteredData.length}
                    overscan={200}
                    useWindowScroll={isMobile}
                    components={{
                        List: (props) => <div {...props} className="card-gallery relic-card-gallery" />,
                        Item: (props) => <div {...props} className="card-item" />
                    }}
                    itemContent={(index) => {
                        const item = filteredData[index];
                        return (
                            <div onClick={() => setSelectedItem(item)} style={{height: '100%'}}>
                                <RelicCardAdvanced 
                                    item={item} 
                                    isOwned={ownedCards.has(item.uniqueName)} 
                                    onToggle={() => toggleOwned(item.uniqueName)} 
                                />
                            </div>
                        );
                    }}
                />
            </div>

            <MobileBottomNav />

            {selectedItem && (
                <RelicDetailModal 
                    item={selectedItem} 
                    onClose={() => setSelectedItem(null)} 
                    ownedItems={ownedCards} 
                    onToggle={toggleOwned} 
                />
            )}
        </div>
    );
}

function RelicCardAdvanced({ item, isOwned, onToggle }) {
    return (
        <div 
            className={`relic-card-advanced ${item.isVaulted ? 'is-vaulted' : ''} ${isOwned ? 'owned' : ''}`}
            data-era={item.era}
        >
            <div className="relic-era-bar"></div>
            
            {/* NUOVO BOTTONE STATUS PER RELIQUIE */}
            <div 
                className={`status-badge ${isOwned ? 'owned' : 'missing'}`} 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onToggle(); 
                }}
            >
                {isOwned ? 'OWNED' : 'MISSING'}
            </div>

            <div className="relic-img-wrapper">
                <Image src={`${IMG_BASE_URL}/${item.imageName}`} alt={item.name} fill className="relic-img" unoptimized />
            </div>
            <div className="relic-info">
                <div className="relic-era-label">{item.era}</div>
                <div className="relic-code">{item.code}</div>
                {item.isVaulted && (<div className="relic-vaulted-label">VAULTED</div>)}
            </div>
        </div>
    );
}
