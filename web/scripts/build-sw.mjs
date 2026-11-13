import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dist = path.resolve(process.argv[2] ?? fileURLToPath(new URL('../dist/', import.meta.url)));
async function files(directory) {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...await files(target));
    else if (entry.isFile() && entry.name !== 'sw.js' && !entry.name.endsWith('.map')) results.push(target);
  }
  return results.sort();
}
const assets = await files(dist);
const hash = createHash('sha256');
for (const asset of assets) { hash.update(path.relative(dist, asset)); hash.update(await readFile(asset)); }
const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
hash.update(source);
const version = hash.digest('hex').slice(0, 16);
const paths = assets.map(asset => `./${path.relative(dist, asset).replaceAll(path.sep, '/')}`);
const worker = source.replaceAll('__GIGI_VERSION__', version)
  .replace('["__GIGI_PRECACHE__"]', JSON.stringify(paths));
await writeFile(path.join(dist, 'sw.js'), worker);
console.log(`PWA shell: ${paths.length} assets precached (${version})`);
