import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

test('build precaches hashed assets in an isolated fixture without touching app dist', async () => {
  const temporaryRoot = path.resolve(tmpdir());
  const fixture = await mkdtemp(path.join(temporaryRoot, 'gigicheck-sw-'));
  try {
    await mkdir(path.join(fixture, 'assets'));
    await writeFile(path.join(fixture, 'index.html'), '<html>GigiCheck</html>');
    await writeFile(path.join(fixture, 'assets', 'app-123.js'), 'console.log("app")');
    await writeFile(path.join(fixture, 'assets', 'app-123.js.map'), '{}');
    const script = fileURLToPath(new URL('../../web/scripts/build-sw.mjs', import.meta.url));
    await promisify(execFile)(process.execPath, [script, fixture]);
    const result = await readFile(path.join(fixture, 'sw.js'), 'utf8');
    assert.match(result, /const PRECACHE = \["\.\/assets\/app-123\.js","\.\/index\.html"\]/);
    assert.match(result, /gigicheck-shell-[a-f0-9]{16}/);
    assert.doesNotMatch(result, /__GIGI_VERSION__|app-123\.js\.map/);
    assert.match(result, /redirect: 'error'/);
  } finally {
    assert.ok(fixture.startsWith(`${temporaryRoot}${path.sep}`));
    await rm(fixture, { recursive: true, force: true });
  }
});
