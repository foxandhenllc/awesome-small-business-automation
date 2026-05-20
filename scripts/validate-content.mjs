import { readFileSync } from 'node:fs';

const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const required = [
  'Lead capture',
  'Booking',
  'CRM',
  'Email marketing',
  'Invoices and payments',
  '$0/month starter stack',
  '$50/month serious stack',
  'Fox & Hen customization path',
  'Public-safe contribution rules',
];

const missing = required.filter((term) => !readme.includes(term));
if (missing.length > 0) {
  console.error(`Missing required sections: ${missing.join(', ')}`);
  process.exit(1);
}

const links = [...readme.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((match) => match[1]);
if (links.length < 20) {
  console.error(`Expected at least 20 curated links, found ${links.length}.`);
  process.exit(1);
}

console.log(`Validated ${links.length} curated links and ${required.length} required sections.`);
