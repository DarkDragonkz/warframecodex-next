import { fetchGameData } from '@/utils/serverData';
import CodexListPage from '@/components/CodexListPage';

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

export default async function Page() {
    const data = await fetchGameData('Relics.json');

    return (
        <CodexListPage 
            initialData={data} 
            pageTitle="VOID RELICS" 
            customCategories={RELIC_CATEGORIES}
        />
    );
}