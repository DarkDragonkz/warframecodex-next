import fs from 'fs/promises';
import path from 'path';

// Determina la cartella del database in modo sicuro
// process.cwd() è la root del progetto durante la build
const DB_FOLDER = path.join(process.cwd(), 'public', 'database_api'); 
// NOTA: Ho aggiunto 'public'. Se la tua cartella 'database_api' è nella root (fuori da public), togli 'public'.
// Ma per Next.js, i file statici accessibili via fetch dovrebbero stare in /public/database_api.
// SE LA CARTELLA è nella root del progetto (allo stesso livello di src), usa:
// const DB_FOLDER = path.join(process.cwd(), 'database_api');

// Cache globale per evitare riletture durante la build
globalThis.dataCache = globalThis.dataCache || {};

export async function fetchGameData(filename) {
    const shouldCache = process.env.NODE_ENV === 'production';
    // 1. Controlla Cache RAM
    if (shouldCache && globalThis.dataCache[filename]) {
        return globalThis.dataCache[filename];
    }

    // 2. Tenta lettura da File System (Obbligatorio per la Build)
    // Cerchiamo sia in root/database_api che in root/public/database_api per sicurezza
    const possiblePaths = [
        path.join(process.cwd(), 'database_api', filename),
        path.join(process.cwd(), 'public', 'database_api', filename)
    ];

    for (const filePath of possiblePaths) {
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const json = JSON.parse(fileContent);
            if (shouldCache) {
                globalThis.dataCache[filename] = json;
            }
            return json;
        } catch (e) {
            // Continua al prossimo path
        }
    }

    // 3. Se fallisce FS, evita fetch durante la build statica
    // Restituisci array vuoto per non rompere la build
    console.warn(`[SERVER WARNING] Could not load ${filename} from FS. Returning empty array.`);
    return [];
}
