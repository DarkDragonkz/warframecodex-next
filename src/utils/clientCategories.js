// src/utils/clientCategories.js

// Funzione helper per identificare rigorosamente un Necramech
const isNecramech = (item) => {
    const type = (item.type || "").toLowerCase();
    const name = item.name.toLowerCase();
    if (type.includes('necramech')) return true;
    if (name === 'bonewidow' || name === 'voidrig') return true;
    return false;
};

export const CATEGORY_CONFIGS = {
    'warframes': [
        {
            id: 'all', label: 'ALL',
            filter: (item) => {
                const type = (item.type || "").toLowerCase();
                return type.includes('warframe') && item.category === 'Warframes' && !isNecramech(item);
            }
        },
        {
            id: 'base', label: 'BASE',
            filter: (item) => {
                const type = (item.type || "").toLowerCase();
                return type.includes('warframe') && item.category === 'Warframes' && !item.name.includes('Prime') && !isNecramech(item);
            }
        },
        {
            id: 'prime', label: 'PRIME',
            filter: (item) => {
                const type = (item.type || "").toLowerCase();
                return type.includes('warframe') && item.category === 'Warframes' && item.name.includes('Prime') && !isNecramech(item);
            }
        }
    ],
    'primary': [
        { id: 'all', label: 'ALL', filter: (item) => item.category === 'Primary' },
        { id: 'base', label: 'BASE', filter: (item) => item.category === 'Primary' && !item.name.includes('Prime') && !item.name.includes('Vandal') && !item.name.includes('Wraith') },
        { id: 'prime', label: 'PRIME', filter: (item) => item.category === 'Primary' && item.name.includes('Prime') }
    ],
    'secondary': [
        { id: 'all', label: 'ALL', filter: (item) => item.category === 'Secondary' },
        { id: 'base', label: 'BASE', filter: (item) => item.category === 'Secondary' && !item.name.includes('Prime') && !item.name.includes('Vandal') && !item.name.includes('Wraith') },
        { id: 'prime', label: 'PRIME', filter: (item) => item.category === 'Secondary' && item.name.includes('Prime') }
    ],
    'melee': [
        { id: 'all', label: 'ALL', filter: (item) => item.category === 'Melee' },
        { id: 'base', label: 'BASE', filter: (item) => item.category === 'Melee' && !item.name.includes('Prime') && !item.name.includes('Vandal') && !item.name.includes('Wraith') },
        { id: 'prime', label: 'PRIME', filter: (item) => item.category === 'Melee' && item.name.includes('Prime') }
    ],
    'companions': [
        { id: 'all', label: 'ALL', filter: (item) => item.category === 'Sentinels' },
        { id: 'base', label: 'BASE', filter: (item) => item.category === 'Sentinels' && !item.name.includes('Prime') },
        { id: 'prime', label: 'PRIME', filter: (item) => item.category === 'Sentinels' && item.name.includes('Prime') }
    ],
    'necramechs': [
         { id: 'all', label: 'NECRAMECHS', filter: (item) => isNecramech(item) }
    ]
};