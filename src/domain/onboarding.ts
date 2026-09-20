import { Profile } from '../types';
import { calculateBmr } from './calories';
import { energyPlan, profileIssue } from './energy';

/**
 * V1.9 — le parcours de création du profil, au premier lancement.
 *
 * Toute la logique vit ici, en fonctions pures : ce qu'une étape demande, si
 * elle est complète, et ce que valide chaque champ. L'écran ne fait que
 * dessiner et animer. C'est ce qui permet de tester ce parcours sans lancer
 * l'application — et d'y ajouter une étape sans toucher aux animations.
 *
 * Il n'y a **pas de compte** : rien n'est envoyé nulle part, aucun mot de passe
 * n'est demandé. « Créer son profil », ici, veut dire enregistrer sur ce
 * téléphone les quelques informations qui servent à estimer un repère.
 */

export type StepId = 'welcome' | 'name' | 'goal' | 'body' | 'activity' | 'result';

export const STEP_ORDER: StepId[] = ['welcome', 'name', 'goal', 'body', 'activity', 'result'];

export type Step = {
  id: StepId;
  /** Ce que Jaws dit pendant l'étape. Court : il est lu en passant. */
  says: string;
  title: string;
  subtitle: string;
  /** Une étape sans saisie ne compte pas dans la barre de progression. */
  counts: boolean;
};

export const STEPS: Record<StepId, Step> = {
  welcome: {
    id: 'welcome',
    says: 'Content de te voir. On y va doucement.',
    title: 'Ton équilibre,\nà ton rythme.',
    subtitle: 'Quelques questions pour estimer ton repère quotidien. Deux minutes, pas plus, et tu peux passer à tout moment.',
    counts: false,
  },
  name: {
    id: 'name',
    says: 'Comment veux-tu que je t’appelle ?',
    title: 'Ton prénom',
    subtitle: 'Facultatif. Il sert uniquement à te dire bonjour, et il ne quitte jamais ce téléphone.',
    counts: true,
  },
  goal: {
    id: 'goal',
    says: 'Quelle direction, en ce moment ?',
    title: 'Ton objectif',
    subtitle: 'Tu pourras en changer quand tu veux, sans rien perdre de ton journal.',
    counts: true,
  },
  body: {
    id: 'body',
    says: 'Ces chiffres servent à la formule, rien d’autre.',
    title: 'Toi, en chiffres',
    subtitle: 'Ils entrent dans une estimation de tes besoins au repos. Aucun n’est transmis.',
    counts: true,
  },
  activity: {
    id: 'activity',
    says: 'Et une journée ordinaire, ça ressemble à quoi ?',
    title: 'Ton activité habituelle',
    subtitle: 'Hors séances de sport : c’est ce que tu bouges naturellement dans une journée.',
    counts: true,
  },
  result: {
    id: 'result',
    says: 'Voilà ton repère. Il t’appartient.',
    title: 'Ton repère',
    subtitle: 'Une estimation de départ, à ajuster avec le temps.',
    counts: false,
  },
};

export const GOAL_CHOICES: { id: Profile['goal']; label: string; detail: string }[] = [
  { id: 'lose', label: 'Perdre du poids', detail: 'Repère sous ton maintien estimé' },
  { id: 'maintain', label: 'Maintenir', detail: 'Repère au niveau de tes besoins' },
  { id: 'gain', label: 'Prendre du poids', detail: 'Repère au-dessus de ton maintien' },
];

export const ACTIVITY_CHOICES: { id: Profile['activityLevel']; label: string; detail: string }[] = [
  { id: 'sedentary', label: 'Sédentaire', detail: 'Assis la plupart du temps' },
  { id: 'light', label: 'Léger', detail: 'Quelques déplacements dans la journée' },
  { id: 'moderate', label: 'Modéré', detail: 'Debout ou en mouvement souvent' },
  { id: 'active', label: 'Actif', detail: 'Métier physique ou beaucoup de marche' },
];

export const FIELD_LIMITS = {
  age: { min: 18, max: 120, unit: 'ans' },
  heightCm: { min: 120, max: 230, unit: 'cm' },
  weightKg: { min: 35, max: 300, unit: 'kg' },
} as const;

export type FieldName = keyof typeof FIELD_LIMITS;

/** Message d'aide d'un champ, ou `null` si la valeur convient. */
export function fieldIssue(field: FieldName, value: number | null): string | null {
  const { min, max, unit } = FIELD_LIMITS[field];
  if (value === null || !Number.isFinite(value)) {
    return field === 'age' ? 'Indique ton âge en années.' : `Indique une valeur en ${unit}.`;
  }
  if (field === 'age' && !Number.isInteger(value)) return 'Indique ton âge en années entières.';
  if (value < min || value > max) {
    return field === 'age'
      ? `Cette version s’adresse aux adultes : indique un âge entre ${min} et ${max} ans.`
      : `Indique une valeur entre ${min} et ${max} ${unit}.`;
  }
  return null;
}

/**
 * Ce qui empêche de quitter une étape, ou `null` si elle est complète.
 * Le prénom n'est jamais bloquant : il est facultatif, et le dire suffit.
 */
export function stepIssue(step: StepId, draft: Profile): string | null {
  if (step === 'body') {
    return fieldIssue('age', draft.age) ?? fieldIssue('heightCm', draft.heightCm) ?? fieldIssue('weightKg', draft.weightKg);
  }
  if (step === 'activity') {
    // Le repère final est vérifié ici : c'est la dernière étape avant l'annonce.
    return profileIssue({ ...draft, targetMode: 'automatic' });
  }
  return null;
}

export const stepIndex = (step: StepId) => STEP_ORDER.indexOf(step);
export const nextStep = (step: StepId): StepId | null => STEP_ORDER[stepIndex(step) + 1] ?? null;
export const previousStep = (step: StepId): StepId | null => STEP_ORDER[stepIndex(step) - 1] ?? null;

/**
 * Avancement affiché : seules les étapes de saisie comptent.
 *
 * L'étape en cours est incluse, pour que la première question montre déjà un
 * quart de barre : une barre entièrement vide donne l'impression que rien n'a
 * commencé.
 */
export function progressAt(step: StepId) {
  const counted = STEP_ORDER.filter(id => STEPS[id].counts);
  const done = counted.filter(id => stepIndex(id) <= stepIndex(step)).length;
  return { done, total: counted.length, ratio: done / counted.length };
}

/**
 * Le résumé annoncé à la dernière étape. Il détaille le chemin du calcul
 * plutôt que de sortir un nombre sans explication : besoins au repos, maintien
 * estimé, écart prévu, puis repère.
 */
export function summarize(draft: Profile) {
  const profile: Profile = { ...draft, targetMode: 'automatic' };
  const issue = profileIssue(profile);
  if (issue) return { issue, bmr: 0, maintenance: 0, target: 0, difference: 0, direction: 'maintenance' as const };
  const plan = energyPlan(profile);
  return {
    issue: null,
    bmr: calculateBmr(profile),
    maintenance: plan.maintenance,
    target: plan.target,
    difference: plan.plannedDifference,
    direction: plan.direction,
  };
}

/** Phrase de conclusion, cohérente avec le ton du reste de l'application. */
export function resultSentence(direction: 'deficit' | 'surplus' | 'maintenance', difference: number) {
  const amount = Math.abs(Math.round(difference)).toLocaleString('fr-FR');
  if (direction === 'deficit') return `L’écart de ${amount} kcal est déjà compris dans ce repère. Il ne faut pas le retirer une deuxième fois.`;
  if (direction === 'surplus') return `Ce repère ajoute ${amount} kcal à ton maintien estimé. C’est le nombre à suivre, tel quel.`;
  return 'Ce repère correspond à tes besoins estimés pour maintenir ton poids.';
}

/**
 * V2.4.4 — faut-il montrer le parcours en six étapes ?
 *
 * La règle d'origine gardait en mémoire, **définitivement**, le fait d'avoir
 * déjà vu le parcours. Elle avait une conséquence que je n'avais pas vue :
 * effacer son profil ne le ramenait jamais. On se retrouvait sans profil et
 * sans le moyen guidé d'en refaire un — c'est exactement ce qui a été
 * rapporté, et c'était un défaut, pas un oubli de l'utilisateur.
 *
 * La règle est maintenant aussi simple que ce qu'on en attend : **pas de
 * profil, donc le parcours**. Le seul moyen de ne pas le voir est d'appuyer
 * sur « Passer », et cela ne vaut que pour ce lancement-ci. Rien n'est gravé.
 *
 * `replay` l'emporte toujours : c'est le bouton du Profil.
 */
export function shouldShowOnboarding(state: {
  replay: boolean;
  profileCompleted: boolean;
  skippedThisLaunch: boolean;
}): boolean {
  if (state.replay) return true;
  return !state.profileCompleted && !state.skippedThisLaunch;
}
