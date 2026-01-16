const fs = require('fs');
const path = require('path');

const DIR_TO_SCAN = '.';
const OUTPUT_FILE = 'TUTTO_IL_CODICE.txt';

// Use Sets for O(1) lookup
const EXTENSIONS = new Set(['.js', '.jsx', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg', '.gif']);
const IGNORE_DIRS = new Set(['node_modules', '.next', 'out', '.github', '.git', '.vscode', 'build', 'dist']);
const BINARY_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp']);

// Initialize Stream
const stream = fs.createWriteStream(OUTPUT_FILE, { encoding: 'utf8' });

function write(text) {
    if (!stream.write(text)) {
        // Handle backpressure if necessary, though unlikely for text dumps
    }
}

function scanDirectory(dir) {
    let entries;
    try {
        // Optimization: Get type info immediately
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
        return;
    }

    // Sort for consistent output order (readdir order is OS dependent)
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!IGNORE_DIRS.has(entry.name)) {
                scanDirectory(fullPath);
            }
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (EXTENSIONS.has(ext)) {
                processFile(fullPath, ext);
            }
        }
    }
}

function processFile(filePath, ext) {
    try {
        write(`\n==================================================\n`);
        write(`FILE: ${filePath}\n`);
        write(`==================================================\n`);

        if (BINARY_EXTENSIONS.has(ext)) {
            write(`[BINARY IMAGE FILE - PATH LOGGED - CONTENT SKIPPED]\n`);
        } else {
            const content = fs.readFileSync(filePath, 'utf8');
            write(content + `\n`);
        }
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
        write(`[READ ERROR]\n`);
    }
}

console.log(`Scansione in corso di: ${path.resolve(DIR_TO_SCAN)} ...`);
write(`DATA DUMP: ${new Date().toISOString()}\n`);
write(`ROOT DIR: ${path.resolve(DIR_TO_SCAN)}\n\n`);

scanDirectory(DIR_TO_SCAN);

stream.end(() => {
    console.log(`Fatto! Il file "${OUTPUT_FILE}" è stato generato.`);
});