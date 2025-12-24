import { fetchGameData } from '@/utils/serverData';
import CodexListPage from '@/components/CodexListPage';

export default async function Page() {
    // Scarica i dati (assicurati che Amps.json esista in public/database_api, altrimenti sarà vuoto ma non romperà la build)
    const data = await fetchGameData('Amps.json');

    return (
        <CodexListPage 
            initialData={data} 
            pageTitle="AMPS" 
            categoryMode="amps" // Passiamo la stringa, non la funzione!
        />
    );
}