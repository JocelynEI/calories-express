const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const file = (name) => path.join(__dirname, '..', name);
const read = (name) => fs.readFileSync(file(name), 'utf8');
const app = JSON.parse(read('app.json')).expo;

/** Lit l'en-tête d'un PNG : largeur, hauteur et type de couleur (2 = RVB sans transparence). */
const png = (name) => {
  const bytes = fs.readFileSync(file(name));
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colorType: bytes[25] };
};

/**
 * V3.7 — ce que les stores vérifient avant même de regarder l'appli.
 */

test('L’icône iOS est un carré plein de 1024 px, sans transparence', () => {
  // Apple refuse une icône qui a un canal alpha ; il arrondit lui-même les coins.
  const icon = png(app.icon);
  assert.equal(icon.width, 1024);
  assert.equal(icon.height, 1024);
  assert.equal(icon.colorType, 2, 'RVB sans canal alpha');
  assert.equal(/rx="/.test(read('assets/brand-icon.svg').split('<g>')[0]), false, 'le fond n’a pas de coins arrondis');
});

test('Les icônes reprennent la palette « L’assiette », sans trace de lavande', () => {
  assert.equal(app.android.adaptiveIcon.backgroundColor, '#2A7246');
  for (const svg of ['assets/brand-icon.svg', 'assets/android-foreground.svg', 'assets/android-monochrome.svg']) {
    const source = read(svg).toUpperCase();
    for (const old of ['#5B3FE0', '#E9E3FF', '#D5CCFF', '#1D1B4B']) assert.equal(source.includes(old), false, `${old} dans ${svg}`);
  }
});

test('Le premier plan Android tient dans la zone sûre des masques', () => {
  for (const svg of ['assets/android-foreground.svg', 'assets/android-monochrome.svg']) {
    assert.ok(read(svg).includes('scale(0.72)'), `${svg} doit être réduit`);
  }
  const fg = png(app.android.adaptiveIcon.foregroundImage);
  assert.equal(fg.width, 1024);
});

test('Apple ne pose plus la question du chiffrement à chaque envoi', () => {
  assert.equal(app.ios.config.usesNonExemptEncryption, false);
});

test('Les builds de production numérotent toutes seules', () => {
  const eas = JSON.parse(read('eas.json'));
  assert.equal(eas.build.production.autoIncrement, true);
  assert.equal(eas.cli.appVersionSource, 'remote');
  assert.ok(eas.submit.production, 'un profil d’envoi aux stores');
});
