#!/usr/bin/env node
// Validation avant déploiement : version cohérente, manifeste, icônes, syntaxe des scripts.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const dir = fs.existsSync('renfo-app/index.html') ? 'renfo-app' : '.';
const read = f => fs.readFileSync(path.join(dir, f), 'utf8');
const ver = html => (html.match(/APP_VERSION = '([^']+)'/) || [])[1];
const semver = x => /^\d+\.\d+\.\d+$/.test(x || '');
const cmp = (a, b) => { const A = a.split('.').map(Number), B = b.split('.').map(Number); for (let i = 0; i < 3; i++) if (A[i] !== B[i]) return A[i] - B[i]; return 0; };

const html = read('index.html'), sw = read('sw.js'), v = ver(html);
if (process.argv.includes('--print-version')) { console.log(v); process.exit(0); }

const errors = [];
if (!semver(v)) errors.push('APP_VERSION absente ou invalide dans index.html (attendu X.Y.Z)');
const c = (sw.match(/const C = 'renfo-([^']+)'/) || [])[1];
if (c !== v) errors.push(`Version incohérente : index.html = ${v}, sw.js = ${c}`);
try {
  const m = JSON.parse(read('manifest.webmanifest'));
  (m.icons || []).forEach(i => { if (!fs.existsSync(path.join(dir, i.src))) errors.push('Icône manquante : ' + i.src); });
} catch (e) { errors.push('manifest.webmanifest invalide : ' + e.message); }
[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => {
  try { new Function(m[1]); } catch (e) { errors.push(`Erreur de syntaxe dans le script n°${i + 1} de index.html : ${e.message}`); }
});
try { new Function(sw); } catch (e) { errors.push('Erreur de syntaxe dans sw.js : ' + e.message); }

const bi = process.argv.indexOf('--base');
if (bi > -1) {
  try {
    const ref = process.argv[bi + 1] + ':' + path.posix.join(dir === '.' ? '' : dir, 'index.html');
    const old = ver(execSync('git show ' + ref, { encoding: 'utf8' }));
    if (semver(old) && semver(v) && cmp(v, old) <= 0) errors.push(`La version (${v}) doit être supérieure à celle de main (${old}). Lance : node scripts/bump.js patch`);
  } catch (e) { console.log('Pas de version de référence sur main : comparaison ignorée.'); }
}
if (errors.length) { console.error('❌ Validation échouée :\n- ' + errors.join('\n- ')); process.exit(1); }
console.log(`✅ Validation réussie · version ${v}`);
