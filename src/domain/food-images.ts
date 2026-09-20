import { FOOD_NAMES, FoodName } from '../data/food-names';

/**
 * V2.4 — quelle image montrer pour un aliment.
 *
 * Trois niveaux, du plus vrai au plus générique : la photographie réelle du
 * produit quand Open Food Facts en a une, le dessin correspondant quand le nom
 * évoque un aliment qu'on sait dessiner, une pastille neutre sinon.
 *
 * La correspondance est volontairement littérale : on cherche le mot, pas une
 * ressemblance. Mieux vaut aucune image qu'une pomme en face d'un plat de
 * pâtes — une illustration fausse coûte plus cher en confiance qu'une case
 * vide.
 */
const KEYWORDS: { name: FoodName; words: string[] }[] = [
  { name: 'pomme', words: ['pomme', 'compote'] },
  { name: 'banane', words: ['banane'] },
  { name: 'fraise', words: ['fraise'] },
  { name: 'raisin', words: ['raisin'] },
  { name: 'orange', words: ['orange', 'clémentine', 'clementine', 'mandarine', 'jus d’orange'] },
  { name: 'tomate', words: ['tomate', 'ratatouille', 'gaspacho'] },
  { name: 'carotte', words: ['carotte'] },
  { name: 'brocoli', words: ['brocoli', 'chou', 'épinard', 'epinard', 'haricot vert', 'courgette', 'petits pois'] },
  { name: 'poivron', words: ['poivron', 'piment'] },
  { name: 'salade', words: ['salade', 'crudité', 'crudite', 'laitue', 'mâche', 'roquette'] },
  { name: 'avocat', words: ['avocat', 'guacamole'] },
  { name: 'oeuf', words: ['oeuf', 'œuf', 'omelette'] },
  { name: 'poisson', words: ['poisson', 'saumon', 'thon', 'cabillaud', 'colin', 'sardine', 'maquereau', 'crevette'] },
  { name: 'poulet', words: ['poulet', 'dinde', 'volaille', 'viande', 'boeuf', 'bœuf', 'steak', 'porc', 'jambon'] },
  { name: 'fromage', words: ['fromage', 'comté', 'comte', 'gruyère', 'gruyere', 'emmental', 'chèvre', 'chevre', 'camembert'] },
  { name: 'yaourt', words: ['yaourt', 'yaourt nature', 'fromage blanc', 'skyr', 'petit-suisse'] },
  { name: 'pain', words: ['pain', 'baguette', 'tartine', 'toast', 'biscotte', 'sandwich'] },
  { name: 'pates', words: ['pâtes', 'pates', 'spaghetti', 'penne', 'tagliatelle', 'lasagne', 'macaroni'] },
  { name: 'riz', words: ['riz', 'risotto', 'quinoa', 'semoule', 'boulgour', 'couscous'] },
  { name: 'soupe', words: ['soupe', 'potage', 'velouté', 'veloute', 'bouillon'] },
  { name: 'assiette', words: ['plat', 'repas', 'assiette', 'menu'] },
];

export function drawingFor(label: string): FoodName | null {
  const text = label.toLocaleLowerCase('fr-FR').trim();
  if (!text) return null;
  for (const entry of KEYWORDS) {
    if (entry.words.some(word => text.includes(word))) return entry.name;
  }
  return (FOOD_NAMES as readonly string[]).includes(text) ? (text as FoodName) : null;
}
