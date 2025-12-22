"use client";
import { Suspense } from 'react';
import CodexListPage from '@/components/CodexListPage';

// --- Definizione Categorie (Resta invariata) ---
const createEraCategory = (id, label, eraName) => ({
    id: id,
    label: label,
    filter: (item) => item.name.includes(eraName),
    subFilters: [
        { id: 'all', label: 'INTACT (DEFAULT)', filter: (i) => i.name.includes('Intact') },
        { id: 'exceptional', label: 'EXCEPTIONAL', filter: (i) => i.name.includes('Exceptional') },
        { id: 'flawless', label: 'FLAWLESS', filter: (i) => i.name.includes('Flawless') },
        { id: 'radiant', label: 'RADIANT', filter: (i) => i.name.includes('Radiant') },
        { id: 'everything', label: 'SHOW ALL', filter: () => true }
    ]
});

const RELIC_CATEGORIES = [
    createEraCategory('lith', 'LITH', 'Lith'),
    createEraCategory('meso', 'MESO', 'Meso'),
    createEraCategory('neo', 'NEO', 'Neo'),
    createEraCategory('axi', 'AXI', 'Axi'),
    createEraCategory('requiem', 'REQUIEM', 'Requiem'),
];

export default function Page() {
    return (
        <Suspense fallback={<div style={{color:'#fff', padding:'50px', textAlign:'center'}}>Loading Void Fissures...</div>}>
            <CodexListPage 
                // Dice al componente di caricare "Relics.json" dalla cartella base configurata
                filesToLoad={['Relics.json']} 
                pageTitle="VOID RELICS" 
                customCategories={RELIC_CATEGORIES}
            />
        </Suspense>
    );
}