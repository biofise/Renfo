#!/usr/bin/env node
// Change la version à la fois dans index.html (APP_VERSION) et sw.js (nom du cache).
const fs = require('fs'), path = require('path');
const dir = fs.existsSync('renfo-app/index.html') ? 'renfo-app' : '.';
const hp = path.join(dir, 'index.html'), sp = path.join(dir, 'sw.js');
let html = fs.readFileSync(hp, 'utf8'), sw = fs.readFileSync(sp, 'utf8');
const cur = (html.match(/APP_VERSION = '(\d+\.\d+\.\d+)'/) || [])[1];
if (!cur) { console.error('APP_VERSION introuvable dans index.html'); process.exit(1); }
const arg = process.argv[2] || '';
const [M, m, p] = cur.split('.').map(Number);
let next;
if (arg === 'major') next = `${M + 1}.0.0`;
else if (arg === 'minor') next = `${M}.${m + 1}.0`;
else if (arg === 'patch') next = `${M}.${m}.${p + 1}`;
else if (/^\d+\.\d+\.\d+$/.test(arg)) next = arg;
else { console.error('Usage : node scripts/bump.js patch | minor | major | X.Y.Z'); process.exit(1); }
html = html.replace(/APP_VERSION = '[^']+'/, `APP_VERSION = '${next}'`);
sw = sw.replace(/const C = 'renfo-[^']+'/, `const C = 'renfo-${next}'`);
fs.writeFileSync(hp, html); fs.writeFileSync(sp, sw);
console.log(`Version ${cur} → ${next}`);
