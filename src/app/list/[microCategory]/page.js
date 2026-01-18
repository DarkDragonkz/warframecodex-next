import { notFound } from 'next/navigation';
import { getMicroCategory, HIERARCHY } from '@/utils/categoryConfig'; // Importa HIERARCHY
import { fetchGameData } from '@/utils/serverData';

// Importiamo i componenti Client
import CodexListPage from '@/components/CodexListPage';
import ModsClientPage from '@/app/mods/ModsClientPage';
import RelicsClientPage from '@/app/relics/RelicsClientPage';
import ArcanesClientPage from '@/app/arcanes/ArcanesClientPage';

// QUESTA FUNZIONE DICE A NEXT.JS QUALI PAGINE COSTRUIRE
export async function generateStaticParams() {
    const params = [];
    // Cicla tutte le macro categorie
    HIERARCHY.forEach(macro => {
        // Cicla tutte le micro categorie dentro ogni macro
        macro.items.forEach(micro => {
            params.push({ microCategory: micro.id });
        });
    });
    return params;
}

export default async function DynamicListPage({ params }) {
    const resolvedParams = await params;
    const microCat = getMicroCategory(resolvedParams.microCategory);

    if (!microCat) return notFound();

    // 1. Carica i dati
    let data = await fetchGameData(microCat.json);
    
    // 2. Filtra i dati lato server se necessario
    if (microCat.filter) {
        data = data.filter(microCat.filter);
    }

    // 3. Gestione Casi Speciali (Mods, Arcanes, Relics)
    if (microCat.specialPage === 'mods') {
        return <ModsClientPage initialData={data} />;
    }

    if (microCat.specialPage === 'arcanes') {
        return <ArcanesClientPage initialData={data} />;
    }

    if (microCat.specialPage === 'relics') {
        return <RelicsClientPage initialData={data} />;
    }

    // 4. Default: Pagina Lista Standard
    let lookup = null;
    if (['warframes', 'primary', 'secondary', 'melee', 'companions', 'arch-gun', 'arch-melee'].includes(microCat.id)) {
        lookup = await fetchGameData('RelicLookup.json');
    }

    // Determina se attivare i TAB Base/Prime
    const categoryMode = ['warframes', 'primary', 'secondary', 'melee', 'companions', 'arch-gun', 'arch-melee'].includes(microCat.id) 
        ? microCat.id 
        : null;

    return (
        <CodexListPage 
            initialData={data} 
            lookupData={lookup}
            pageTitle={microCat.title} 
            categoryMode={categoryMode} 
        />
    );
}
