import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

async function start(t, user) {
  const directory = await mkdtemp(join(tmpdir(), 'bonjour-'));
  await writeFile(join(directory, '.env'), `USER='${user}'\nPORT=0\n`);
  const child = spawn(process.execPath, [new URL('../server.js', import.meta.url).pathname], {
    cwd: directory,
    env: { ...process.env, USER: 'system-user' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => {
    if (child.exitCode === null) {
      const closed = new Promise(resolve => child.once('close', resolve));
      child.kill();
      await closed;
    }
    await rm(directory, { recursive: true, force: true });
  });
  return new Promise((resolve, reject) => {
    let output = '';
    let errors = '';
    child.stderr.on('data', data => { errors += data; });
    child.on('error', reject);
    child.on('exit', code => reject(new Error(`Server exited (${code}): ${errors}`)));
    child.stdout.on('data', data => {
      output += data;
      const match = output.match(/http:\/\/0\.0\.0\.0:(\d+)/);
      if (match) resolve(`http://127.0.0.1:${match[1]}`);
    });
  });
}

test('le .env prime sur USER système et la page est française', async t => {
  const url = await start(t, 'Ada');
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html.*utf-8/);
  const html = await response.text();
  assert.match(html, /lang="fr"/);
  assert.match(html, /Bonjour Ada/);
  assert.match(html, /href="\/styles.css"/);
});

test('USER est échappé dans le HTML', async t => {
  const url = await start(t, '<script>"A&B"</script>');
  const html = await (await fetch(url)).text();
  assert.match(html, /Bonjour &lt;script&gt;&quot;A&amp;B&quot;&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('le CSS Tailwind compilé est servi localement', async t => {
  const url = await start(t, 'Ada');
  const response = await fetch(`${url}/styles.css`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/css/);
  assert.match(await response.text(), /\.bg-indigo-950/);
});

test('les autres chemins, notamment .env, ne sont pas exposés', async t => {
  const url = await start(t, 'Ada');
  for (const path of ['/unknown', '/.env', '/server.js']) {
    assert.equal((await fetch(`${url}${path}`)).status, 404);
  }
});
