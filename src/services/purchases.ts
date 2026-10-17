/**
 * V5.0 — l'achat du premium.
 *
 * Ce fichier est le seul endroit qui parle aux stores. Aujourd'hui il ne parle
 * à personne : l'achat réel (App Store / Google Play) sera branché ici, avec
 * une bibliothèque d'achats intégrés, au moment de la publication. Tant qu'il
 * ne l'est pas :
 *
 * - dans l'application de développement (Expo Go), l'achat est simulé, pour
 *   pouvoir tester les écrans verrouillés et débloqués ;
 * - dans une version publiée, rien ne peut débloquer le premium, et l'écran
 *   le dit plutôt que de faire semblant.
 *
 * `__DEV__` est faux dans toute version publiée : le déblocage de test ne peut
 * pas s'y glisser.
 */

export type PurchaseOutcome =
  | { status: 'unlocked'; source: 'store' | 'test' }
  | { status: 'nothing' }
  | { status: 'cancelled' }
  | { status: 'unavailable' };

/** Passe à `true` quand l'achat réel est branché et testé sur les deux stores. */
export const STORE_CONNECTED = false;

export const TEST_MODE = typeof __DEV__ !== 'undefined' && __DEV__;

export const UNAVAILABLE_MESSAGE = 'Les achats ne sont pas encore ouverts dans cette version de l’application.';

export async function buyPremium(): Promise<PurchaseOutcome> {
  if (TEST_MODE) return { status: 'unlocked', source: 'test' };
  // Ici, plus tard : lancer l'achat « premium_vie » et attendre la réponse du store.
  return { status: 'unavailable' };
}

export async function restorePurchases(): Promise<PurchaseOutcome> {
  // Ici, plus tard : demander au store les achats déjà faits avec ce compte.
  if (TEST_MODE) return { status: 'nothing' };
  return { status: 'unavailable' };
}
