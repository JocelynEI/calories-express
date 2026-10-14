import { Meal, MealMoment } from '../types';
import { dayKey, timestampForDay } from './date';

export const mealDay = (meal: Meal) => dayKey(new Date(meal.createdAt));

/** Les repas d'une journée, le plus récent d'abord. */
export function mealsForDay(meals: Meal[], day: string): Meal[] {
  return meals
    .filter(meal => mealDay(meal) === day)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const totalCalories = (meals: Meal[]) => meals.reduce((sum, meal) => sum + meal.calories.estimated, 0);

export function totalMacros(meals: Meal[]) {
  return meals.reduce((sum, meal) => ({
    protein: sum.protein + meal.macros.protein,
    carbs: sum.carbs + meal.macros.carbs,
    fat: sum.fat + meal.macros.fat,
  }), { protein: 0, carbs: 0, fat: 0 });
}

export const newMealId = () => `meal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * V1.8 — refaire un repas habituel.
 *
 * La plupart des repas saisis sont des répétitions. Cette copie reprend les
 * mêmes aliments et les mêmes quantités, datés de la journée consultée. Rien
 * n'est deviné : c'est exactement le repas déjà confirmé une première fois,
 * et il reste modifiable comme n'importe quelle entrée du journal.
 */
export function repeatMeal(meal: Meal, day: string, now = new Date()): Meal {
  return {
    ...meal,
    id: newMealId(),
    createdAt: timestampForDay(day, now),
    items: meal.items.map(item => ({ ...item })),
  };
}

export type MealTemplate = { meal: Meal; times: number };

/**
 * Les repas les plus souvent saisis, hors journée consultée, pour proposer de
 * les refaire en un geste. Un repas n'apparaît qu'une fois, dans sa version la
 * plus récente. Les journées de démonstration n'en font jamais partie.
 */
export function frequentMeals(meals: Meal[], day: string, limit = 3): MealTemplate[] {
  const groups = new Map<string, MealTemplate>();
  for (const meal of [...meals].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    if (meal.id.startsWith('demo-') || mealDay(meal) === day) continue;
    const key = `${meal.moment}·${meal.description.toLocaleLowerCase('fr-FR').trim()}`;
    const found = groups.get(key);
    if (found) found.times += 1;
    else groups.set(key, { meal, times: 1 });
  }
  return [...groups.values()]
    .sort((a, b) => b.times - a.times || b.meal.createdAt.localeCompare(a.meal.createdAt))
    .slice(0, limit);
}

/** Étiquette courte pour une puce : « Petit-déj · 370 kcal ». */
export function templateLabel(template: MealTemplate) {
  const moment = template.meal.moment === 'Petit-déjeuner' ? 'Petit-déj' : template.meal.moment;
  return `${moment} · ${template.meal.calories.estimated.toLocaleString('fr-FR')} kcal`;
}

/**
 * V2.4 — l'illustration d'un repas.
 *
 * `mealPhoto` renvoie la première photographie disponible parmi les aliments
 * du repas : c'est presque toujours l'ingrédient principal, puisque c'est le
 * premier saisi. `mealSubject` donne le nom à illustrer quand il n'y a pas de
 * photo — le nom de l'aliment plutôt que la phrase entière, car « 120 g de
 * saumon avec du riz » ne ressemble à rien, tandis que « saumon » se dessine.
 */
export function mealPhoto(meal: Meal): string | undefined {
  for (const item of meal.items) {
    const url = item.reference?.imageUrl;
    if (url) return url;
  }
  return undefined;
}

export function mealSubject(meal: Meal): string {
  const first = meal.items.find(item => item.name.trim());
  return (first?.name ?? meal.description).trim();
}

/* -------------------------------------------------------------------------- */
/* V4.0 — l'accueil en cartes : les repas rangés par moment de la journée.     */
/* -------------------------------------------------------------------------- */

/**
 * Les quatre moments toujours affichés sur l'accueil, dans l'ordre de la
 * journée. « Snack » n'a pas de ligne à lui tant qu'il est vide : il apparaît,
 * juste après le goûter, dès qu'un repas y est noté.
 */
export const HOME_MOMENTS: MealMoment[] = ['Petit-déjeuner', 'Déjeuner', 'Goûter', 'Dîner'];

export type MomentGroup = { moment: MealMoment; meals: Meal[]; kcal: number };

/** Les repas d'une journée regroupés par moment, du matin au soir. */
export function mealsByMoment(meals: Meal[]): MomentGroup[] {
  const order: MealMoment[] = ['Petit-déjeuner', 'Déjeuner', 'Goûter', 'Snack', 'Dîner'];
  return order
    .map(moment => {
      const found = meals
        .filter(meal => meal.moment === moment)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return { moment, meals: found, kcal: totalCalories(found) };
    })
    .filter(group => HOME_MOMENTS.includes(group.moment) || group.meals.length > 0);
}

export type PlateSegment = { moment: MealMoment; start: number; length: number };

/**
 * Les parts de l'assiette : chaque moment occupe sur le bord la fraction de
 * l'objectif qu'il représente. Au-delà de l'objectif, le bord est plein et les
 * parts gardent leurs proportions entre elles, plutôt que de déborder.
 *
 * `start` et `length` sont des fractions du tour complet (0 à 1). Un petit
 * espace sépare deux parts voisines, pour qu'on les distingue sans légende.
 */
export function plateSegments(groups: MomentGroup[], target: number, gap = 0.008): PlateSegment[] {
  const total = groups.reduce((sum, group) => sum + Math.max(0, group.kcal), 0);
  const scale = Math.max(target, total);
  if (scale <= 0 || total <= 0) return [];
  const filled = groups.filter(group => group.kcal > 0);
  const segments: PlateSegment[] = [];
  let start = 0;
  for (const group of filled) {
    const share = group.kcal / scale;
    const length = filled.length > 1 ? Math.max(0, share - gap) : share;
    segments.push({ moment: group.moment, start, length });
    start += share;
  }
  return segments;
}

/**
 * Ce que contient un repas, en quelques mots : « Riz blanc, Oeuf dur ».
 * Le nom Ciqual complet (« Riz blanc, cuit, sans sel ajouté ») est coupé à sa
 * première virgule ; un repas sans aliments détaillés garde sa description.
 */
export function mealSummary(meal: Meal): string {
  const names = meal.items
    .map(item => item.name.split(',')[0].trim())
    .filter(Boolean);
  const unique = names.filter((name, index) => names.indexOf(name) === index);
  return unique.length ? unique.join(', ') : meal.description;
}

/** Le moment qui correspond à l'heure : c'est lui qu'on propose d'abord. */
export function momentForHour(hour: number): MealMoment {
  return hour < 10 ? 'Petit-déjeuner' : hour < 14 ? 'Déjeuner' : hour < 18 ? 'Goûter' : 'Dîner';
}
