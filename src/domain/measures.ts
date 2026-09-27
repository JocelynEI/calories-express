import { FoodReference, SavedFood } from '../types';

/**
 * V3.3 — les mesures courantes.
 *
 * Personne ne sert 200 g de lait : on sert un bol. Jusqu'ici l'application
 * demandait une quantité en grammes et laissait la conversion à la charge de
 * la personne — en pratique, on tapait 100 et le chiffre était faux.
 *
 * Ce fichier apporte deux choses, toutes deux calculées sans affichage pour
 * rester vérifiables :
 *
 * 1. **La famille d'un aliment**, déduite de son nom. Les données Ciqual ne
 *    disent pas qu'un lait est liquide : elles donnent un nom et des valeurs
 *    pour 100 g, rien d'autre.
 * 2. **Les mesures qui vont avec cette famille** — verre, bol, tranche, pot —
 *    avec leur équivalence, toujours affichée à l'écran.
 *
 * Deux principes tiennent le reste :
 *
 * - **Une moyenne annoncée vaut mieux qu'une précision fausse.** Un bol fait
 *   250 ml chez la plupart des gens et 350 chez certains. L'équivalence est
 *   écrite sous chaque mesure, et le champ libre reste accessible.
 * - **Un millilitre pèse un gramme.** C'est faux à 3 % près pour le lait, et
 *   les valeurs Ciqual sont données pour 100 g. À côté de l'imprécision d'un
 *   bol rempli à vue, cet écart ne se voit pas. Les huiles (0,92) font
 *   exception, mais elles se mesurent à la cuillère : leurs mesures sont donc
 *   exprimées directement en grammes.
 */

export type FoodFamily = 'liquide' | 'soupe' | 'huile' | 'pain' | 'oeuf' | 'yaourt' | 'fromage' | 'feculent' | 'autre';

export type Measure = {
  id: string;
  /** Ce qu'on lit sur le bouton : « 1 bol ». */
  label: string;
  /** La quantité correspondante, dans l'unité d'affichage de la famille. */
  amount: number;
};

/* ------------------------------------------------------------ le nom ---- */

/** Minuscules, sans accent, découpé en mots. « Café au lait » → café, au, lait. */
export function words(name: string): string[] {
  return name
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Le début du nom, c'est-à-dire l'aliment lui-même.
 *
 * Les noms Ciqual sont construits en couches : « Chou-fleur, bouilli/cuit à
 * l'eau », « Coq au vin », « Sardine, à l'huile de tournesol ». Chercher un
 * mot n'importe où ferait boire le chou-fleur et servirait la sardine à la
 * cuillère à café. On ne regarde donc que la tête du nom : avant la première
 * virgule, et avant la première préposition qui introduit une cuisson ou un
 * accompagnement.
 */
export function head(name: string): string[] {
  const avantVirgule = name.split(',')[0];
  const mots = words(avantVirgule);
  const coupures = new Set(['a', 'au', 'aux', 'avec', 'en', 'sur', 'sans', 'dans', 'pour', 'type']);
  const tete: string[] = [];
  for (const mot of mots) {
    if (coupures.has(mot)) break;
    tete.push(mot);
  }
  return tete;
}

/**
 * Le mot qui nomme l'aliment : le premier de la tête. Le deuxième ne compte
 * que derrière un qualificatif — « Petit suisse » est un yaourt, mais
 * « Saucisse cocktail » n'est pas un cocktail, et « Pizza jambon fromage »
 * n'est pas un fromage.
 */
const QUALIFIANTS = new Set(['petit', 'petits', 'grand', 'gros', 'pur', 'purs', 'demi', 'mini', 'jeune', 'vieux', 'specialite', 'preparation']);

function marqueurs(name: string): string[] {
  const tete = head(name);
  if (!tete.length) return [];
  return QUALIFIANTS.has(tete[0]) ? tete.slice(0, 2) : tete.slice(0, 1);
}

/**
 * Les mots qui font un liquide. Ils sont comparés à des mots entiers, jamais
 * à des morceaux : « museau » ne contient pas « eau », et c'est exactement le
 * genre de piège qui ferait boire une salade de museau.
 */
const BOISSON = new Set([
  'eau', 'eaux', 'jus', 'boisson', 'boissons', 'soda', 'sodas', 'cola', 'limonade', 'diabolo',
  'the', 'infusion', 'tisane', 'cafe', 'cappuccino', 'expresso', 'espresso', 'chocolat',
  'biere', 'bieres', 'vin', 'vins', 'cidre', 'champagne', 'mousseux', 'sangria', 'punch',
  'nectar', 'smoothie', 'milkshake', 'kefir', 'lassi', 'kombucha', 'cocktail', 'lait', 'laits',
]);

const SOUPE = new Set(['soupe', 'soupes', 'bouillon', 'bouillons', 'veloute', 'gaspacho', 'potage', 'consomme']);

/**
 * Ce qui annule, cherché dans le nom entier : une poudre ne se boit pas, un
 * bouillon cube non plus, et « Thé, feuille » est une plante sèche.
 */
const SEC = new Set([
  'poudre', 'soluble', 'lyophilise', 'cube', 'cubes', 'feuille', 'feuilles', 'sachet', 'sachets',
  'grain', 'grains', 'moulu', 'moulue', 'concentre', 'concentree', 'tablette', 'barre', 'pate',
]);

export function isLiquid(name: string): boolean {
  const tete = marqueurs(name);
  const tout = words(name);
  // « Yaourt à boire » se boit, quoi qu'en dise son premier mot.
  if (tout.includes('boire')) return true;
  const reconstitue = tout.some(mot => mot.startsWith('reconstitu'));
  const sec = !reconstitue && (tout.some(mot => SEC.has(mot)) || tout.some(mot => mot.startsWith('deshydrat')));
  if (sec) return false;
  // Le chocolat n'est un liquide que chaud, ou en boisson.
  if (tete[0] === 'chocolat') return tout.includes('chaud') || tout.includes('boisson');
  return tete.some(mot => BOISSON.has(mot) || SOUPE.has(mot));
}

const HUILE = new Set(['huile', 'huiles']);
const PAIN = new Set(['pain', 'pains', 'baguette', 'biscotte', 'biscottes']);
const OEUF = new Set(['oeuf', 'oeufs', 'omelette']);
const YAOURT = new Set(['yaourt', 'yaourts', 'skyr', 'suisse', 'suisses']);
const FROMAGE = new Set(['fromage', 'fromages', 'camembert', 'comte', 'emmental', 'gruyere', 'roquefort', 'brie', 'chevre', 'gouda', 'parmesan', 'mozzarella', 'cheddar', 'feta', 'reblochon', 'tomme', 'tome', 'munster', 'raclette', 'mimolette', 'cantal']);
const FECULENT = new Set(['pates', 'riz', 'semoule', 'quinoa', 'boulgour', 'lentille', 'lentilles', 'haricot', 'haricots', 'pois', 'coquillettes', 'spaghetti', 'spaghettis', 'tagliatelles', 'macaroni', 'puree', 'frites']);

/**
 * La famille d'un aliment, dans l'ordre où les cas se recouvrent : une soupe
 * est un liquide particulier, un yaourt à boire est une boisson, et un
 * fromage blanc se mange à la cuillère comme un yaourt.
 */
export function familyOf(name: string): FoodFamily {
  const tete = marqueurs(name);
  const has = (set: Set<string>) => tete.some(mot => set.has(mot));
  if (!isLiquid(name) && has(HUILE)) return 'huile';
  if (isLiquid(name)) return has(SOUPE) ? 'soupe' : 'liquide';
  if (has(OEUF)) return 'oeuf';
  if (has(PAIN)) return 'pain';
  // Un fromage blanc ou frais se mange à la cuillère, dans un pot : c'est un
  // yaourt pour qui le sert, quoi qu'en dise la fiche Ciqual.
  const tout = words(name);
  const fromageEnPot = tete[0] === 'fromage' && (tout.includes('blanc') || tout.includes('frais') || tout.includes('suisse'));
  if (has(YAOURT) || fromageEnPot) return 'yaourt';
  // « Fromage de tête » est une charcuterie. Le piège valait une ligne.
  if (has(FROMAGE) && !tout.includes('tete')) return 'fromage';
  // Des pâtes crues ne se servent pas à l'assiette : elles triplent de poids
  // à la cuisson, et proposer « 1 assiette = 200 g » serait faux.
  if (has(FECULENT) && !tout.some(mot => mot.startsWith('cru') || mot.startsWith('sec') || mot.startsWith('seche'))) return 'feculent';
  return 'autre';
}

/** L'unité affichée. Les liquides se comptent en millilitres, le reste en grammes. */
export function displayUnit(name: string): 'g' | 'ml' {
  const famille = familyOf(name);
  return famille === 'liquide' || famille === 'soupe' ? 'ml' : 'g';
}

/* ------------------------------------------------------- les mesures ---- */

const MESURES: Record<FoodFamily, Measure[]> = {
  liquide: [
    { id: 'verre', label: '1 verre', amount: 200 },
    { id: 'bol', label: '1 bol', amount: 250 },
    { id: 'tasse', label: '1 tasse', amount: 150 },
    { id: 'mug', label: '1 mug', amount: 300 },
    { id: 'canette', label: '1 canette', amount: 330 },
    { id: 'cuillere-soupe', label: '1 c. à soupe', amount: 15 },
  ],
  soupe: [
    { id: 'bol', label: '1 bol', amount: 250 },
    { id: 'assiette', label: '1 assiette', amount: 300 },
    { id: 'louche', label: '1 louche', amount: 100 },
    { id: 'tasse', label: '1 tasse', amount: 150 },
  ],
  // En grammes : une huile se mesure à la cuillère, et sa densité (0,92) ne
  // vaut pas la peine d'introduire une unité de plus.
  huile: [
    { id: 'cuillere-cafe', label: '1 c. à café', amount: 5 },
    { id: 'cuillere-soupe', label: '1 c. à soupe', amount: 10 },
    { id: 'filet', label: '1 filet', amount: 5 },
  ],
  pain: [
    { id: 'tranche', label: '1 tranche', amount: 30 },
    { id: 'quart-baguette', label: '¼ de baguette', amount: 62 },
    { id: 'petit-pain', label: '1 petit pain', amount: 50 },
    { id: 'biscotte', label: '1 biscotte', amount: 10 },
  ],
  oeuf: [
    { id: 'oeuf', label: '1 œuf', amount: 50 },
  ],
  yaourt: [
    { id: 'pot', label: '1 pot', amount: 125 },
    { id: 'petit-pot', label: '1 petit pot', amount: 60 },
    { id: 'cuillere-soupe', label: '1 c. à soupe', amount: 20 },
  ],
  fromage: [
    { id: 'portion', label: '1 portion', amount: 30 },
    { id: 'tranche', label: '1 tranche', amount: 20 },
    { id: 'des', label: '1 dé', amount: 10 },
  ],
  feculent: [
    { id: 'assiette', label: '1 assiette', amount: 200 },
    { id: 'portion', label: '1 portion', amount: 150 },
    { id: 'cuillere-soupe', label: '1 c. à soupe', amount: 30 },
  ],
  autre: [
    { id: 'portion', label: '1 portion', amount: 100 },
    { id: 'cuillere-soupe', label: '1 c. à soupe', amount: 15 },
    { id: 'poignee', label: '1 poignée', amount: 30 },
  ],
};

/** Les mesures proposées pour cet aliment. Jamais vide. */
export function measuresFor(name: string): Measure[] {
  return MESURES[familyOf(name)];
}

/** Le pas du compteur : on ajuste par demi-mesure, jamais en dessous. */
export const COUNT_STEP = 0.5;
export const MAX_COUNT = 20;

export function stepCount(count: number, direction: 1 | -1): number {
  const next = Math.round((count + direction * COUNT_STEP) * 2) / 2;
  return Math.min(MAX_COUNT, Math.max(COUNT_STEP, next));
}

/** « 1 bol », « 2 bols », « ½ bol », « 1,5 bol ». */
export function countLabel(measure: Measure, count: number): string {
  const nom = measure.label.replace(/^1\s+/, '').replace(/^¼\s+de\s+/, 'baguette ');
  if (count === 0.5) return `½ ${nom}`;
  // En français, le pluriel commence à deux : « 1,5 bol », « 2 bols ».
  const pluriel = count >= 2 && !nom.startsWith('c. à') && !nom.includes('baguette') ? 's' : '';
  const nombre = Number.isInteger(count) ? String(count) : count.toLocaleString('fr-FR');
  return `${nombre} ${nom}${pluriel}`;
}

/** La quantité à passer au calcul, dans l'unité de référence de l'aliment. */
export function quantityFor(measure: Measure, count: number): number {
  return Math.round(measure.amount * count * 100) / 100;
}

/**
 * La référence, relue avec l'unité d'affichage de la famille.
 *
 * Les valeurs Ciqual sont données pour 100 g. Pour un liquide, on présente les
 * mêmes chiffres pour 100 ml : c'est la même quantité de matière à 3 % près,
 * et c'est la seule unité dans laquelle la personne sait répondre.
 */
export function referenceForDisplay(food: SavedFood): FoodReference {
  const unit = displayUnit(food.name);
  if (food.reference.unit !== 'g' || unit !== 'ml') return food.reference;
  return { ...food.reference, unit: 'ml' };
}
