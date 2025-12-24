import { fetchGameData } from '@/utils/serverData';
import CodexListPage from '@/components/CodexListPage';

// Categorie per gli Amps (Prismi, Supporti, ecc. o tutti insieme)
const AMP_CATEGORIES = [
    {
        id: 'all',
        label: 'ALL',
        filter: (item) => item.category === 'Amps' || (item.type && item.type.includes('Amp'))
    }
];

export default async function Page() {
    // Nota: Assicurati che 'Amps.json' esista nella cartella public/database_api
    const data = await fetchGameData('Amps.json');

    return (
        <CodexListPage 
            initialData={data} 
            pageTitle="AMPS" 
            customCategories={AMP_CATEGORIES} // Passiamo categorie semplici se non c'è config complessa
        />
    );
}