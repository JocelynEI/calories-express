import { FOOD_CATALOG } from '../data/catalog';
import { FoodReference, MacroNutrients, RecognizedFood, SavedFood } from '../types';

export const EMPTY_MACROS: MacroNutrients = { protein: 0, carbs: 0, fat: 0 };
export function readNumber(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value.trim())) return null;
  const number = typeof value === 'number' ? value : Number(value.trim().replace(',', '.'));
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function portionIssue(quantity: number, reference: FoodReference): string | null {
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > (reference.unit === 'portion' ? 20 : 5000)) return 'Vérifie la quantité consommée : une valeur positive, au maximum 20 portions ou 5 000 g/ml.';
  if (!Number.isFinite(reference.amount) || reference.amount <= 0) return 'La quantité de référence est invalide.';
  if (!Number.isFinite(reference.calories.estimated) || reference.calories.estimated < 0 || reference.calories.estimated > 10000) return 'Vérifie les kilocalories de référence.';
  if (reference.calories.estimated * quantity / reference.amount > 10000) return 'Ce total dépasse 10 000 kcal : vérifie la quantité et la valeur de l’étiquette.';
  return null;
}

export function scaleReference(food: SavedFood, quantity: number): RecognizedFood {
  const issue = portionIssue(quantity, food.reference);
  if (issue) throw new Error(issue);
  const ref = food.reference, ratio = quantity / ref.amount;
  return {
    foodId: food.id, name: food.name, quantity, reference: ref, macrosComplete: ref.macrosComplete,
    calories: { min: Math.round(ref.calories.min * ratio), estimated: Math.round(ref.calories.estimated * ratio), max: Math.round(ref.calories.max * ratio) },
    macros: { protein: Math.round(ref.macros.protein * ratio * 10) / 10, carbs: Math.round(ref.macros.carbs * ratio * 10) / 10, fat: Math.round(ref.macros.fat * ratio * 10) / 10 },
    confidence: 'Moyenne',
  };
}

export function catalogReference(item: RecognizedFood): RecognizedFood {
  const food = FOOD_CATALOG.find(entry => entry.id === item.foodId);
  if (!food) return item;
  return { ...item, macrosComplete: true, reference: { amount: 1, unit: 'portion', calories: food.calories, macros: food.macros, macrosComplete: true, source: 'catalog', description: food.description } };
}

export function itemQuantityLabel(item: RecognizedFood) {
  const unit = item.reference?.unit ?? 'portion';
  return `${item.quantity.toLocaleString('fr-FR')} ${unit === 'portion' ? `${item.reference?.portionName ?? 'portion'}${item.quantity > 1 ? 's' : ''}` : unit}`;
}

export type ProductCandidate = { id: string; name: string; brand: string; package: string; kcal100: number; macros: MacroNutrients; macrosComplete: boolean; url: string; imageUrl?: string };

/**
 * V2.4 — l'adresse d'une photo de produit.
 *
 * Une seule origine est acceptée : le serveur d'images d'Open Food Facts. Une
 * adresse venant d'ailleurs est ignorée, jamais chargée. C'est une réponse
 * arrivant du réseau : on ne fait pas confiance à son contenu, et on ne laisse
 * pas l'application aller chercher une image sur un serveur quelconque.
 */
export function readProductImage(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const url = value.trim();
  if (url.length > 300) return undefined;
  return /^https:\/\/images\.openfoodfacts\.org\/images\/products\/[\w./-]+\.(?:jpg|jpeg|png|webp)$/i.test(url) ? url : undefined;
}

function normalizedNutrients(p: Record<string, unknown>): Record<string, unknown> | null {
  // API >= 3.5 replaced nutriments with nutrition. The aggregate is already
  // normalized; never use an input set that may describe a serving or a
  // prepared product as though it were 100 g of the product as sold.
  if (p.nutrition && typeof p.nutrition === 'object') {
    const nutrition = p.nutrition as Record<string, unknown>;
    const set = nutrition.aggregated_set as { per?: string; preparation?: string; nutrients?: Record<string, { unit?: string; value?: unknown }> } | undefined;
    if (!set || !['100g', '100ml'].includes(set.per ?? '') || set.preparation !== 'as_sold' || !set.nutrients || typeof set.nutrients !== 'object') return null;
    const value = (key: string, unit: string) => set.nutrients?.[key]?.unit === unit ? set.nutrients[key].value : undefined;
    return { 'energy-kcal_100g': value('energy-kcal', 'kcal'), 'energy-kj_100g': value('energy-kj', 'kJ') ?? value('energy', 'kJ'), proteins_100g: value('proteins', 'g'), carbohydrates_100g: value('carbohydrates', 'g'), fat_100g: value('fat', 'g') };
  }
  return p.nutriments && typeof p.nutriments === 'object' ? p.nutriments as Record<string, unknown> : null;
}
export function parseProduct(value: unknown): ProductCandidate | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as Record<string, unknown>;
  const code = String(p.code ?? p._id ?? '');
  if (!/^\d{8,14}$/.test(code)) return null;
  const name = typeof p.product_name_fr === 'string' && p.product_name_fr.trim() ? p.product_name_fr : p.product_name;
  if (typeof name !== 'string' || !name.trim()) return null;
  const nutrients = normalizedNutrients(p);
  if (p.no_nutrition_data === 'on' || !nutrients) return null;
  // *_100g is the normalized reference, never the raw "per serving" value.
  const directKcal = readNumber(nutrients['energy-kcal_100g']);
  const kj = readNumber(nutrients['energy-kj_100g']);
  const kcal100 = directKcal ?? (kj === null ? null : kj / 4.184);
  if (kcal100 === null || kcal100 > 1000) return null;
  const values = ['proteins_100g', 'carbohydrates_100g', 'fat_100g'].map(key => {
    const v = readNumber(nutrients[key]); return v !== null && v <= 100 ? v : null;
  });
  return { id: `off-${code}`, name: name.trim().slice(0, 140), brand: typeof p.brands === 'string' ? p.brands.slice(0, 100) : Array.isArray(p.brands) ? p.brands.filter((b): b is string => typeof b === 'string').join(', ').slice(0, 100) : '', package: typeof p.quantity === 'string' ? p.quantity.slice(0, 60) : '', kcal100,
    macros: { protein: values[0] ?? 0, carbs: values[1] ?? 0, fat: values[2] ?? 0 }, macrosComplete: values.every(v => v !== null), url: `https://world.openfoodfacts.org/product/${code}`,
    imageUrl: readProductImage(p.image_front_small_url) ?? readProductImage(p.image_front_thumb_url) ?? readProductImage(p.image_front_url) };
}

export function productToFood(product: ProductCandidate, unit: 'g' | 'ml'): SavedFood {
  return { id: `${product.id}-${unit}`, name: `${product.name}${product.brand ? ` · ${product.brand}` : ''}`, reference: { amount: 100, unit, calories: { min: product.kcal100, estimated: product.kcal100, max: product.kcal100 }, macros: product.macros, macrosComplete: product.macrosComplete, source: 'off', sourceUrl: product.url, imageUrl: product.imageUrl, description: 'Valeurs Open Food Facts à vérifier sur l’étiquette, produit tel que vendu.' } };
}

export function hasMeasuredQuantity(phrase: string) { return /\d\s*(?:g|kg|ml|cl|l|grammes?|millilitres?|litres?)\b/i.test(phrase); }

// Older versions have no personal-food list. Ignore damaged references instead
// of letting an invalid value turn a future meal total into NaN.
export function readSavedFoods(raw: unknown): SavedFood[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.filter((value): value is SavedFood => {
    if (!value || typeof value !== 'object') return false;
    const food = value as SavedFood, ref = food.reference;
    if (typeof food.id !== 'string' || !food.id || seen.has(food.id) || typeof food.name !== 'string' || !food.name.trim() || !ref) return false;
    if (!['g', 'ml', 'portion'].includes(ref.unit) || !['manual', 'off', 'catalog', 'ciqual', 'label', 'recipe'].includes(ref.source) || !Number.isFinite(ref.amount) || ref.amount <= 0 || ref.amount > 5000) return false;
    if (!ref.calories || !ref.macros || typeof ref.macrosComplete !== 'boolean') return false;
    const energy = [ref.calories.min, ref.calories.estimated, ref.calories.max];
    if (energy.some(v => !Number.isFinite(v) || v < 0 || v > 10000) || energy[0] > energy[1] || energy[1] > energy[2]) return false;
    if ([ref.macros.protein, ref.macros.carbs, ref.macros.fat].some(v => !Number.isFinite(v) || v < 0 || v > 1000)) return false;
    if (ref.sourceUrl && ref.sourceUrl !== 'https://doi.org/10.57745/RDMHWY' && !/^https:\/\/world\.openfoodfacts\.org\/product\/\d{8,14}$/.test(ref.sourceUrl)) return false;
    if (ref.portionName !== undefined && (typeof ref.portionName !== 'string' || ref.portionName.length > 30 || !ref.portionName.trim())) return false;
    // Une photo relue depuis le téléphone repasse par le même filtre qu'à
    // l'arrivée du réseau : une adresse abîmée est effacée, pas chargée.
    if (ref.imageUrl !== undefined && readProductImage(ref.imageUrl) === undefined) delete ref.imageUrl;
    seen.add(food.id); return true;
  }).slice(0, 100);
}
