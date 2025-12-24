import { fetchGameData } from '@/utils/serverData';
import CodexListPage from '@/components/CodexListPage';

const MELEE_CATEGORIES = [
    {
        id: 'all',
        label: 'ALL',
        filter: (item) => item.category === 'Melee'
    },
    {
        id: 'base',
        label: 'BASE',
        filter: (item) => item.category === 'Melee' && !item.name.includes('Prime') && !item.name.includes('Vandal') && !item.name.includes('Wraith') && !item.name.includes('Prisma')
    },
    {
        id: 'prime',
        label: 'PRIME',
        filter: (item) => item.category === 'Melee' && item.name.includes('Prime')
    }
];

export default async function Page() {
    const [data, lookup] = await Promise.all([
        fetchGameData('Melee.json'),
        fetchGameData('RelicLookup.json')
    ]);

    return (
        <CodexListPage 
            initialData={data} 
            lookupData={lookup}
            pageTitle="MELEE WEAPONS" 
            customCategories={MELEE_CATEGORIES}
        />
    );
}