import { fetchGameData } from '@/utils/serverData';
import ModsClientPage from './ModsClientPage';

export default async function Page() {
    const modsData = await fetchGameData('Mods.json');

    return (
        <ModsClientPage initialData={modsData} />
    );
}
