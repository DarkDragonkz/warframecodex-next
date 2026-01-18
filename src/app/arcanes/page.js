import { fetchGameData } from '@/utils/serverData';
import ArcanesClientPage from './ArcanesClientPage';

export default async function Page() {
    const arcanesData = await fetchGameData('Arcanes.json');

    return (
        <ArcanesClientPage initialData={arcanesData} />
    );
}
