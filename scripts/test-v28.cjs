const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const privacy = read('public/confidentialite/index.html');
const support = read('public/assistance/index.html');
const legal = read('src/config/legal.ts');
const profile = read('src/screens/ProfileScreen.tsx');

/**
 * V3.6 — la politique de confidentialité, exigée par Apple (dans la fiche ET
 * dans l'application) et par Google (dans la fiche).
 */

test('Les deux pages existent et leurs adresses correspondent aux dossiers publiés', () => {
  assert.match(legal, /PRIVACY_URL = `\$\{SITE\}\/confidentialite\/`/);
  assert.match(legal, /SUPPORT_URL = `\$\{SITE\}\/assistance\/`/);
  assert.match(legal, /SITE = 'https:\/\//, 'des adresses en https');
});

test('La politique dit ce qui part sur internet, et seulement ça', () => {
  assert.ok(privacy.includes('ne collecte aucune donnée personnelle'));
  assert.ok(privacy.includes('Open Food Facts'), 'la recherche de produits');
  assert.ok(privacy.includes('jsDelivr'), 'le moteur de lecture d’étiquette');
  assert.ok(privacy.includes('adresse IP'), 'ce que voit tout service contacté');
  assert.ok(privacy.includes('pas dans les applications iPhone et Android'), 'le journal de test est réservé au site');
});

test('Les pages ne chargent rien de l’extérieur', () => {
  // Une politique de confidentialité qui appellerait une police ou un script
  // tiers se contredirait elle-même.
  for (const page of [privacy, support]) {
    assert.equal(/<script|<link[^>]+stylesheet|fonts\.googleapis|<img/i.test(page), false);
  }
});

test('Aucune valeur provisoire ne part en ligne', () => {
  for (const page of [privacy, support]) {
    assert.equal(/__[A-Z]+__/.test(page), false, 'responsable et contact doivent être renseignés');
    assert.match(page, /mailto:[^"@\s]+@[^"\s]+\.[a-z]{2,}"/, 'une adresse de contact réelle');
  }
});

test('Le Profil mène à la politique et à l’aide, avec un repli si le lien échoue', () => {
  assert.ok(profile.includes('onPress={() => openLegal(PRIVACY_URL)}'));
  assert.ok(profile.includes('onPress={() => openLegal(SUPPORT_URL)}'));
  assert.ok(profile.includes('accessibilityRole="link"'));
  assert.ok(profile.includes('.catch(() => setLegalError(url))'), 'l’adresse s’affiche si le navigateur ne s’ouvre pas');
});

test('Rien dans l’appli publiée ne parle d’outil de test ou de prototype', () => {
  assert.equal(profile.includes('Expo Go'), false, 'le Profil ne parle plus d’Expo Go');
  const products = read('src/services/products.ts');
  assert.equal(/prototype/i.test(products), false, 'Open Food Facts reçoit le nom de l’appli, pas « prototype »');
  assert.ok(products.includes('`CaloriesExpress (+${SUPPORT_URL})`'), 'avec un moyen de contact, comme le demande Open Food Facts');
});
