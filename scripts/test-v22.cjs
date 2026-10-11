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

test('Les couleurs de « L’assiette » (V3.4) sont reprises exactement', () => {
  const palette = {
    violet: '#2A7246', navy: '#1F3A2E',
    mintFill: '#3FA7B5', mintPale: '#E2F2F3',
    warmFill: '#F29A4A', warmPale: '#FCEBD7',
    greenFill: '#7BB662', greenPale: '#E7F1DF',
    purpleFill: '#A0679B', purplePale: '#F4E9F2',
    background: '#EEF2EA', card: '#FFFFFF', ink: '#1F3A2E', muted: '#4E6357',
  };
  for (const [key, value] of Object.entries(palette)) assert.equal(colors[key], value, `${key} doit valoir ${value}`);
});

test('Les pastilles de la couleur principale sont vertes, le prune est réservé au dîner (V3.4)', () => {
  // Le pâle du violet servait de fond à tout ce qui portait la couleur
  // principale. Devenu prune, il aurait mis du rose derrière du vert.
  assert.equal(colors.sagePale, colors.violetPale);
  for (const file of ['src/components/CalorieGauge.tsx', 'src/components/PraiseCard.tsx', 'src/components/GuideCard.tsx', 'src/screens/TodayScreen.tsx']) {
    assert.ok(!read(file).includes('colors.purplePale'), `${file} : le prune n’accompagne pas la couleur principale`);
  }
});

test('Plus aucune teinte lavande codée en dur dans les écrans (V3.4)', () => {
  // Les anciennes teintes violettes vivaient dans une dizaine de composants,
  // hors du thème : elles seraient restées violettes sur fond vert.
  const dirs = ['src/components', 'src/screens'];
  const lavender = ['#DFDDF8', '#DEDDFF', '#C8C9FF', '#EDEBFA', '#E2DCFF', '#CAC3E9', '#CEC5ED', '#F1EDFF', '#C9BCF7', '#D6CCF6', '#CFC5FF', '#C9CEDC'];
  for (const dir of dirs) {
    for (const name of fs.readdirSync(path.join(__dirname, '..', dir))) {
      const source = read(`${dir}/${name}`).toUpperCase();
      for (const hex of lavender) assert.ok(!source.includes(hex), `${hex} encore présent dans ${dir}/${name}`);
    }
  }
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
  assert.ok(contrast(colors.violet, colors.card) >= 4.5, 'la couleur principale doit rester lisible');
  assert.ok(contrast(colors.violet, colors.violetPale) >= 4.5, 'la couleur principale doit rester lisible sur sa pastille');
  assert.ok(contrast('#FFFFFF', colors.violet) >= 4.5, 'un texte blanc doit rester lisible sur un bouton principal');
  assert.ok(contrast(colors.onDarkMuted, colors.navy) >= 4.5, 'le texte secondaire doit rester lisible sur fond sombre');
  assert.ok(contrast(colors.muted, colors.background) >= 4.5, 'le texte secondaire doit rester lisible sur l’écran');
  assert.ok(contrast(colors.ink, colors.background) >= 7, 'le texte principal doit être très contrasté');
});

test('La typographie suit la hiérarchie du brief', () => {
  assert.equal(typeScale.display.fontSize, 28);
  assert.equal(typeScale.section.fontSize, 20);
  assert.equal(typeScale.cardTitle.fontSize, 16);
  assert.equal(typeScale.numeric.fontSize, 32);
  assert.equal(typeScale.body.fontSize, 14);
  assert.equal(typeScale.caption.fontSize, 12);
  assert.equal(typeScale.numeric.fontFamily, fonts.displayHeavy);
  assert.equal(typeScale.display.fontFamily, fonts.display);
  assert.equal(typeScale.section.fontFamily, fonts.display);
  assert.equal(typeScale.cardTitle.fontFamily, fonts.semibold);
  for (const key of ['regular', 'medium', 'semibold', 'bold', 'extrabold']) assert.match(fonts[key], /^Figtree_\d00/);
  for (const key of ['display', 'displayHeavy']) assert.match(fonts[key], /^BricolageGrotesque_\d00/);
});

test('Rayons et ombre du brief', () => {
  assert.equal(radii.large, 20, 'cartes : 20 px');
  assert.equal(radii.pill, 100, 'pilules : 100 px');
  assert.equal(radii.input, 16, 'champs : 16 px');
  assert.equal(shadows.card.shadowOpacity, 0.04, 'ombre très légère');
  assert.equal(shadows.card.shadowOffset.height, 8);
});

test('Les polices Figtree et Bricolage Grotesque sont chargées au démarrage (V3.4)', () => {
  const app = read('App.tsx');
  for (const family of Object.values(fonts)) {
    assert.ok(app.includes(family), `graisse non chargée : ${family}`);
  }
  assert.ok(!app.includes('PlusJakarta'), 'l’ancienne police ne doit plus être chargée');
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.dependencies['@expo-google-fonts/figtree'], 'paquet Figtree manquant');
  assert.ok(pkg.dependencies['@expo-google-fonts/bricolage-grotesque'], 'paquet Bricolage Grotesque manquant');
  assert.ok(!pkg.dependencies['@expo-google-fonts/plus-jakarta-sans'], 'l’ancien paquet de police doit être retiré');
  assert.ok(pkg.dependencies['expo-font'], 'expo-font manquant');
});

test('La jauge est une assiette pleine, avec ce qu’il reste au centre (V3.5)', () => {
  const gauge = read('src/components/CalorieGauge.tsx');
  assert.ok(gauge.includes('2 * Math.PI * rimRadius'), 'le bord fait tout le tour de l’assiette');
  assert.ok(gauge.includes('rotation={-90}'), 'la progression part du haut');
  assert.ok(gauge.includes("'Il te reste'") && gauge.includes("'Au-dessus de'"), 'le centre annonce le restant ou l’écart');
  // Une information, un seul endroit : le repère est écrit sous l'assiette, le
  // total mangé en tête de « Dans ton assiette ».
  assert.ok(!gauge.includes('sur ${target.toLocaleString'), 'le total et le repère ne sont plus répétés au centre');
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
