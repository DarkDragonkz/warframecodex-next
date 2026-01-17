const https = require('https');
const fs = require('fs/promises');
const path = require('path');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, url).toString();
          res.resume();
          fetchJson(nextUrl).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

async function main() {
  const items = await fetchJson('https://api.warframestat.us/items/search/arcane');
  const arcanesInfo = await fetchJson('https://api.warframestat.us/arcanes');

  const infoByName = new Map(arcanesInfo.map((a) => [a.name, a]));

  const arcanes = items
    .filter((i) => i.category === 'Arcanes')
    .reduce((acc, item) => {
      if (!item.uniqueName) return acc;
      if (acc.has(item.uniqueName)) return acc;
      const info = infoByName.get(item.name);
      acc.set(item.uniqueName, {
        name: item.name,
        uniqueName: item.uniqueName,
        category: item.category,
        type: item.type || 'Arcane',
        imageName: item.imageName || null,
        rarity: item.rarity || info?.rarity || null,
        description: item.description || info?.effect || null,
        drops: item.drops || [],
        tradable: item.tradable ?? false,
        masterable: item.masterable ?? false,
      });
      return acc;
    }, new Map());

  const output = Array.from(arcanes.values()).sort((a, b) => a.name.localeCompare(b.name));

  const outPath = path.join(process.cwd(), 'public', 'database_api', 'Arcanes.json');
  await fs.writeFile(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Wrote ${output.length} arcanes to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
