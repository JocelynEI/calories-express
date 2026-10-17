import { Meal } from '../types';
import { dayDate } from './date';
import { mealsForDay, newMealId, totalCalories } from './meals';
import { readMeal } from './persistence';

/**
 * V5.0 (premium) — « Ma journée type ».
 *
 * Beaucoup de journées se ressemblent : même petit-déjeuner, même déjeuner
 * emporté. « Refaire un repas habituel », gratuit, règle le cas d'un repas ;
 * ici c'est la journée entière qui se rejoue en un appui.
 *
 * Rien n'est deviné ni recalculé : un modèle est la copie exacte de repas déjà
 * confirmés une première fois, et chaque repas replacé reste modifiable comme
 * n'importe quelle entrée du journal.
 */

export type DayTemplate = { id: string; name: string; createdAt: string; meals: Meal[] };

export const MAX_TEMPLATES = 5;
export const MAX_MEALS_PER_TEMPLATE = 15;
export const MAX_TEMPLATE_NAME = 40;

export const templateKcal = (template: DayTemplate) => totalCalories(template.meals);

/** Le nom proposé par défaut : « Journée type 1 », sans écraser un nom déjà pris. */
export function suggestedTemplateName(templates: DayTemplate[]): string {
  for (let index = 1; index <= MAX_TEMPLATES + 1; index++) {
    const name = `Journée type ${index}`;
    if (!templates.some(template => template.name.toLocaleLowerCase('fr-FR') === name.toLocaleLowerCase('fr-FR'))) return name;
  }
  return 'Journée type';
}

/** Le message qui empêche l'enregistrement, ou `null`. */
export function templateIssue(templates: DayTemplate[], name: string, mealCount: number): string | null {
  if (!name.trim()) return 'Donne un nom à cette journée type.';
  if (name.trim().length > MAX_TEMPLATE_NAME) return `Le nom ne peut pas dépasser ${MAX_TEMPLATE_NAME} caractères.`;
  if (!mealCount) return 'Cette journée ne contient aucun repas à enregistrer.';
  if (mealCount > MAX_MEALS_PER_TEMPLATE) return `Une journée type garde au plus ${MAX_MEALS_PER_TEMPLATE} repas.`;
  if (templates.length >= MAX_TEMPLATES && !templates.some(template => template.name.trim() === name.trim())) {
    return `Tu as déjà ${MAX_TEMPLATES} journées types. Supprimes-en une pour en ajouter une autre.`;
  }
  return null;
}

/**
 * La journée consultée, figée en modèle. Les repas d'exemple n'en font jamais
 * partie : ce ne sont pas les repas de la personne.
 */
export function templateFromDay(meals: Meal[], day: string, name: string, now = new Date()): DayTemplate | null {
  const kept = mealsForDay(meals, day).filter(meal => !meal.id.startsWith('demo-')).slice(0, MAX_MEALS_PER_TEMPLATE);
  if (!kept.length) return null;
  return {
    id: `modele-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim().slice(0, MAX_TEMPLATE_NAME),
    createdAt: now.toISOString(),
    // Du matin au soir, pour que la liste se lise dans l'ordre d'une journée.
    meals: [...kept].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(meal => ({ ...meal, items: meal.items.map(item => ({ ...item })) })),
  };
}

/**
 * Le modèle replacé sur une journée. Chaque repas garde son heure d'origine —
 * le petit-déjeuner reste au petit matin — mais reçoit une nouvelle identité :
 * modifier la copie ne touche pas au modèle.
 */
export function applyTemplate(template: DayTemplate, day: string, now = new Date()): Meal[] {
  return template.meals.map(meal => {
    const source = new Date(meal.createdAt);
    const date = dayDate(day);
    if (Number.isNaN(source.getTime())) date.setHours(12, 0, 0, 0);
    else date.setHours(source.getHours(), source.getMinutes(), 0, 0);
    return { ...meal, id: newMealId(), createdAt: date.toISOString(), items: meal.items.map(item => ({ ...item })) };
  });
}

/** Relecture défensive du stockage : un modèle abîmé est écarté, pas réparé. */
export function readDayTemplates(value: unknown): DayTemplate[] {
  if (!Array.isArray(value)) return [];
  const templates: DayTemplate[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const entry = raw as Record<string, unknown>;
    const id = typeof entry.id === 'string' && entry.id.length <= 120 ? entry.id : null;
    const name = typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim().slice(0, MAX_TEMPLATE_NAME) : null;
    const createdAt = typeof entry.createdAt === 'string' && !Number.isNaN(new Date(entry.createdAt).getTime()) ? entry.createdAt : null;
    if (!id || !name || !createdAt) continue;
    const meals = (Array.isArray(entry.meals) ? entry.meals : []).map(readMeal).filter((meal): meal is Meal => meal !== null).slice(0, MAX_MEALS_PER_TEMPLATE);
    if (!meals.length) continue;
    templates.push({ id, name, createdAt, meals });
  }
  return templates.slice(0, MAX_TEMPLATES);
}

/** Ce que contient un modèle, en une ligne : « 3 repas · 1 940 kcal ». */
export function templateLine(template: DayTemplate): string {
  const count = template.meals.length;
  return `${count} repas · ${templateKcal(template).toLocaleString('fr-FR')} kcal`;
}
