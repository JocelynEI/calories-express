const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const { colors, fonts, radii, typeScale, shadows } = require('../.test-dist/theme.js');

/* ------------------------------------------ design system V2.7 */

const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (hex) => { const n = parseInt(hex.slice(1, 7), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

test('Les couleurs du brief sont reprises exactement', () => {
  const brief = {
    violet: '#5B48E8', navy: '#1A1B4B',
    mintFill: '#00C4CC', mintPale: '#E6F8F8',
    warmFill: '#EAC15C', warmPale: '#FFF9EB',
    greenFill: '#4CAF50', greenPale: '#EBF7ED',
    purpleFill: '#8C62FF', purplePale: '#F3EFFF',
    background: '#F5F7FB', card: '#FFFFFF', ink: '#1E2022', muted: '#6C757D',
  };
  for (const [key, value] of Object.entries(brief)) assert.equal(colors[key], value, `${key} doit valoir ${value}`);
});

test('Chaque encre d’accent est lisible sur sa pastille et sous un texte blanc', () => {
  // Les accents du brief échouent comme couleur de texte (cyan 2,2:1, jaune
  // 1,7:1, vert 2,8:1). Leurs encres doivent passer le seuil WCAG AA.
  for (const name of ['mint', 'warm', 'green', 'purple']) {
    const ink = colors[`${name}Ink`];
    const pale = colors[`${name}Pale`];
    assert.ok(contrast(ink, pale) >= 4.5, `${name}Ink sur ${name}Pale : ${contrast(ink, pale).toFixed(2)}`);
    assert.ok(contrast('#FFFFFF', ink) >= 4.5, `blanc sur ${name}Ink : ${contrast('#FFFFFF', ink).toFixed(2)}`);
  }
  assert.ok(contrast(colors.violet, colors.card) >= 4.5, 'le violet principal doit rester lisible');
  assert.ok(contrast(colors.ink, colors.background) >= 7, 'le texte principal doit être très contrasté');
});

test('La typographie suit la hiérarchie du brief', () => {
  assert.equal(typeScale.display.fontSize, 28);
  assert.equal(typeScale.section.fontSize, 20);
  assert.equal(typeScale.cardTitle.fontSize, 16);
  assert.equal(typeScale.numeric.fontSize, 32);
  assert.equal(typeScale.body.fontSize, 14);
  assert.equal(typeScale.caption.fontSize, 12);
  assert.equal(typeScale.numeric.fontFamily, fonts.extrabold);
  assert.equal(typeScale.cardTitle.fontFamily, fonts.semibold);
  for (const family of Object.values(fonts)) assert.match(family, /^PlusJakartaSans_\d00/);
});

test('Rayons et ombre du brief', () => {
  assert.equal(radii.large, 20, 'cartes : 20 px');
  assert.equal(radii.pill, 100, 'pilules : 100 px');
  assert.equal(radii.input, 16, 'champs : 16 px');
  assert.equal(shadows.card.shadowOpacity, 0.04, 'ombre très légère');
  assert.equal(shadows.card.shadowOffset.height, 8);
});

test('Les cinq graisses de Plus Jakarta Sans sont chargées au démarrage', () => {
  const app = read('App.tsx');
  for (const weight of ['400Regular', '500Medium', '600SemiBold', '700Bold', '800ExtraBold']) {
    assert.ok(app.includes(`PlusJakartaSans_${weight}`), `graisse non chargée : ${weight}`);
  }
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.dependencies['@expo-google-fonts/plus-jakarta-sans'], 'paquet de police manquant');
  assert.ok(pkg.dependencies['expo-font'], 'expo-font manquant');
});

test('La jauge est un arc de 240° et affiche le consommé', () => {
  const gauge = read('src/components/CalorieGauge.tsx');
  assert.ok(gauge.includes('describeArc(center, center, radius, 150, 390)'), 'arc de 150° à 390°');
  assert.ok(gauge.includes('(240 / 360)'), 'longueur calculée sur 240°');
  assert.ok(gauge.includes('sur ${target.toLocaleString'), 'le repère s’affiche sous le total');
});

test('Les moments de la journée suivent les catégories du brief', () => {
  const card = read('src/components/MealCard.tsx');
  assert.ok(/Petit-déjeuner'\) return \{ pale: colors\.warmPale/.test(card), 'petit-déjeuner orangé');
  assert.ok(/Dîner'\) return \{ pale: colors\.purplePale/.test(card), 'dîner violet doux');
  assert.ok(/return \{ pale: colors\.greenPale, ink: colors\.greenInk \}/.test(card), 'déjeuner vert');
  assert.ok(/Snack'\) return \{ pale: colors\.mintPale/.test(card), 'collation menthe');
});

test('Sur le web, « Effacer mon profil » demande confirmation au navigateur', () => {
  const profile = read('src/screens/ProfileScreen.tsx');
  assert.ok(profile.includes("Platform.OS === 'web'") && profile.includes('window.confirm('), 'repli web manquant');
});
