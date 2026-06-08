import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildOpenApiDocument } from '../src/openapi/registry';

const doc = buildOpenApiDocument();
const out = resolve(process.cwd(), '../../docs/openapi.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);
console.log(
  `✔ docs/openapi.json escrito · ${Object.keys(doc.paths).length} rutas`,
);
