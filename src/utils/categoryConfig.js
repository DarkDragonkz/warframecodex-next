// src/utils/categoryConfig.js

// --- RIMOSSO L'IMPORT DI serverData CHE CAUSAVA L'ERRORE ---

// --- HELPER FILTERS ---
const isNecramech = (item) => {
    const t = (item.type || "").toLowerCase();
    const n = item.name.toLowerCase();
    return t.includes('necramech') || n === 'voidrig' || n === 'bonewidow';
};

const isArchwing = (item) => (item.type || "").toLowerCase().includes('archwing') && !isNecramech(item);

// --- CONFIGURAZIONE GERARCHICA ---
export const HIERARCHY = [
    {
        id: 'arsenal',
        title: 'ARSENAL',
        subtitle: 'WEAPONS & GEAR',
        color: '#ff6b6b',
        coverItem: 'Braton Prime', 
        jsonFile: 'Primary.json', 
        items: [
            { id: 'primary', title: 'Primary', json: 'Primary.json', filter: (i) => i.category === 'Primary' },
            { id: 'secondary', title: 'Secondary', json: 'Secondary.json', filter: (i) => i.category === 'Secondary' },
            { id: 'melee', title: 'Melee', json: 'Melee.json', filter: (i) => i.category === 'Melee' },
            { id: 'arch-gun', title: 'Arch-Gun', json: 'Primary.json', filter: (i) => (i.type || "").includes('Arch-Gun') },
            { id: 'arch-melee', title: 'Arch-Melee', json: 'Melee.json', filter: (i) => (i.type || "").includes('Arch-Melee') },
        ]
    },
    {
        id: 'entities',
        title: 'ENTITIES',
        subtitle: 'WARFRAMES & COMPANIONS',
        color: '#d4af37',
        coverItem: 'Excalibur Prime',
        jsonFile: 'Warframes.json',
        items: [
            { id: 'warframes', title: 'Warframes', json: 'Warframes.json', filter: (i) => (i.type || "").includes('Warframe') && !isNecramech(i) },
            { id: 'necramechs', title: 'Necramechs', json: 'Warframes.json', filter: (i) => isNecramech(i) },
            { id: 'archwings', title: 'Archwings', json: 'Warframes.json', filter: (i) => isArchwing(i) },
            { id: 'sentinels', title: 'Sentinels', json: 'Sentinels.json', filter: (i) => (i.type || "").includes('Sentinel') },
            { id: 'pets', title: 'Pets', json: 'Sentinels.json', filter: (i) => ['Kubrow', 'Kavat', 'Predasite', 'Vulpaphyla'].some(k => (i.type || "").includes(k)) }
        ]
    },
    {
        id: 'upgrades',
        title: 'UPGRADES',
        subtitle: 'MODS & RELICS',
        color: '#54a0ff',
        coverItem: 'Blind Rage',
        jsonFile: 'Mods.json',
        items: [
            { id: 'mods', title: 'Mods', json: 'Mods.json', specialPage: 'mods' },
            { id: 'arcanes', title: 'Arcanes', json: 'Arcanes.json', specialPage: 'mods' },
            { id: 'relics', title: 'Relics', json: 'Relics.json', specialPage: 'relics' }
        ]
    },
    {
        id: 'inventory',
        title: 'INVENTORY',
        subtitle: 'RESOURCES & GEAR',
        color: '#1dd1a1',
        coverItem: 'Orokin Cell',
        jsonFile: 'Resources.json',
        items: [
            { id: 'resources', title: 'Resources', json: 'Resources.json', filter: (i) => !i.type?.includes('Key') },
            { id: 'gear', title: 'Gear', json: 'Gear.json', filter: () => true },
            { id: 'fish', title: 'Fish', json: 'Fish.json', filter: () => true }
        ]
    },
    {
        id: 'cosmetics',
        title: 'COSMETICS',
        subtitle: 'FASHION FRAME',
        color: '#ff9f43',
        coverItem: 'Repala Syandana',
        jsonFile: 'Skins.json',
        items: [
            { id: 'skins', title: 'Skins', json: 'Skins.json', filter: () => true },
            { id: 'sigils', title: 'Sigils', json: 'Sigils.json', filter: () => true },
            { id: 'glyphs', title: 'Glyphs', json: 'Glyphs.json', filter: () => true }
        ]
    },
    {
        id: 'universe',
        title: 'THE UNIVERSE',
        subtitle: 'LORE & ENEMIES',
        color: '#a29bfe',
        coverItem: 'Natah',
        jsonFile: 'Enemy.json',
        items: [
            { id: 'enemies', title: 'Enemies', json: 'Enemy.json', filter: () => true },
            { id: 'quests', title: 'Quests', json: 'Quests.json', filter: () => true }
        ]
    }
];

// Helper per trovare configurazioni
export const getMacroCategory = (id) => HIERARCHY.find(c => c.id === id);
export const getMicroCategory = (microId) => {
    for (const macro of HIERARCHY) {
        const micro = macro.items.find(m => m.id === microId);
        if (micro) return { ...micro, parentColor: macro.color };
    }
    return null;
};