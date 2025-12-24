import { fetchGameData } from '@/utils/serverData';
import CodexListPage from '@/components/CodexListPage';

const PRIMARY_CATEGORIES = [
    {
        id: 'all',
        label: 'ALL',
        filter: (item) => item.category === 'Primary'
    },
    {
        id: 'base',
        label: 'BASE',
        filter: (item) => item.category === 'Primary' && !item.name.includes('Prime') && !item.name.includes('Vandal') && !item.name.includes('Wraith') && !item.name.includes('Prisma')
    },
    {
        id: 'prime',
        label: 'PRIME',
        filter: (item) => item.category === 'Primary' && item.name.includes('Prime')
    }
];

export default async function Page() {
    // Anche qui passiamo il lookup se serve per calcolare se un'arma prime è vaulted
    const [data, lookup] = await Promise.all([
        fetchGameData('Primary.json'),
        fetchGameData('RelicLookup.json')
    ]);

    return (
        <CodexListPage 
            initialData={data} 
            lookupData={lookup}
            pageTitle="PRIMARY WEAPONS" 
            customCategories={PRIMARY_CATEGORIES}
        />
    );
}