// Reads data/jobs.xlsx (columns: path, title, url, details) and writes dist/ for Vercel.
import readXlsx from 'read-excel-file/node';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

const rows = await readXlsx('data/jobs.xlsx');
const [head, ...body] = rows;
const col = Object.fromEntries(['path', 'title', 'url', 'details'].map(n => {
  const i = head.findIndex(h => String(h).trim().toLowerCase() === n);
  if (i < 0) throw new Error(`jobs.xlsx is missing the "${n}" column`);
  return [n, i];
}));

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
function closingDate(text) {
  const m = text.match(/closes?\s+(\d{1,2})\s+([a-z]{3})[a-z]*\s+(\d{4})/i);
  const mo = m && MONTHS[m[2].toLowerCase()];
  return mo === undefined || !m ? null : new Date(Date.UTC(+m[3], mo, +m[1])).toISOString().slice(0, 10);
}

const seen = new Set(), items = [], warn = [];
body.forEach((r, n) => {
  const get = k => String(r[col[k]] ?? '').trim();
  const [title, url, details] = [get('title'), get('url'), get('details')];
  if (!title) return;
  if (!/^https?:\/\//.test(url)) return warn.push(`row ${n + 2}: "${title}" has no valid url, skipped`);
  if (seen.has(url)) return warn.push(`row ${n + 2}: duplicate url, skipped (${title})`);
  seen.add(url);
  const [section, ...rest] = get('path').split('/').map(s => s.trim());
  const isJob = section.toLowerCase().startsWith('job');
  const closes = isJob ? closingDate(details) : null;
  if (isJob && !closes) warn.push(`row ${n + 2}: no "Closes D Mon YYYY" in details for "${title}"`);
  items.push({ section: isJob ? 'Jobs' : 'Scholarships', category: rest.join(' / ') || 'Other', title, url, details, closes });
});

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
cpSync('public', 'dist', { recursive: true });
writeFileSync('dist/jobs.json', JSON.stringify({ updated: new Date().toISOString(), items }));
warn.forEach(w => console.warn('warning:', w));
console.log(`Built ${items.length} entries (${items.filter(i => i.section === 'Jobs').length} jobs).`);
