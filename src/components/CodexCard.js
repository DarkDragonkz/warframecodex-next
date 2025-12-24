"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IMG_BASE_URL } from '@/utils/constants';

export default function CodexCard({ item, isOwned, onToggleOwned }) {
    if (!item) return null;

    const wikiUrl = `https://warframe.fandom.com/wiki/${item.name.replace(/ /g, '_')}`;
    const isPrime = item.name.includes('Prime');

    return (
        <div className={`card-wrapper ${isOwned ? 'owned' : ''}`} data-rarity={isPrime ? 'Prime' : 'Base'}>
            
            <div className="card-image-container">
                {/* NUOVO BOTTONE STATUS */}
                <div 
                    className={`status-badge ${isOwned ? 'owned' : 'missing'}`} 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        onToggleOwned(item.uniqueName); 
                    }}
                >
                    {isOwned ? 'OWNED' : 'MISSING'}
                </div>

                {item.vaulted && <div className="vaulted-tag-card">VAULTED</div>}

                <Image 
                    src={`${IMG_BASE_URL}/${item.imageName}`} 
                    alt={item.name} 
                    fill
                    className="card-image-img"
                    unoptimized
                />
            </div>

            <div className="info-area">
                <div>
                    <div className="type-pill">{item.type}</div>
                    <div className="mod-name">{item.name}</div>
                </div>
                
                {item.description && <p className="card-desc">{item.description}</p>}

                <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="wiki-btn-block" onClick={(e) => e.stopPropagation()}>
                    WIKI
                </a>
            </div>
        </div>
    );
}