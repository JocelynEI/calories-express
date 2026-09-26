/**
 * V3.1 — le journal de test.
 *
 * Pendant la phase de test, la version **web** peut envoyer une ligne à un
 * tableur à chaque action importante : « a ouvert Progression », « a
 * enregistré une séance », « a quitté l'ajout de repas sans valider ». C'est
 * ce qui permet de voir où les gens butent sans avoir à leur demander.
 *
 * Trois règles tiennent ce fichier, et chacune a son test :
 *
 * 1. **On envoie des noms d'actions, jamais du contenu.** Aucun aliment,
 *    aucun poids, aucune calorie, aucun prénom ne peut sortir d'ici : la
 *    liste des événements est fermée, celle des champs aussi, et chaque
 *    valeur doit correspondre à une forme connue. Un message qui ne passe pas
 *    ce filtre n'est pas corrigé, il est jeté.
 * 2. **Rien ne part sans accord.** Tant que la personne n'a pas dit oui,
 *    `shouldSend` répond non. Elle peut revenir sur son choix à tout moment.
 * 3. **Rien ne part hors du web.** Le journal ne sert qu'à la phase de test
 *    sur le site ; sous Expo Go et sur un vrai téléphone, il est inerte.
 *
 * Tout est calculé ici, sans réseau ni React, pour rester vérifiable.
 */

export type TelemetryConsent = 'unknown' | 'yes' | 'no';

/** La liste fermée des actions notées. Rien d'autre ne peut être envoyé. */
export const TELEMETRY_EVENTS = [
  // Écrans ouverts
  'ecran-accueil', 'ecran-journal', 'ecran-progression', 'ecran-profil',
  // Repas
  'ouvre-ajout-repas', 'repas-ajoute', 'repas-modifie', 'ajout-repas-abandonne',
  'aliment-cherche', 'etiquette-scannee',
  // Activité
  'ouvre-activite', 'activite-commencee', 'seance-estimee', 'seance-enregistree', 'activite-abandonnee',
  // Profil
  'profil-commence', 'profil-termine', 'profil-passe',
  // Divers
  'premiere-ouverture', 'erreur-affichee',
] as const;

export type TelemetryEvent = (typeof TELEMETRY_EVENTS)[number];

const EVENTS = new Set<string>(TELEMETRY_EVENTS);
export function isTelemetryEvent(value: unknown): value is TelemetryEvent {
  return typeof value === 'string' && EVENTS.has(value);
}

/**
 * Le contexte technique : de quoi répondre à « ça marche pas chez moi » sans
 * savoir qui est « moi ». La largeur est rangée dans une des trois tailles
 * ci-dessous, jamais envoyée au pixel près — une largeur exacte, combinée au
 * reste, aide à reconnaître un appareil.
 */
export type ScreenSize = 'telephone' | 'tablette' | 'ordinateur';
export function screenSize(width: number): ScreenSize {
  if (!Number.isFinite(width) || width < 600) return 'telephone';
  if (width < 1000) return 'tablette';
  return 'ordinateur';
}

export type TelemetryMessage = {
  /** Horodatage ISO, en UTC. */
  at: string;
  /** Numéro de visiteur, tiré au sort sur ce navigateur. Aucun lien avec une identité. */
  visiteur: string;
  /** Numéro de cette visite : deux visites du même navigateur restent distinctes. */
  visite: string;
  evenement: TelemetryEvent;
  version: string;
  ecran: ScreenSize;
};

/**
 * Un numéro de visiteur commence toujours par un chiffre et fait dix
 * caractères. Ce n'est pas de la coquetterie : cette forme ne peut pas être
 * un prénom ni un mot, donc un nom glissé là par erreur ne passe pas le
 * filtre — et le message entier est jeté.
 */
const ID = /^[0-9][a-z0-9]{9}$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const SIZES = new Set<string>(['telephone', 'tablette', 'ordinateur']);

/** Les seules clés autorisées dans un message. Toute autre le fait rejeter. */
export const ALLOWED_KEYS = ['at', 'visiteur', 'visite', 'evenement', 'version', 'ecran'] as const;

/**
 * Le filtre. Il ne nettoie pas un message douteux, il le refuse : un message
 * à moitié conforme veut dire qu'un appel s'est trompé quelque part, et on
 * préfère perdre une ligne de statistique que laisser passer une donnée.
 */
export function validMessage(value: unknown): value is TelemetryMessage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  const keys = Object.keys(data);
  if (keys.length !== ALLOWED_KEYS.length) return false;
  if (!keys.every(key => (ALLOWED_KEYS as readonly string[]).includes(key))) return false;
  if (typeof data.at !== 'string' || !ISO.test(data.at)) return false;
  if (typeof data.visiteur !== 'string' || !ID.test(data.visiteur)) return false;
  if (typeof data.visite !== 'string' || !ID.test(data.visite)) return false;
  if (typeof data.version !== 'string' || !VERSION.test(data.version)) return false;
  if (typeof data.ecran !== 'string' || !SIZES.has(data.ecran)) return false;
  return isTelemetryEvent(data.evenement);
}

export type MessageInput = {
  event: string;
  visiteur: string;
  visite: string;
  version: string;
  width: number;
  now?: Date;
};

/** Construit le message, ou renvoie `null` si quoi que ce soit cloche. */
export function buildMessage(input: MessageInput): TelemetryMessage | null {
  const message = {
    at: (input.now ?? new Date()).toISOString(),
    visiteur: input.visiteur,
    visite: input.visite,
    evenement: input.event,
    version: input.version,
    ecran: screenSize(input.width),
  };
  return validMessage(message) ? message : null;
}

/**
 * Un numéro tiré au sort. Ce n'est pas un identifiant de personne : il ne
 * voyage pas d'un site à l'autre, il disparaît si le navigateur est nettoyé,
 * et il ne sert qu'à relier entre elles les actions d'une même visite.
 */
export function newId(random: () => number = Math.random): string {
  let id = String(Math.floor(Math.abs(random()) * 10) % 10);
  while (id.length < 10) id += Math.floor(Math.abs(random()) * 36 ** 5).toString(36).padStart(5, '0');
  return id.slice(0, 10);
}

export type SendConditions = {
  consent: TelemetryConsent;
  platform: string;
  url: string;
};

/**
 * La question posée avant chaque envoi. Trois « oui » sont nécessaires :
 * la personne a accepté, on est bien sur le site, et une adresse de journal a
 * été configurée. Sans l'une des trois, le journal n'existe pas.
 */
export function shouldSend({ consent, platform, url }: SendConditions): boolean {
  if (consent !== 'yes') return false;
  if (platform !== 'web') return false;
  return url.trim().startsWith('https://');
}

/**
 * Faut-il montrer l'écran qui demande l'accord ? Uniquement sur le site, une
 * seule fois, et seulement si un journal est configuré : sans adresse, la
 * question n'aurait aucun sens.
 */
export function shouldAskConsent({ consent, platform, url }: SendConditions): boolean {
  return consent === 'unknown' && platform === 'web' && url.trim().startsWith('https://');
}
