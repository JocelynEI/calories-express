import { TelemetryConsent } from './telemetry';

/**
 * V2.2 — préférence d'animation à trois états.
 *
 * `animations: boolean` ne suffisait pas : quand le téléphone demande de
 * réduire les animations, l'application se figeait sans que rien ne l'explique,
 * et aucun réglage ne permettait de passer outre. On distingue donc :
 *
 *  - `system` : suivre le réglage d'accessibilité du téléphone (par défaut) ;
 *  - `on`     : animer quoi qu'il arrive, choix explicite de la personne ;
 *  - `off`    : tout figer.
 */
export type MotionPreference = 'system' | 'on' | 'off';

export type ExperienceSettings = {
  motion: MotionPreference;
  welcome: boolean;
  activityPrompts: boolean;
  /**
   * Conservé pour relire sans erreur les sauvegardes des versions 2.1 à 2.4.3.
   * Ne décide plus rien depuis la V2.4.4 : il empêchait le parcours guidé de
   * revenir après un effacement du profil. Voir `shouldShowOnboarding`.
   */
  onboardingDone: boolean;
  /**
   * V3.1 — accord pour le journal de test (version web uniquement).
   * `unknown` tant que la question n'a pas été posée ; la réponse se change à
   * tout moment depuis le Profil.
   */
  testJournal: TelemetryConsent;
};
export const DEFAULT_EXPERIENCE: ExperienceSettings = { motion: 'system', welcome: true, activityPrompts: true, onboardingDone: false, testJournal: 'unknown' };

export function readExperienceSettings(value: unknown): ExperienceSettings {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  // Migration depuis les versions où le réglage était un simple interrupteur.
  const motion: MotionPreference =
    data.motion === 'on' || data.motion === 'off' || data.motion === 'system' ? data.motion
      : data.animations === false ? 'off'
        : 'system';
  return {
    motion,
    welcome: typeof data.welcome === 'boolean' ? data.welcome : true,
    activityPrompts: typeof data.activityPrompts === 'boolean' ? data.activityPrompts : true,
    onboardingDone: typeof data.onboardingDone === 'boolean' ? data.onboardingDone : false,
    // Une sauvegarde d'avant la V3.1 n'a pas répondu : la question sera posée.
    testJournal: data.testJournal === 'yes' || data.testJournal === 'no' ? data.testJournal : 'unknown',
  };
}

export function greeting(firstName: string, hour = new Date().getHours()): string {
  const salutation = hour >= 18 || hour < 5 ? 'Bonsoir' : 'Bonjour';
  const name = firstName.trim();
  return name ? `${salutation} ${name}` : salutation;
}


/**
 * V2.2 — faut-il réduire les animations ?
 *
 * Un choix explicite de la personne l'emporte sur le réglage du téléphone :
 * demander « toujours » veut dire toujours. Sans choix explicite, on suit le
 * téléphone, lecteur d'écran compris.
 */
export type MotionInputs = { motion: MotionPreference; systemReduced: boolean; screenReader: boolean };

export function shouldReduceMotion({ motion, systemReduced, screenReader }: MotionInputs) {
  if (motion === 'off') return true;
  if (motion === 'on') return false;
  return systemReduced || screenReader;
}

/** Ce que l'écran Profil affiche, pour que l'état ne soit jamais un mystère. */
export function motionStatus({ motion, systemReduced, screenReader }: MotionInputs) {
  if (motion === 'off') return 'Animations désactivées par ton réglage ci-dessus.';
  if (motion === 'on') return 'Animations toujours actives, même si ton téléphone demande de les réduire.';
  if (systemReduced) return 'Ton téléphone demande de réduire les animations, elles sont donc coupées. Choisis « Toujours » pour les garder quand même.';
  if (screenReader) return 'Un lecteur d’écran est actif : les animations sont réduites. Choisis « Toujours » pour les garder.';
  return 'Animations actives.';
}

/**
 * L'application est-elle au premier plan ?
 *
 * « unknown » compte comme actif. Au lancement, l'état de l'application peut
 * encore être indéterminé, et l'écouteur ne se déclenche qu'au **changement**
 * d'état : une valeur initiale fausse ne serait donc jamais corrigée, et les
 * animations ne démarreraient jamais.
 */
export function isAppActive(state: string | null | undefined) {
  return state !== 'background' && state !== 'inactive';
}
