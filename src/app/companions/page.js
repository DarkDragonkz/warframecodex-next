"use client";
import CodexListPage from '@/components/CodexListPage';

// Configurazione Categorie
const COMPANION_CATS = [
    { 
        id: 'all', 
        label: 'ALL COMPANIONS', 
        filter: () => true,
        subFilters: [
             { id: 'sentinel', label: 'SENTINELS', filter: i => i.category === 'Sentinels' },
             { id: 'pet', label: 'BEASTS', filter: i => i.category === 'Pets' }, // Kubrow/Kavat
             { id: 'robotic', label: 'HOUNDS/MOA', filter: i => i.type && (i.type.includes('Hound') || i.type.includes('MOA')) }
        ]
    },
    { id: 'sentinels', label: 'SENTINELS ONLY', filter: i => i.category === 'Sentinels' },
    { id: 'pets', label: 'BEASTS ONLY', filter: i => i.category === 'Pets' },
];

export default function Page() {
    return (
        <CodexListPage 
            filesToLoad={['Sentinels.json', 'Pets.json']} 
            pageTitle="COMPANIONS" 
            customCategories={COMPANION_CATS}
        />
    );
}