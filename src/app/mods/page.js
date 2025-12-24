import { fetchGameData } from '@/utils/serverData';
import ModsClientPage from './ModsClientPage';

export default async function Page() {
    // Caricamento Server-Side in parallelo
    const [modsData, arcanesData] = await Promise.all([
        fetchGameData('Mods.json'),
        fetchGameData('Arcanes.json')
    ]);

    const combined = [...modsData, ...arcanesData];

    return (
        <ModsClientPage initialData={combined} />
    );
}