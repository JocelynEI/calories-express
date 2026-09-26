import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions, Platform } from 'react-native';
import appConfig from '../../app.json';
import { TEST_JOURNAL_URL } from '../config/test-journal';
import { buildMessage, newId, shouldSend, TelemetryConsent } from '../domain/telemetry';

/**
 * V3.1 — l'envoi du journal de test.
 *
 * Toute la décision est dans `src/domain/telemetry.ts` ; ici il n'y a que la
 * plomberie : un numéro de visiteur gardé sur ce navigateur, une file
 * d'attente le temps de le relire, et un `fetch` dont l'échec ne se voit
 * nulle part.
 *
 * Rien de ce fichier ne doit pouvoir faire tomber l'application : une
 * statistique manquante n'est pas un incident, un écran blanc si.
 */

const KEY = '@calories-express/journal-test-v1';
const MAX_QUEUE = 40;

let consent: TelemetryConsent = 'unknown';
let visiteur = '';
let visite = newId();
const waiting: string[] = [];

/** Relu une seule fois au démarrage. Un échec de lecture donne un nouveau numéro. */
const loading = (async () => {
  if (Platform.OS !== 'web') return;
  try {
    const stored = await AsyncStorage.getItem(KEY);
    visiteur = stored && /^[0-9][a-z0-9]{9}$/.test(stored) ? stored : newId();
    if (stored !== visiteur) await AsyncStorage.setItem(KEY, visiteur);
  } catch {
    visiteur = newId();
  }
  flush();
})();

export function setTestJournalConsent(next: TelemetryConsent) {
  const changed = consent !== next;
  consent = next;
  if (changed && next === 'yes') flush();
  // Un refus vide la file : ce qui n'est pas encore parti ne partira jamais.
  if (next !== 'yes') waiting.length = 0;
}

/** Nouvelle visite : appelé au retour sur l'application après une absence. */
export function newTestJournalVisit() {
  visite = newId();
}

function width(): number {
  try {
    return Dimensions.get('window').width;
  } catch {
    return 0;
  }
}

function post(body: string) {
  try {
    // `no-cors` + texte simple : la requête part sans demande préalable au
    // serveur de Google, qui n'y répondrait pas. On ne lit donc pas la
    // réponse — on n'en a pas besoin.
    void fetch(TEST_JOURNAL_URL, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    }).catch(() => undefined);
  } catch {
    // Pas de réseau, journal indisponible, navigateur qui refuse : sans effet.
  }
}

function flush() {
  if (!visiteur || !shouldSend({ consent, platform: Platform.OS, url: TEST_JOURNAL_URL })) return;
  while (waiting.length) {
    const event = waiting.shift();
    if (!event) continue;
    const message = buildMessage({
      event, visiteur, visite,
      version: appConfig.expo.version,
      width: width(),
    });
    if (message) post(JSON.stringify(message));
  }
}

/**
 * Note une action. Le nom doit appartenir à la liste fermée du domaine :
 * sinon `buildMessage` renvoie `null` et rien ne part.
 */
export function track(event: string) {
  if (!shouldSend({ consent, platform: Platform.OS, url: TEST_JOURNAL_URL })) return;
  if (waiting.length >= MAX_QUEUE) return;
  waiting.push(event);
  if (visiteur) flush();
  else void loading;
}
