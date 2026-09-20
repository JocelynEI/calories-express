import data from '../data/ciqual2025.json';
import { SavedFood } from '../types';

export const CIQUAL_SOURCE = 'https://doi.org/10.57745/RDMHWY';
type Row = [string, string, number, number | null, number | null, number | null];
export function foodText(text: string) {
  return text.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
const SYNONYMS: Record<string, string> = { hamburger: 'burger', hamburgers: 'burger', steaks: 'steak', beef: 'boeuf', oeufs: 'oeuf' };
const stem = (word: string) => SYNONYMS[word] ?? (word.length > 3 ? word.replace(/s$/, '') : word);
const words = (text: string) => foodText(text).split(' ').filter(w => w && !['de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'd', 'l', 'avec', 'au', 'aux', 'maison', 'viande'].includes(w)).map(stem);
const rows = data as Row[];
const indexed = rows.map(row => ({ row, tokens: words(row[1]) }));
// Rank familiar plain foods ahead of derived drinks or pastries. Selection is
// always explicit, and each source name (including preparation) remains intact.
const COMMON = new Set(['13005', '13039', '13396', '9104', '9811', '19593', '19600', '22010', '22000']);
export const CIQUAL_COUNT = rows.length;
export function ciqualFood(row: Row): SavedFood {
  const [code, name, energy, protein, carbs, fat] = row;
  return { id: `ciqual-${code}`, name, reference: { amount: 100, unit: 'g', calories: { min: energy, estimated: energy, max: energy }, macros: { protein: protein ?? 0, carbs: carbs ?? 0, fat: fat ?? 0 }, macrosComplete: [protein, carbs, fat].every(v => v !== null), source: 'ciqual', sourceUrl: CIQUAL_SOURCE, description: 'Composition moyenne Ciqual 2025 · 100 g de partie comestible. Vérifie la préparation et la quantité.' } };
}
export function searchFoods(query: string, personal: SavedFood[] = [], limit = 8): SavedFood[] {
  const tokens = words(query);
  if (!tokens.length) return personal.slice(0, limit);
  const rank = (name: string[], boost = 0) => {
    if (!tokens.every(token => name.some(w => w === token || (token.length >= 3 && w.startsWith(token))))) return -1;
    return tokens.reduce((n, token) => n + (name.includes(token) ? 30 : 10), 0) + boost - name.length * 0.3;
  };
  const found: { food?: SavedFood; row?: Row; score: number }[] = [];
  for (const food of personal) { const score = rank(words(food.name), 5); if (score >= 0) found.push({ food, score }); }
  for (const entry of indexed) { const score = rank(entry.tokens, COMMON.has(entry.row[0]) ? 15 : 0); if (score >= 0) found.push({ row: entry.row, score }); }
  const seen = new Set<string>();
  return found.sort((a, b) => b.score - a.score).filter(hit => { const id = hit.food?.id ?? `ciqual-${hit.row![0]}`; if (seen.has(id)) return false; seen.add(id); return true; }).slice(0, limit).map(hit => hit.food ?? ciqualFood(hit.row!));
}

export type FoodSegment = { text: string; query: string; quantity: number | null; unit: 'g' | 'ml' | 'piece' | null };
const COUNTS: Record<string, number> = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6 };
export function parseFoodSegment(text: string): FoodSegment {
  let clean = text.trim().replace(/^(?:j['’]ai (?:mangé|mange|pris)|je (?:mange|prends))\s+/i, '');
  let quantity: number | null = null, unit: FoodSegment['unit'] = null;
  const measured = clean.match(/(?:^|\s)(\d+(?:[.,]\d+)?)\s*(kg|grammes?|g|millilitres?|ml|cl|litres?|l)\b/i);
  if (measured) {
    quantity = Number(measured[1].replace(',', '.'));
    const u = measured[2].toLowerCase();
    unit = /^(kg|g|gramme)/.test(u) ? 'g' : 'ml';
    quantity *= u === 'kg' || u === 'l' || u.startsWith('litre') ? 1000 : u === 'cl' ? 10 : 1;
    clean = clean.replace(measured[0], ' ');
  } else {
    const count = clean.match(/^(\d+(?:[.,]\d+)?|un|une|deux|trois|quatre|cinq|six)\s+/i);
    if (count) { quantity = COUNTS[count[1].toLowerCase()] ?? Number(count[1].replace(',', '.')); unit = 'piece'; clean = clean.slice(count[0].length); }
  }
  const query = clean.trim().replace(/^(?:de\s+|du\s+|des\s+|d['’]\s*)/i, '').trim();
  return { text, query, quantity, unit };
}
export function splitMealText(text: string): FoodSegment[] {
  // Preserve decimal commas and side dishes. A homemade burger keeps its "avec"
  // description together, but "et des frites" remains a separate component.
  return text.split(/\s+(?:et|puis)\s+|[+;\n]|,(?!\d)/i).flatMap(chunk =>
    /\b(?:burger|hamburger)\b/i.test(chunk) && /\bmaison\b/i.test(chunk) ? [chunk] : chunk.split(/\s+avec\s+/i)
  ).map(s => s.trim()).filter(Boolean).map(parseFoodSegment);
}

export function initialQuantity(food: SavedFood, segment: FoodSegment): { quantity: string; note: string } {
  const referenceUnit = food.reference.unit;
  if (segment.quantity !== null && segment.unit === referenceUnit) return { quantity: String(segment.quantity), note: 'Quantité reprise de ta description. Vérifie-la avant d’ajouter.' };
  if (segment.unit === 'piece' && segment.quantity !== null && referenceUnit === 'portion') return { quantity: String(segment.quantity), note: 'Nombre de portions repris de ta description.' };
  if (segment.unit === 'piece' && segment.quantity !== null && referenceUnit === 'g') {
    // Explicit, app-defined serving assumptions; never Ciqual measurements.
    let grams = 0;
    if (['ciqual-22000', 'ciqual-22010', 'ciqual-22011', 'ciqual-22014'].includes(food.id)) grams = 50;
    else if (food.id === 'ciqual-13005') grams = 120;
    else if (['ciqual-13039', 'ciqual-13396'].includes(food.id)) grams = 150;
    if (grams) return { quantity: String(segment.quantity * grams), note: `Portion indicative : ${grams} g comestibles par pièce, soit ${segment.quantity * grams} g. Ajuste si nécessaire.` };
    return { quantity: '', note: `Tu as indiqué ${segment.quantity} pièce(s). Leur poids varie : indique le poids total comestible en grammes.` };
  }
  if (segment.unit && segment.unit !== referenceUnit) return { quantity: '', note: `La référence est en ${referenceUnit}. Indique cette quantité : le volume et le poids ne se convertissent pas automatiquement.` };
  return { quantity: String(food.reference.amount), note: `Quantité de départ : ${food.reference.amount} ${referenceUnit}. Ajuste-la à ce que tu as mangé.` };
}
