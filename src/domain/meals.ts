import { Meal } from '../types';
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
