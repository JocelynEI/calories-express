import { readProductImage } from './foods';
import {
  ActivityLevel, EntryMethod, FoodReference, Goal, MacroNutrients, Meal, MealMoment, Profile, RecognizedFood, SexForFormula,
} from '../types';

/**
 * V1.8 — relecture défensive du stockage.
 *
 * Jusqu'ici le profil et les repas étaient repris tels quels depuis
 * `JSON.parse`. Une seule entrée abîmée — par une mise à jour interrompue, un
 * disque plein ou un import manuel — pouvait faire planter le premier rendu,
 * sans moyen de revenir en arrière depuis l'application.
 *
 * Ces fonctions ne réparent rien et n'inventent aucune valeur : elles écartent
 * ce qui n'est pas exploitable et gardent le reste.
 */

const MOMENTS: MealMoment[] = ['Petit-déjeuner', 'Déjeuner', 'Goûter', 'Dîner', 'Snack'];
const METHODS: (EntryMethod | 'photo')[] = ['phrase', 'manual', 'product', 'photo'];
const GOALS: Goal[] = ['maintain', 'lose', 'gain'];
const LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active'];

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const text = (value: unknown, max: number): string | null => (typeof value === 'string' && value.length <= max ? value : null);

function readMacros(value: unknown): MacroNutrients | null {
  if (!isRecord(value)) return null;
  const protein = num(value.protein), carbs = num(value.carbs), fat = num(value.fat);
  if (protein === null || carbs === null || fat === null) return null;
  if (protein < 0 || carbs < 0 || fat < 0) return null;
  return { protein, carbs, fat };
}

function readCalories(value: unknown): { min: number; estimated: number; max: number } | null {
  if (!isRecord(value)) return null;
  const min = num(value.min), estimated = num(value.estimated), max = num(value.max);
  if (min === null || estimated === null || max === null) return null;
  if (min < 0 || estimated < 0 || max < 0 || estimated > 100000) return null;
  return { min, estimated, max };
}

function readItem(value: unknown): RecognizedFood | null {
  if (!isRecord(value)) return null;
  const name = text(value.name, 200);
  const calories = readCalories(value.calories);
  const macros = readMacros(value.macros);
  const quantity = num(value.quantity);
  if (name === null || calories === null || macros === null || quantity === null) return null;
  const item = value as unknown as RecognizedFood;
  const reference: FoodReference | undefined = isRecord(value.reference) ? item.reference : undefined;
  return {
    foodId: text(value.foodId, 120) ?? 'inconnu',
    name,
    quantity,
    calories,
    macros,
    confidence: item.confidence === 'Bonne' || item.confidence === 'Faible' ? item.confidence : 'Moyenne',
    // La référence sert à recalculer une quantité : on la garde telle quelle
    // quand elle est présente, sinon la modification proposera une saisie.
    // V2.4 : l'adresse de la photo repasse par le même filtre qu'à sa
    // réception. Le stockage est un fichier sur le téléphone ; il peut avoir
    // été importé ou modifié, on ne le croit pas sur parole.
    ...(reference ? { reference: { ...reference, imageUrl: readProductImage(reference.imageUrl) } } : {}),
    ...(typeof value.macrosComplete === 'boolean' ? { macrosComplete: value.macrosComplete } : {}),
  };
}

export function readMeal(value: unknown): Meal | null {
  if (!isRecord(value)) return null;
  const id = text(value.id, 120);
  const createdAt = text(value.createdAt, 40);
  if (id === null || createdAt === null || Number.isNaN(new Date(createdAt).getTime())) return null;
  const calories = readCalories(value.calories);
  const macros = readMacros(value.macros);
  if (calories === null || macros === null) return null;
  const items = Array.isArray(value.items) ? value.items.map(readItem).filter((item): item is RecognizedFood => item !== null) : [];
  if (!items.length) return null;
  const moment = MOMENTS.find(candidate => candidate === value.moment) ?? 'Snack';
  const method = METHODS.find(candidate => candidate === value.method) ?? 'phrase';
  return {
    id,
    createdAt,
    moment,
    method,
    description: text(value.description, 600) ?? items.map(item => item.name).join(' + '),
    items,
    calories,
    macros,
    ...(text(value.imageUri, 2000) ? { imageUri: value.imageUri as string } : {}),
  };
}

/**
 * Le profil garde la valeur par défaut d'un champ illisible plutôt que de
 * propager un NaN jusqu'au calcul du repère. `profileIssue` continue de
 * signaler une valeur hors limites au moment de l'affichage.
 */
export function readProfile(value: unknown, fallback: Profile): Profile {
  if (!isRecord(value)) return { ...fallback };
  const sex: SexForFormula = value.sexForFormula === 'male' ? 'male' : 'female';
  const bounded = (input: unknown, min: number, max: number, byDefault: number) => {
    const parsed = num(input);
    return parsed === null || parsed < min || parsed > max ? byDefault : parsed;
  };
  return {
    firstName: text(value.firstName, 40) ?? '',
    sexForFormula: sex,
    age: Math.round(bounded(value.age, 1, 130, fallback.age)),
    heightCm: bounded(value.heightCm, 50, 260, fallback.heightCm),
    weightKg: bounded(value.weightKg, 10, 400, fallback.weightKg),
    activityLevel: LEVELS.find(level => level === value.activityLevel) ?? fallback.activityLevel,
    goal: GOALS.find(goal => goal === value.goal) ?? fallback.goal,
    targetMode: value.targetMode === 'manual' ? 'manual' : 'automatic',
    activityBudgetMode: value.activityBudgetMode === 'daily' ? 'daily' : 'fixed',
    manualTarget: bounded(value.manualTarget, 1, 100000, fallback.manualTarget),
  };
}
