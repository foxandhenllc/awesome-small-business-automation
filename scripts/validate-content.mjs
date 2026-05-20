import { existsSync, readFileSync } from 'node:fs';

const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const required = [
  'Lead capture',
  'Booking',
  'CRM',
  'Email marketing',
  'Invoices and payments',
  'Static app workflow',
  'npm run dev',
  'npm run build',
  '$0/month starter stack',
  '$50/month serious stack',
  'Fox & Hen customization path',
  'Public-safe contribution rules',
];
const requiredScripts = ['dev', 'build', 'typecheck', 'test', 'validate'];
const appFiles = ['../index.html', '../src/App.tsx', '../src/data/resources.ts', '../src/lib/stack.ts'];

const missing = required.filter((term) => !readme.includes(term));
if (missing.length > 0) {
  console.error(`Missing required sections: ${missing.join(', ')}`);
  process.exit(1);
}

const missingScripts = requiredScripts.filter((script) => !packageJson.scripts?.[script]);
if (missingScripts.length > 0) {
  console.error(`Missing required package scripts: ${missingScripts.join(', ')}`);
  process.exit(1);
}

const missingAppFiles = appFiles.filter((file) => !existsSync(new URL(file, import.meta.url)));
if (missingAppFiles.length > 0) {
  console.error(`Missing static app files: ${missingAppFiles.join(', ')}`);
  process.exit(1);
}

const links = [...readme.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((match) => match[1]);
if (links.length < 20) {
  console.error(`Expected at least 20 curated links, found ${links.length}.`);
  process.exit(1);
}

console.log(
  `Validated ${links.length} curated links, ${required.length} README requirements, ${requiredScripts.length} scripts, and ${appFiles.length} app files.`
);
