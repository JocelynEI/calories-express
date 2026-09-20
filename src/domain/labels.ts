import { FoodReference, SavedFood } from '../types';
import { foodText } from './food-search';
import { EMPTY_MACROS } from './foods';

export type LabelBasis = '100g' | '100ml' | 'piece' | 'serving';
export type LabelDetection = { energies: { value: number; line: string; fromKj: boolean }[]; gramsPerPiece: number | null; piecesPerServing: number | null; only100g: boolean };
export function parseLabelText(raw: string): LabelDetection {
  const text = raw.slice(0, 30000).replace(/\u00a0/g, ' ');
  const energies: LabelDetection['energies'] = [];
  for (const line of text.split(/\r?\n/)) {
    // Energy units are mandatory. Do not turn sugar, percentages or package weight into kcal.
    const matches = [...line.matchAll(/(\d+(?:[.,]\d+)?)\s*k\s*cal\b/gi)];
    if (!matches.length) matches.push(...line.matchAll(/\bk\s*cal\s*[:=]?\s*(\d+(?:[.,]\d+)?)/gi));
    for (const match of matches) {
      const value = Number(match[1].replace(',', '.'));
      if (value <= 10000 && !energies.some(e => e.value === value && !e.fromKj)) energies.push({ value, line: line.trim().slice(0, 160), fromKj: false });
    }
  }
  if (!energies.length) for (const line of text.split(/\r?\n/)) {
    for (const match of line.matchAll(/(\d+(?:[.,]\d+)?)\s*k\s*j\b/gi)) {
      const value = Math.round(Number(match[1].replace(',', '.')) / 4.184 * 10) / 10;
      if (value <= 10000 && !energies.some(e => e.value === value)) energies.push({ value, line: line.trim().slice(0, 160), fromKj: true });
    }
  }
  // Only an explicit count AND mass close together can supply a piece weight.
  // A generic "portion 40 g" doesn't imply one biscuit.
  const normalized = foodText(text);
  const serving = text.toLowerCase().match(/\b(\d+)\s*(?:biscuits?|g[âa]teaux?|pi[èe]ces?|barres?)\s*(?:\([^\d)]*)?(\d+(?:[.,]\d+)?)\s*g\b/i);
  const pieces = serving ? Number(serving[1]) : null;
  const grams = serving ? Number(serving[2].replace(',', '.')) : null;
  const gramsPerPiece = pieces && grams && pieces <= 100 && grams <= 5000 ? grams / pieces : null;
  return { energies: energies.slice(0, 12), gramsPerPiece, piecesPerServing: gramsPerPiece ? pieces : null, only100g: /\b100\s*g\b/i.test(text) && !/\b(?:portion|biscuit|gateau|piece|barre)s?\b/.test(normalized) && energies.length === 1 };
}
export function foodFromLabel(input: { name: string; kcal: number; basis: LabelBasis; byPiece: boolean; gramsPerPiece?: number | null; piecesPerServing?: number | null; portionName: string }): SavedFood {
  const { name, kcal, basis, byPiece } = input;
  if (!name.trim()) throw new Error('Donne un nom au produit.');
  if (!Number.isFinite(kcal) || kcal < 0 || kcal > (basis.startsWith('100') ? 1000 : 10000)) throw new Error('Vérifie les kcal et leur référence. Ne saisis pas les kJ dans le champ kcal.');
  if (!['100g', '100ml', 'piece', 'serving'].includes(basis)) throw new Error('Choisis à quelle quantité correspondent les kcal.');
  let energy = kcal, unit: FoodReference['unit'] = basis === '100ml' ? 'ml' : 'g', amount = 100;
  if (basis === 'piece' || basis === 'serving' || byPiece) {
    unit = 'portion'; amount = 1;
    if (basis === '100ml') throw new Error('Pour une référence en ml, saisis le volume consommé.');
    if (basis === '100g') {
      const grams = input.gramsPerPiece;
      if (!grams || !Number.isFinite(grams) || grams <= 0 || grams > 1000) throw new Error('Indique le poids d’une pièce : il est nécessaire avec des kcal pour 100 g.');
      energy = kcal * grams / 100;
    } else if (basis === 'serving') {
      const pieces = input.piecesPerServing;
      if (!pieces || !Number.isFinite(pieces) || pieces <= 0 || pieces > 100) throw new Error('Combien de pièces contient la portion de référence ?');
      energy = kcal / pieces;
    }
  }
  return { id: `label-${foodText(name).replace(/ /g, '-')}-${unit}`, name: name.trim().slice(0, 140), reference: { amount, unit, ...(unit === 'portion' ? { portionName: input.portionName.trim().slice(0, 30) || 'pièce' } : {}), calories: { min: energy, estimated: energy, max: energy }, macros: { ...EMPTY_MACROS }, macrosComplete: false, source: 'label', description: `Étiquette vérifiée : ${kcal} kcal / ${basis === '100g' ? '100 g' : basis === '100ml' ? '100 ml' : basis === 'piece' ? '1 pièce' : `${input.piecesPerServing} pièces`}${unit === 'portion' && basis === '100g' ? ` ; ${input.gramsPerPiece} g par pièce` : ''}.` } };
}
export function pieceWeightFromPack(packGrams: number | null, pieceCount: number | null): number | null {
  if (packGrams === null || pieceCount === null || !Number.isFinite(packGrams) || !Number.isFinite(pieceCount) || packGrams <= 0 || packGrams > 5000 || !Number.isInteger(pieceCount) || pieceCount < 1 || pieceCount > 500) return null;
  return packGrams / pieceCount;
}
