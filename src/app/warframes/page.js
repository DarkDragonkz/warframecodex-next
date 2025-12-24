import { fetchGameData } from '@/utils/serverData';
import CodexListPage from '@/components/CodexListPage';

const WARFRAME_CATEGORIES = [
    {
        id: 'all',
        label: 'ALL',
        filter: (item) => 
            (item.type || "").toLowerCase().includes('warframe') && 
            item.category === 'Warframes' &&
            !item.name.toLowerCase().includes('necramech') &&
            !(item.type || "").toLowerCase().includes('necramech')
    },
    {
        id: 'base',
        label: 'BASE',
        filter: (item) => 
            (item.type || "").toLowerCase().includes('warframe') && 
            item.category === 'Warframes' && 
            !item.name.includes('Prime') &&
            !item.name.toLowerCase().includes('necramech')
    },
    {
        id: 'prime',
        label: 'PRIME',
        filter: (item) => 
            (item.type || "").toLowerCase().includes('warframe') && 
            item.category === 'Warframes' && 
            item.name.includes('Prime') &&
            !item.name.toLowerCase().includes('necramech')
    }
];

export default async function Page() {
    // Carichiamo anche RelicLookup per il calcolo Vaulted Server-Side/Hybrid
    const [data, lookup] = await Promise.all([
        fetchGameData('Warframes.json'),
        fetchGameData('RelicLookup.json')
    ]);

    return (
        <CodexListPage 
            initialData={data} 
            lookupData={lookup}
            pageTitle="WARFRAMES" 
            customCategories={WARFRAME_CATEGORIES}
        />
    );
}