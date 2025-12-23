"use client";
import { Suspense } from 'react';
import CodexListPage from '@/components/CodexListPage';

// CONFIGURAZIONE CATEGORIE (ALL, BASE, PRIME)
const WARFRAME_CATEGORIES = [
    {
        id: 'all',
        label: 'ALL',
        filter: (item) => (item.type || "").toLowerCase() === 'warframe' && item.category === 'Warframes'
    },
    {
        id: 'base',
        label: 'BASE',
        filter: (item) => (item.type || "").toLowerCase() === 'warframe' && item.category === 'Warframes' && !item.name.includes('Prime')
    },
    {
        id: 'prime',
        label: 'PRIME',
        filter: (item) => (item.type || "").toLowerCase() === 'warframe' && item.category === 'Warframes' && item.name.includes('Prime')
    }
];

export default function Page() {
    return (
        <Suspense fallback={<div style={{color:'#fff', padding:'50px', textAlign:'center'}}>Loading Interface...</div>}>
            <CodexListPage 
                filesToLoad={['Warframes.json']} 
                pageTitle="WARFRAMES" 
                customCategories={WARFRAME_CATEGORIES}
            />
        </Suspense>
    );
}