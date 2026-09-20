import data from '../data/ciqual2025.json';
import { SavedFood } from '../types';
import { ciqualFood, foodText } from './food-search';
import { portionIssue, scaleReference } from './foods';

export type RecipeIngredient = { key: string; food: SavedFood; quantity: number };
export function isBurgerQuery(query: string) { return /\b(?:burger|hamburger)\b/.test(foodText(query)); }
export function burgerIngredients(): RecipeIngredient[] {
  // Editable example for ONE burger, not a canonical homemade-burger value.
  const quantities = [['7259', 75], ['6255', 100], ['12726', 20], ['20276', 40], ['20031', 15], ['11008', 15]] as const;
  return quantities.map(([code, quantity]) => {
    const row = data.find(r => r[0] === code);
    if (!row) throw new Error('Ingrédient du modèle introuvable.');
    return { key: code, food: ciqualFood(row as [string, string, number, number | null, number | null, number | null]), quantity };
  });
}
export function makeRecipe(name: string, ingredients: RecipeIngredient[], servings: number): SavedFood {
  if (!name.trim()) throw new Error('Donne un nom à ton plat.');
  if (!ingredients.length || ingredients.length > 30) throw new Error('Ajoute entre 1 et 30 ingrédients.');
  if (!Number.isFinite(servings) || servings < 1 || servings > 100) throw new Error('Indique combien de portions donne toute la recette (1 à 100).');
  const totals = { min: 0, estimated: 0, max: 0 }, macros = { protein: 0, carbs: 0, fat: 0 };
  let complete = true;
  for (const ingredient of ingredients) {
    const issue = portionIssue(ingredient.quantity, ingredient.food.reference); if (issue) throw new Error(issue);
    const item = scaleReference(ingredient.food, ingredient.quantity);
    // Keep source precision until final portion scaling, rather than round each ingredient.
    const ratio = ingredient.quantity / ingredient.food.reference.amount / servings;
    for (const key of ['min', 'estimated', 'max'] as const) totals[key] += ingredient.food.reference.calories[key] * ratio;
    for (const key of ['protein', 'carbs', 'fat'] as const) macros[key] += ingredient.food.reference.macros[key] * ratio;
    complete = complete && item.macrosComplete !== false;
  }
  if (totals.estimated > 10000) throw new Error('Vérifie les ingrédients et le nombre de portions.');
  return { id: `recipe-${foodText(name).replace(/ /g, '-')}`, name: name.trim().slice(0, 140), reference: { amount: 1, unit: 'portion', portionName: 'portion', calories: totals, macros, macrosComplete: complete, source: 'recipe', description: `Recette pour ${servings} portion(s) : ${ingredients.map(i => `${i.quantity} ${i.food.reference.unit} de ${i.food.name}`).join(' ; ')}. Quantités à adapter à ta préparation, huile et sauce comprises.` } };
}
