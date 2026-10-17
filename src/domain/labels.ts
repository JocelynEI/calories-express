import { FoodReference, SavedFood } from '../types';
import { foodText } from './food-search';
import { EMPTY_MACROS } from './foods';

export type LabelBasis = '100g' | '100ml' | 'piece' | 'serving';
/** V5.0 — ce que l'étiquette dit des macronutriments. `null` : non trouvé, jamais deviné. */
export type LabelMacros = { protein: number | null; carbs: number | null; fat: number | null };
export type LabelDetection = { energies: { value: number; line: string; fromKj: boolean }[]; gramsPerPiece: number | null; piecesPerServing: number | null; only100g: boolean; macros: LabelMacros };
/**
 * V4.0.1 — ce qui n'est pas l'énergie du produit.
 *
 * Sous le tableau, beaucoup d'étiquettes rappellent l'apport de référence
 * d'un adulte (« 8400 kJ / 2000 kcal »). La lecture de photo l'abîme parfois
 * en « re 000 kcal » : l'application proposait alors « 0 kcal ». Ces lignes
 * sont écartées, comme les nombres qui commencent par un zéro (« 000 »,
 * « 05 »), qui sont toujours des morceaux mal lus. Un vrai « 0 kcal » (eau,
 * boisson sans sucre) reste accepté.
 */
const REFERENCE_LINE = /apport|r[ée]f[ée]rence|\bAR\b|adulte|journali|daily|intake|\b2\s?000\s*kcal\b|\b8\s?400\s*kj\b/i;
const ENERGY_LINE = /[ée]nergie|energy|valeur\s+[ée]nerg/i;
// La photo transforme souvent « kcal » en « kca1 », « kcai », « keal » ou
// « kcol », et « kJ » en « k) » ou « k] ».
const KCAL = 'k\\s*[ce]\\s*[ao]\\s*[l1iI|!]';
const KJ = /(\d+(?:[.,]\d+)?)\s*k\s*[jJ)\]]/gi;

/**
 * V4.0.2 — quand les unités sont illisibles, les chiffres suffisent.
 *
 * Sur un sachet courbé ou un petit tableau, la lecture garde souvent les
 * nombres mais abîme « kJ » et « kcal ». Or l'étiquette donne toujours la
 * même énergie deux fois : en kJ, puis en kcal (1 kcal = 4,184 kJ). Deux
 * nombres proches dont l'un vaut 4,184 fois l'autre sont donc presque
 * sûrement « 1573 kJ / 375 kcal ». On ne retient que ces paires.
 */
function energyPairs(lines: string[]): LabelDetection['energies'] {
  const found: LabelDetection['energies'] = [];
  for (let index = 0; index < lines.length; index++) {
    // Une case du tableau peut tenir sur deux lignes : kJ dessus, kcal dessous.
    const block = [lines[index], lines[index + 1] ?? ''].join(' ').replace(/\b(\d{1,2})[ .](\d{3})\b/g, '$1$2');
    const numbers = [...block.matchAll(/\d+(?:[.,]\d+)?/g)].map(m => m[0]).filter(plausible).map(n => Number(n.replace(',', '.')));
    for (const kj of numbers) {
      if (kj < 40 || kj > 4000) continue;
      for (const kcal of numbers) {
        if (kcal < 10 || kcal >= kj) continue;
        if (Math.abs(kj / 4.184 - kcal) <= Math.max(2, kcal * 0.02) && !found.some(e => e.value === kcal)) {
          found.push({ value: kcal, line: lines[index].trim().slice(0, 160), fromKj: false });
        }
      }
    }
  }
  return found;
}
const plausible = (digits: string) => !/^0\d/.test(digits);

/* -------------------------------------------------------------------------- */
/* V5.0 — protéines, glucides et lipides                                       */
/* -------------------------------------------------------------------------- */

/**
 * Jusqu'ici l'application ne lisait que l'énergie : chaque produit scanné
 * arrivait sans macronutriments, et c'est ce qui affichait « bilan partiel »
 * sur l'accueil. Le tableau les écrit pourtant juste en dessous des kcal.
 *
 * Trois précautions, parce qu'une valeur fausse est pire qu'une valeur absente :
 *   — le mot doit être reconnu (« Protéines », « Glucides », « Matières grasses ») ;
 *   — le nombre doit être suivi d'un « g », sinon c'est un autre chiffre du tableau ;
 *   — tout ce qui suit « dont » est coupé : « dont sucres » n'est pas « Glucides »,
 *     « dont acides gras saturés » n'est pas « Matières grasses ».
 * Rien n'est deviné : un mot absent ou illisible laisse la valeur à `null`, et
 * la personne la recopie elle-même.
 */
const MACRO_WORDS: Record<keyof LabelMacros, RegExp> = {
  protein: /prot[ée3]i?nes?|proteins?/i,
  carbs: /glucides?|carbohydrates?/i,
  fat: /mati[èe]res?\.?\s*grasses?|lipides?|graisses?|\bfats?\b/i,
};
const SUBLINE = /\bdont\b|of which/i;

function macroOnLine(line: string, word: RegExp): number | null {
  const found = word.exec(line);
  if (!found) return null;
  let rest = line.slice(found.index + found[0].length);
  // « Glucides 62 g dont sucres 33 g » : le sucre n'est pas le glucide total.
  const sub = rest.search(SUBLINE);
  if (sub >= 0) rest = rest.slice(0, sub);
  const number = rest.match(/(\d+(?:[.,]\d+)?)\s*g\b/i);
  if (!number || !plausible(number[1])) return null;
  const value = Number(number[1].replace(',', '.'));
  return Number.isFinite(value) && value >= 0 && value <= 1000 ? value : null;
}

function parseMacros(lines: string[]): LabelMacros {
  const macros: LabelMacros = { protein: null, carbs: null, fat: null };
  for (const key of Object.keys(macros) as (keyof LabelMacros)[]) {
    for (let index = 0; index < lines.length && macros[key] === null; index++) {
      // Le tableau coupe parfois la ligne en deux : le mot d'un côté, le nombre
      // de l'autre. La ligne suivante est donc relue avec la première.
      macros[key] = macroOnLine(lines[index], MACRO_WORDS[key])
        ?? macroOnLine([lines[index], lines[index + 1] ?? ''].join(' '), MACRO_WORDS[key]);
    }
  }
  return macros;
}

/** Combien de valeurs ont été lues : 0, 1, 2 ou 3. */
export const macrosFound = (macros: LabelMacros) => (['protein', 'carbs', 'fat'] as const).filter(key => macros[key] !== null).length;

export function parseLabelText(raw: string): LabelDetection {
  const text = raw.slice(0, 30000).replace(/\u00a0/g, ' ');
  const lines = text.split(/\r?\n/).filter(line => !REFERENCE_LINE.test(line));
  const energies: LabelDetection['energies'] = [];
  for (const line of lines) {
    // Energy units are mandatory. Do not turn sugar, percentages or package weight into kcal.
    const matches = [...line.matchAll(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${KCAL}(?![a-z])`, 'gi'))];
    if (!matches.length) matches.push(...line.matchAll(new RegExp(`\\b${KCAL}\\s*[:=]?\\s*(\\d+(?:[.,]\\d+)?)`, 'gi')));
    for (const match of matches) {
      if (!plausible(match[1])) continue;
      const value = Number(match[1].replace(',', '.'));
      if (value <= 10000 && !energies.some(e => e.value === value && !e.fromKj)) energies.push({ value, line: line.trim().slice(0, 160), fromKj: false });
    }
  }
  if (!energies.length) energies.push(...energyPairs(lines));
  if (!energies.length) for (const line of lines) {
    for (const match of line.matchAll(KJ)) {
      if (!plausible(match[1])) continue;
      const value = Math.round(Number(match[1].replace(',', '.')) / 4.184 * 10) / 10;
      if (value <= 10000 && !energies.some(e => e.value === value)) energies.push({ value, line: line.trim().slice(0, 160), fromKj: true });
    }
  }
  // La ligne « Énergie » passe devant : c'est elle qu'on propose en premier.
  energies.sort((a, b) => Number(ENERGY_LINE.test(b.line)) - Number(ENERGY_LINE.test(a.line)));
  // Only an explicit count AND mass close together can supply a piece weight.
  // A generic "portion 40 g" doesn't imply one biscuit.
  const normalized = foodText(text);
  const serving = text.toLowerCase().match(/\b(\d+)\s*(?:biscuits?|g[âa]teaux?|pi[èe]ces?|barres?)\s*(?:\([^\d)]*)?(\d+(?:[.,]\d+)?)\s*g\b/i);
  const pieces = serving ? Number(serving[1]) : null;
  const grams = serving ? Number(serving[2].replace(',', '.')) : null;
  const gramsPerPiece = pieces && grams && pieces <= 100 && grams <= 5000 ? grams / pieces : null;
  return { energies: energies.slice(0, 12), gramsPerPiece, piecesPerServing: gramsPerPiece ? pieces : null, macros: parseMacros(lines), only100g:/\b100\s*g\b/i.test(text) && !/\b(?:portion|biscuit|gateau|piece|barre)s?\b/.test(normalized) && energies.length === 1 };
}
export function foodFromLabel(input: { name: string; kcal: number; basis: LabelBasis; byPiece: boolean; gramsPerPiece?: number | null; piecesPerServing?: number | null; portionName: string; macros?: LabelMacros }): SavedFood {
  const { name, kcal, basis, byPiece } = input;
  if (!name.trim()) throw new Error('Donne un nom au produit.');
  if (!Number.isFinite(kcal) || kcal < 0 || kcal > (basis.startsWith('100') ? 1000 : 10000)) throw new Error('Vérifie les kcal et leur référence. Ne saisis pas les kJ dans le champ kcal.');
  if (!['100g', '100ml', 'piece', 'serving'].includes(basis)) throw new Error('Choisis à quelle quantité correspondent les kcal.');
  // V5.0 — les macronutriments suivent exactement la même mise à l'échelle que
  // l'énergie : ils sont écrits dans la même colonne du tableau.
  let factor = 1, unit: FoodReference['unit'] = basis === '100ml' ? 'ml' : 'g', amount = 100;
  if (basis === 'piece' || basis === 'serving' || byPiece) {
    unit = 'portion'; amount = 1;
    if (basis === '100ml') throw new Error('Pour une référence en ml, saisis le volume consommé.');
    if (basis === '100g') {
      const grams = input.gramsPerPiece;
      if (!grams || !Number.isFinite(grams) || grams <= 0 || grams > 1000) throw new Error('Indique le poids d’une pièce : il est nécessaire avec des kcal pour 100 g.');
      factor = grams / 100;
    } else if (basis === 'serving') {
      const pieces = input.piecesPerServing;
      if (!pieces || !Number.isFinite(pieces) || pieces <= 0 || pieces > 100) throw new Error('Combien de pièces contient la portion de référence ?');
      factor = 1 / pieces;
    }
  }
  const energy = kcal * factor;
  const macros = scaleLabelMacros(input.macros, basis, factor);
  return { id: `label-${foodText(name).replace(/ /g, '-')}-${unit}`, name: name.trim().slice(0, 140), reference: { amount, unit, ...(unit === 'portion' ? { portionName: input.portionName.trim().slice(0, 30) || 'pièce' } : {}), calories: { min: energy, estimated: energy, max: energy }, macros: macros.values, macrosComplete: macros.complete, source: 'label', description: `Étiquette vérifiée : ${kcal} kcal${macros.complete ? `, ${macros.values.protein.toLocaleString('fr-FR')} g de protéines, ${macros.values.carbs.toLocaleString('fr-FR')} g de glucides, ${macros.values.fat.toLocaleString('fr-FR')} g de lipides` : ''} / ${basis === '100g' ? '100 g' : basis === '100ml' ? '100 ml' : basis === 'piece' ? '1 pièce' : `${input.piecesPerServing} pièces`}${unit === 'portion' && basis === '100g' ? ` ; ${input.gramsPerPiece} g par pièce` : ''}.` } };
}

/**
 * Les grammes lus, mis à l'échelle et vérifiés. Une valeur manquante reste à
 * zéro avec `complete: false` : l'application affiche alors « — » et « ≥ »,
 * plutôt qu'un zéro qui se lirait comme « pas de protéines ».
 */
function scaleLabelMacros(macros: LabelMacros | undefined, basis: LabelBasis, factor: number) {
  const values = { ...EMPTY_MACROS };
  if (!macros) return { values, complete: false };
  const limit = basis.startsWith('100') ? 100 : 1000;
  const names = { protein: 'protéines', carbs: 'glucides', fat: 'lipides' } as const;
  let complete = true;
  for (const key of ['protein', 'carbs', 'fat'] as const) {
    const raw = macros[key];
    if (raw === null || raw === undefined) { complete = false; continue; }
    if (!Number.isFinite(raw) || raw < 0 || raw > limit) {
      throw new Error(`Vérifie les ${names[key]} : ${basis.startsWith('100') ? `pour 100 ${basis === '100ml' ? 'ml' : 'g'}, la valeur ne peut pas dépasser 100 g` : 'cette valeur ne ressemble pas à des grammes'}.`);
    }
    values[key] = Math.round(raw * factor * 10) / 10;
  }
  return { values, complete };
}
export function pieceWeightFromPack(packGrams: number | null, pieceCount: number | null): number | null {
  if (packGrams === null || pieceCount === null || !Number.isFinite(packGrams) || !Number.isFinite(pieceCount) || packGrams <= 0 || packGrams > 5000 || !Number.isInteger(pieceCount) || pieceCount < 1 || pieceCount > 500) return null;
  return packGrams / pieceCount;
}
