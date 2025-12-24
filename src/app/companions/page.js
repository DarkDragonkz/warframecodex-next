import { fetchGameData } from '@/utils/serverData';
import CodexListPage from '@/components/CodexListPage';

const COMPANION_CATEGORIES = [
    {
        id: 'all',
        label: 'ALL',
        filter: (item) => item.category === 'Sentinels'
    },
    {
        id: 'base',
        label: 'BASE',
        filter: (item) => item.category === 'Sentinels' && !item.name.includes('Prime')
    },
    {
        id: 'prime',
        label: 'PRIME',
        filter: (item) => item.category === 'Sentinels' && item.name.includes('Prime')
    }
];

export default async function Page() {
    const [data, lookup] = await Promise.all([
        fetchGameData('Sentinels.json'),
        fetchGameData('RelicLookup.json')
    ]);

    return (
        <CodexListPage 
            initialData={data} 
            lookupData={lookup}
            pageTitle="COMPANIONS" 
            customCategories={COMPANION_CATEGORIES}
        />
    );
}