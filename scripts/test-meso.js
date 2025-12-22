const Items = require('warframe-items');

console.log("🔍 Cerco 'Meso X1' nel database locale...");

const items = new Items({ category: ['Relics'] });
const results = Array.from(items).filter(i => i.name.includes('Meso X1'));

if (results.length > 0) {
    console.log(`✅ TROVATE ${results.length} VARIANTI:`);
    results.forEach(r => {
        console.log(` - [${r.name}] (Vaulted: ${r.vaulted})`);
    });
} else {
    console.log("❌ NESSUNA TRACCIA DI MESO X1. Il problema è nella libreria npm.");
}