import { ActivityJournal, ActivityKind, Meal } from '../types';
import { ACTIVITY_LABELS } from './activity';
import { dayKey, shiftDay } from './date';

/**
 * V2.8 — les félicitations.
 *
 * Trois règles tiennent tout ce fichier :
 *
 * 1. **On félicite ce qui a été fait, jamais ce qui a été évité.** Rien ne
 *    complimente le fait d'avoir peu mangé : ce serait encourager la
 *    restriction, et ce n'est pas le rôle de cette application.
 * 2. **Quand il n'y a rien à dire, on ne dit rien.** Chaque fonction peut
 *    renvoyer `null`. L'absence de félicitations n'est jamais un reproche, et
 *    aucun message ne signale un manque.
 * 3. **Le mérite revient à la personne.** « Tu as nagé 30 minutes », pas
 *    « objectif atteint » : c'est un fait qu'elle a accompli, pas une note.
 *
 * Tout est calculé ici, sans affichage, pour être vérifiable par les tests.
 */

export type Praise = { key: string; title: string; message: string; detail?: string };

/* --------------------------------------------------------- une séance ---- */

/** Familles d'activités, pour varier les mots sans écrire neuf textes. */
const FAMILY: Record<ActivityKind, 'endurance' | 'water' | 'strength' | 'gentle'> = {
  walk: 'gentle', mobility: 'gentle',
  run: 'endurance', cycle: 'endurance', interval: 'endurance',
  swim: 'water', aqua: 'water',
  strength: 'strength', other: 'endurance',
};

const OPENINGS: Record<'endurance' | 'water' | 'strength' | 'gentle', string[]> = {
  endurance: ['Belle séance.', 'C’est noté, et c’est mérité.', 'Tu es allé au bout.'],
  water: ['Belle séance dans l’eau.', 'L’eau, c’est du travail.', 'C’est noté.'],
  strength: ['Séance de renforcement notée.', 'Du muscle et de la constance.', 'C’est noté.'],
  gentle: ['C’est noté.', 'Ça compte, vraiment.', 'Bien joué.'],
};

/**
 * Le texte qui suit dépend de la durée. Les seuils sont bas volontairement :
 * dix minutes valent d'être saluées, sinon seules les grosses séances
 * compteraient — c'est exactement ce qui décourage quand on débute.
 */
function effortLine(minutes: number, kind: ActivityKind): string {
  const activity = (ACTIVITY_LABELS[kind] ?? 'activité').toLocaleLowerCase('fr-FR');
  if (minutes < 10) return `Quelques minutes de ${activity}, c’est déjà une habitude qui se met en place.`;
  if (minutes < 25) return `${minutes} minutes de ${activity} : court, régulier, et ça tient dans une journée.`;
  if (minutes <= 45) return `${minutes} minutes de ${activity}, c’est une vraie séance.`;
  return `${minutes} minutes de ${activity} : tu as tenu longtemps, pense à boire et à récupérer.`;
}

/** Nombre de séances sur les sept jours qui se terminent à `day`. */
export function weekSessionCount(journal: ActivityJournal, day: string): number {
  const days = new Set(Array.from({ length: 7 }, (_, i) => shiftDay(day, -i)));
  return journal.sessions.filter(session => days.has(session.day)).length;
}

/** Jours consécutifs avec au moins une séance, en remontant depuis `day`. */
export function sessionStreak(journal: ActivityJournal, day: string): number {
  const active = new Set(journal.sessions.map(session => session.day));
  let streak = 0;
  for (let i = 0; i < 30; i += 1) {
    if (!active.has(shiftDay(day, -i))) break;
    streak += 1;
  }
  return streak;
}

export function sessionPraise(input: {
  kind: ActivityKind;
  minutes: number;
  activeKcal: number | null;
  assumedWeight?: boolean;
  journal: ActivityJournal;
  day: string;
  id?: string;
}): Praise {
  const { kind, minutes, activeKcal, journal, day } = input;
  const family = FAMILY[kind] ?? 'endurance';
  // La variante est tirée de la durée, pas au hasard : deux séances identiques
  // donnent le même message, ce qui évite l'effet machine à compliments.
  const opening = OPENINGS[family][minutes % OPENINGS[family].length];

  const pieces: string[] = [];
  if (activeKcal !== null && activeKcal > 0) {
    pieces.push(`Environ ${activeKcal.toLocaleString('fr-FR')} kcal dépensées${input.assumedWeight ? ' (estimation pour un poids moyen)' : ''}.`);
  }
  pieces.push('Ton repère du jour en tient compte.');

  const streak = sessionStreak(journal, day);
  const week = weekSessionCount(journal, day);
  let detail: string | undefined;
  if (streak >= 3) detail = `${streak} jours de suite avec une séance. Tu peux aussi t’accorder une journée de repos : elle fait partie de l’entraînement.`;
  else if (streak === 2) detail = 'Deux jours de suite. Tu installes quelque chose.';
  else if (week >= 3) detail = `${week} séances sur les sept derniers jours.`;
  else if (week === 2) detail = 'Deuxième séance de la semaine.';

  return {
    key: input.id ?? `${day}-${kind}-${minutes}`,
    title: opening,
    message: `${effortLine(minutes, kind)} ${pieces.join(' ')}`,
    detail,
  };
}

/* ------------------------------------------------- la journée alimentaire -- */

export type DayPraiseInput = {
  meals: Meal[];
  consumed: number;
  target: number;
  protein: number;
  proteinTarget: number;
  hasProfile: boolean;
  activeMinutes: number;
  day: string;
  today: string;
};

/**
 * La carte « journée réussie » de l'accueil.
 *
 * Elle n'apparaît que sur une journée terminée ou bien remplie, jamais au
 * milieu d'une matinée où deux repas manquent encore — sinon ce serait un
 * rappel déguisé. Et elle ne félicite jamais un total bas : au-dessous du
 * repère, elle se tait.
 */
export function dayPraise(input: DayPraiseInput): Praise | null {
  const { meals, consumed, target, protein, proteinTarget, hasProfile, activeMinutes, day, today } = input;
  const count = meals.length;
  if (count < 3) return null;

  const lines: string[] = [];
  const within = hasProfile && target > 0 && consumed >= target * 0.85 && consumed <= target * 1.05;
  const proteinOk = proteinTarget > 0 && protein >= proteinTarget * 0.9;

  if (within) lines.push('Ton total de la journée tombe dans ton repère.');
  else lines.push(`${count} repas notés : ta journée est complète dans le journal.`);
  if (proteinOk) lines.push('Les protéines y sont, ce qui aide à tenir la journée.');
  if (activeMinutes >= 15) lines.push(`Et ${activeMinutes} minutes de mouvement en plus.`);

  return {
    key: `jour-${day}`,
    title: day === today ? 'Belle journée' : 'Belle journée ce jour-là',
    message: lines.join(' '),
    detail: within ? undefined : 'Noter ses repas est déjà la moitié du travail : c’est ce qui rend le reste lisible.',
  };
}

/* ----------------------------------------------------------- régularité --- */

/** Jours consécutifs avec au moins un repas noté, en remontant depuis `day`. */
export function mealStreak(meals: Meal[], day: string): number {
  const noted = new Set(meals.map(meal => dayKey(new Date(meal.createdAt))));
  let streak = 0;
  for (let i = 0; i < 60; i += 1) {
    if (!noted.has(shiftDay(day, -i))) break;
    streak += 1;
  }
  return streak;
}

/**
 * Le mot sur la régularité. Volontairement rare : il n'apparaît qu'aux paliers
 * 3, 7, 14 et 30 jours, et jamais entre les deux. Un compliment quotidien
 * deviendrait une obligation quotidienne.
 */
export function streakPraise(days: number): Praise | null {
  const milestones: Record<number, string> = {
    3: 'Trois jours de suite notés. C’est le moment où ça devient une habitude.',
    7: 'Une semaine complète. Tu as maintenant de quoi lire une vraie tendance.',
    14: 'Deux semaines. Ce que tu vois dans la progression commence à être fiable.',
    30: 'Un mois. Peu de gens vont jusque-là.',
  };
  const message = milestones[days];
  if (!message) return null;
  return { key: `serie-${days}`, title: `${days} jours de suite`, message };
}
