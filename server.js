import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { parseEnv } from 'node:util';

try {
  Object.assign(process.env, parseEnv(readFileSync('.env', 'utf8')));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const user = (process.env.USER ?? 'Ada').replace(/[&<>"']/g, character => entities[character]);
const html = readFileSync(new URL('./public/index.html', import.meta.url), 'utf8')
  .replace('{{USER}}', () => user);
const css = readFileSync(new URL('./public/styles.css', import.meta.url));
const resources = {
  '/': ['text/html; charset=utf-8', html],
  '/styles.css': ['text/css; charset=utf-8', css],
};

const server = createServer((request, response) => {
  const path = request.url.split('?')[0];

  if (Object.hasOwn(resources, path)) {
    response.writeHead(200, { 'Content-Type': resources[path][0] });
    response.end(resources[path][1]);
  } else {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Page introuvable');
  }
});

server.listen(Number(process.env.PORT ?? 3000), '0.0.0.0', () => {
  console.log(`http://0.0.0.0:${server.address().port}`);
});
