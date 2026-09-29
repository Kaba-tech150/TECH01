/*
 * Extrait le contenu lisible d'une maquette HTML.
 *
 * Les maquettes de `design/` sont des pages Stitch : une seule ligne de 25 ko,
 * illisible telle quelle. On retire le `<script>`, le `<style>`, les attributs
 * bruyants, puis on garde la structure des balises pour retrouver l'ordre des
 * blocs.
 *
 * Usage : node scripts/extraire-maquette.js design/fichier.html
 */
const fs = require('fs');
const path = process.argv[2];

if (!path) {
  console.error('Usage : node scripts/extraire-maquette.js <fichier.html>');
  process.exit(1);
}

let html = fs.readFileSync(path, 'utf8');

html = html
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<svg[\s\S]*?<\/svg>/g, '')
  .replace(/<(img|input)[^>]*>/g, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/ class="[^"]*"/g, '')
  .replace(/ data-[\w-]+="[^"]*"/g, '')
  .replace(/ aria-[\w-]+="[^"]*"/g, '');

// Une balise ouvrante sur sa propre ligne rend la structure lisible.
html = html.replace(/<(div|section|main|nav|header|footer|li|p|h[1-6]|span|button|a)\b[^>]*>/g, '\n<$1>');
html = html.replace(/<\/(div|section|main|nav|header|footer|li|p|h[1-6]|button|a)>/g, '</$1>\n');

const lignes = html
  .split('\n')
  .map((ligne) => ligne.replace(/\s+/g, ' ').trim())
  .filter((ligne) => ligne.length > 0);

console.log(lignes.join('\n'));
