import { FOOD_CATALOG } from '../data/catalog';
import { Food, Goal, MacroNutrients, Profile, RecognizedFood } from '../types';

export const normalizeText = (value: string) =>
  value
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const NUMBER_WORDS: Record<string, number> = {
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6,
};

const ALIAS_INDEX = FOOD_CATALOG.flatMap((food) =>
  [...new Set([food.name, ...food.aliases])].map((alias) => ({ food, alias: normalizeText(alias) })),
).sort((a, b) => b.alias.length - a.alias.length);

const PHRASE_SEPARATOR = /\+|,|;|\/|&|\bet\b|\bavec\b|\bpuis\b/gi;
const SUGGESTION_STOP_WORDS = new Set([
  'ai', 'au', 'aux', 'avec', 'ce', 'ces', 'de', 'des', 'du', 'et', 'j', 'je', 'la', 'le', 'les',
  'mange', 'mangee', 'manger', 'mon', 'pour', 'pris', 'prise', 'un', 'une', 'mes', 'repas', 'petit',
  'dejeuner', 'diner', 'gouter',
]);

const quantityFromSegment = (segment: string) => {
  const normalized = normalizeText(segment);
  const numeric = normalized.match(/(?:^|\s)(\d+(?:[.,]\d+)?)(?:\s|$)/);
  if (numeric) return Math.min(10, Math.max(0.25, Number(numeric[1].replace(',', '.'))));
  const firstWord = normalized.split(' ')[0];
  return NUMBER_WORDS[firstWord] ?? 1;
};

const scaleFood = (food: Food, quantity: number): RecognizedFood => ({
  foodId: food.id,
  name: food.name,
  quantity,
  calories: {
    min: Math.round(food.calories.min * quantity),
    estimated: Math.round(food.calories.estimated * quantity),
    max: Math.round(food.calories.max * quantity),
  },
  macros: {
    protein: Math.round(food.macros.protein * quantity),
    carbs: Math.round(food.macros.carbs * quantity),
    fat: Math.round(food.macros.fat * quantity),
  },
  confidence: food.confidence,
});

export const recognizedFromFood = (food: Food, quantity = 1) => scaleFood(food, quantity);

export const estimatePhrase = (phrase: string): RecognizedFood[] => {
  const segments = phrase.split(PHRASE_SEPARATOR).map((part) => part.trim()).filter(Boolean);
  const recognized = new Map<string, RecognizedFood>();

  for (const segment of segments) {
    const normalizedSegment = normalizeText(segment);
    const match = ALIAS_INDEX.find(({ alias }) => normalizedSegment.includes(alias));
    if (!match) continue;
    const quantity = quantityFromSegment(segment);
    const previous = recognized.get(match.food.id);
    recognized.set(match.food.id, scaleFood(match.food, (previous?.quantity ?? 0) + quantity));
  }

  return [...recognized.values()];
};

export const suggestFoods = (phrase: string, limit = 5): Food[] => {
  const normalized = normalizeText(phrase);
  if (normalized.length < 2) return [];

  const separated = normalized.split(PHRASE_SEPARATOR);
  const lastSegment = separated[separated.length - 1]?.trim() ?? normalized;
  const meaningfulTokens = lastSegment
    .split(' ')
    .filter((token) => token.length >= 2 && !SUGGESTION_STOP_WORDS.has(token))
    .slice(-3);
  if (!meaningfulTokens.length) return [];

  const compactNeedle = meaningfulTokens.join(' ');
  return FOOD_CATALOG
    .map((food) => {
      const searchable = [...new Set([food.name, ...food.aliases])].map(normalizeText);
      let score = 0;

      for (const text of searchable) {
        if (text === compactNeedle) score = Math.max(score, 120);
        else if (text.startsWith(compactNeedle)) score = Math.max(score, 100);
        else if (text.includes(compactNeedle)) score = Math.max(score, 80);

        const matchedTokens = meaningfulTokens.filter((token) =>
          text.split(' ').some((word) => word.startsWith(token) || word.includes(token)),
        ).length;
        if (matchedTokens === meaningfulTokens.length) score = Math.max(score, 55 + matchedTokens * 8);
        else if (matchedTokens > 0) score = Math.max(score, matchedTokens * 15);
      }

      return { food, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name, 'fr-FR'))
    .slice(0, limit)
    .map(({ food }) => food);
};

export const totalRecognized = (items: RecognizedFood[]) => items.reduce(
  (total, item) => ({
    calories: {
      min: total.calories.min + item.calories.min,
      estimated: total.calories.estimated + item.calories.estimated,
      max: total.calories.max + item.calories.max,
    },
    macros: {
      protein: total.macros.protein + item.macros.protein,
      carbs: total.macros.carbs + item.macros.carbs,
      fat: total.macros.fat + item.macros.fat,
    },
  }),
  {
    calories: { min: 0, estimated: 0, max: 0 },
    macros: { protein: 0, carbs: 0, fat: 0 } as MacroNutrients,
  },
);

export const calculateBmr = (profile: Profile) => {
  const sexConstant = profile.sexForFormula === 'male' ? 5 : -161;
  return Math.round(10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexConstant);
};

const activityFactors: Record<Profile['activityLevel'], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

const goalAdjustments: Record<Goal, number> = {
  maintain: 0,
  lose: -300,
  gain: 250,
};

export const usesDailyActivity = (profile: Profile) => profile.targetMode === 'automatic' && profile.activityBudgetMode === 'daily';
export const calculateMaintenance = (profile: Profile, activeCalories = 0) => {
  const daily = usesDailyActivity(profile);
  const added = daily && Number.isFinite(activeCalories) ? Math.max(0, activeCalories) : 0;
  return Math.round(calculateBmr(profile) * (daily ? activityFactors.sedentary : activityFactors[profile.activityLevel]) + added);
};

export const calculateDailyTarget = (profile: Profile, activeCalories = 0) => {
  const target = profile.targetMode === 'manual'
    ? profile.manualTarget
    : calculateMaintenance(profile, activeCalories) + goalAdjustments[profile.goal];
  // Do not silently turn invalid inputs into a low calorie recommendation.
  // The profile form validates the result before it can be saved.
  return Number.isFinite(target) && target > 0 ? Math.round(target) : 0;
};

export const gaugeMessage = (consumed: number, target: number) => {
  const ratio = target > 0 ? consumed / target : 0;
  if (target <= 0) return { label: 'Profil à vérifier', tone: 'navy' as const };
  if (ratio === 0) return { label: 'Prêt pour ta journée', tone: 'navy' as const };
  if (ratio < 0.55) return { label: 'Ta journée progresse', tone: 'navy' as const };
  if (ratio < 0.9) return { label: 'Ta journée progresse', tone: 'sage' as const };
  if (ratio <= 1) return { label: 'Proche du repère', tone: 'sage' as const };
  return { label: 'Au-dessus du repère', tone: 'gold' as const };
};

export const macroTargets = (profile: Profile, calorieTarget: number): MacroNutrients => {
  const protein = Math.round(profile.weightKg * (profile.goal === 'gain' ? 1.8 : 1.5));
  const fat = Math.round(profile.weightKg * 0.9);
  const remainingCalories = Math.max(0, calorieTarget - protein * 4 - fat * 9);
  return { protein, fat, carbs: Math.round(remainingCalories / 4) };
};
