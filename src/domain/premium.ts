import { MacroNutrients } from '../types';

/**
 * V5.0 — le premium.
 *
 * Règle de fond : le premium n'ajoute que du nouveau. Rien de ce qui est déjà
 * gratuit (scan d'étiquette, recherche, « Mon aliment », « Plat maison »,
 * activités, poids, personnages, repères automatiques de macros) n'y est
 * déplacé, et ne le sera jamais. Ce fichier ne contient ni interface ni
 * paiement : seulement ce que le premium contient, comment son statut se relit
 * sur le téléphone, et les objectifs de macros choisis par la personne.
 */

/** L'achat unique « à vie » : même identifiant dans les deux stores. */
export const PREMIUM_PRODUCT_ID = 'premium_vie';
/** Prix affiché tant que le store n'a pas renvoyé le sien. Modifiable plus tard sans toucher aux acheteurs. */
export const PREMIUM_PRICE_LABEL = '14,99 €';

export type PremiumFeature = 'etiquette' | 'journee' | 'bilans' | 'objectifs';

export const PREMIUM_FEATURES: { id: PremiumFeature; title: string; copy: string; icon: 'chart' | 'target' | 'camera' | 'repeat' }[] = [
  {
    id: 'etiquette',
    title: 'L’étiquette complète',
    copy: 'Le scan lit aussi les protéines, les glucides et les lipides, pas seulement les kcal. Fini le « bilan partiel ».',
    icon: 'camera',
  },
  {
    id: 'journee',
    title: 'Ma journée type',
    copy: 'Enregistre une journée entière et rejoue-la en un appui, au lieu de ressaisir chaque repas.',
    icon: 'repeat',
  },
  {
    id: 'bilans',
    title: 'Bilans de la semaine et du mois',
    copy: 'Ta moyenne, tes macros, ton activité et la comparaison avec la période d’avant, sur 7 ou 30 jours.',
    icon: 'chart',
  },
  {
    id: 'objectifs',
    title: 'Tes propres objectifs de macros',
    copy: 'Fixe toi-même tes grammes de protéines, glucides et lipides, ou pars d’un modèle.',
    icon: 'target',
  },
];

/** Ce qui reste gratuit, dit sur l'écran du premium pour que personne n'ait à le deviner. */
export const STAYS_FREE = 'Tout ce que tu utilises déjà reste gratuit : le scan et ses kcal, la recherche, les plats maison, les activités, le poids, les personnages et les repères automatiques.';

export type PremiumState = {
  unlocked: boolean;
  /** `store` : achat réel ; `test` : interrupteur de développement, jamais dans une version publiée. */
  source?: 'store' | 'test';
  unlockedAt?: string;
};

export const LOCKED: PremiumState = { unlocked: false };

/**
 * Relit le statut gardé sur le téléphone. Un fichier abîmé ou inconnu donne
 * « non débloqué » : on ne devine jamais un achat.
 */
export function readPremium(value: unknown): PremiumState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { ...LOCKED };
  const raw = value as Record<string, unknown>;
  if (raw.unlocked !== true) return { ...LOCKED };
  return {
    unlocked: true,
    ...(raw.source === 'store' || raw.source === 'test' ? { source: raw.source } : {}),
    ...(typeof raw.unlockedAt === 'string' && raw.unlockedAt.length <= 40 ? { unlockedAt: raw.unlockedAt } : {}),
  };
}

export const unlockedState = (source: 'store' | 'test', now = new Date()): PremiumState => ({
  unlocked: true, source, unlockedAt: now.toISOString(),
});

/* -------------------------------------------------------------------------- */
/* Les lectures offertes                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Trois étiquettes lues avec leurs macronutriments, offertes.
 *
 * Le compte est annoncé avant la première, pas découvert à la troisième : les
 * avis des applications concurrentes reprochent avant tout le « gratuit qui
 * devient payant » sans prévenir. Une lecture n'est décomptée que lorsque
 * l'aliment est réellement ajouté au repas avec ses grammes.
 */
export const FREE_LABEL_MACRO_READS = 3;

export const readLabelMacroReads = (value: unknown): number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? Math.min(value, FREE_LABEL_MACRO_READS) : 0;

export type TrialState = { unlocked: boolean; allowed: boolean; left: number; used: number };

export function labelMacroTrial(used: number, unlocked: boolean): TrialState {
  const safe = readLabelMacroReads(used);
  const left = Math.max(0, FREE_LABEL_MACRO_READS - safe);
  return { unlocked, allowed: unlocked || left > 0, left, used: safe };
}

/** Ce qu'on annonce au-dessus des grammes lus, avant d'en consommer une. */
export function trialNotice(trial: TrialState): string | null {
  if (trial.unlocked) return null;
  if (trial.left === FREE_LABEL_MACRO_READS) return `${FREE_LABEL_MACRO_READS} lectures offertes, puis Premium. Celle-ci est la première.`;
  if (trial.left > 1) return `Il te reste ${trial.left} lectures offertes, puis Premium.`;
  if (trial.left === 1) return 'Dernière lecture offerte, puis Premium.';
  return null;
}

/* -------------------------------------------------------------------------- */
/* Objectifs de macros                                                         */
/* -------------------------------------------------------------------------- */

export type MacroGoals = MacroNutrients;

/** Bornes larges : un objectif de 0 g ou de 5 kg n'est pas un objectif. */
export const MACRO_GOAL_LIMITS = { min: 5, max: 800 };

const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

export const goalsKcal = (goals: MacroGoals) =>
  Math.round(goals.protein * KCAL_PER_GRAM.protein + goals.carbs * KCAL_PER_GRAM.carbs + goals.fat * KCAL_PER_GRAM.fat);

/** Relit des objectifs enregistrés ; `null` si une valeur manque ou sort des bornes. */
export function readMacroGoals(value: unknown): MacroGoals | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const goals = { protein: raw.protein, carbs: raw.carbs, fat: raw.fat };
  for (const key of ['protein', 'carbs', 'fat'] as const) {
    const n = goals[key];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < MACRO_GOAL_LIMITS.min || n > MACRO_GOAL_LIMITS.max) return null;
  }
  return { protein: Math.round(goals.protein as number), carbs: Math.round(goals.carbs as number), fat: Math.round(goals.fat as number) };
}

/** Le message à afficher si ces objectifs ne peuvent pas être enregistrés, sinon `null`. */
export function macroGoalsIssue(goals: MacroGoals): string | null {
  for (const [key, label] of [['protein', 'protéines'], ['carbs', 'glucides'], ['fat', 'lipides']] as const) {
    const n = goals[key];
    if (!Number.isFinite(n)) return `Indique un nombre de grammes pour les ${label}.`;
    if (n < MACRO_GOAL_LIMITS.min || n > MACRO_GOAL_LIMITS.max) {
      return `Pour les ${label}, choisis entre ${MACRO_GOAL_LIMITS.min} et ${MACRO_GOAL_LIMITS.max} g.`;
    }
  }
  return null;
}

export type MacroPreset = { id: string; label: string; detail: string; share: MacroNutrients };

/** Parts de l'énergie : protéines / glucides / lipides, 100 au total. */
export const MACRO_PRESETS: MacroPreset[] = [
  { id: 'equilibre', label: 'Équilibré', detail: '20 / 50 / 30 %', share: { protein: 20, carbs: 50, fat: 30 } },
  { id: 'proteines', label: 'Plus de protéines', detail: '30 / 40 / 30 %', share: { protein: 30, carbs: 40, fat: 30 } },
  { id: 'moins-glucides', label: 'Moins de glucides', detail: '25 / 35 / 40 %', share: { protein: 25, carbs: 35, fat: 40 } },
];

/** Les grammes d'un modèle pour un repère calorique donné. */
export function goalsFromPreset(calorieTarget: number, preset: MacroPreset): MacroGoals {
  const grams = (key: keyof MacroNutrients) => Math.round((calorieTarget * preset.share[key]) / 100 / KCAL_PER_GRAM[key]);
  return { protein: grams('protein'), carbs: grams('carbs'), fat: grams('fat') };
}

/**
 * Les objectifs qui servent réellement : ceux de la personne si le premium est
 * débloqué et qu'elle en a fixé, sinon les repères automatiques, qui restent
 * gratuits.
 */
export function effectiveMacroGoals(automatic: MacroGoals, custom: MacroGoals | null, unlocked: boolean) {
  return unlocked && custom ? { goals: custom, custom: true } : { goals: automatic, custom: false };
}
