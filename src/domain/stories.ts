/**
 * V1.8 — « Les minutes de Jaws ».
 *
 * De courtes séquences animées, jouées dans l'application. Chaque scène est
 * dessinée en SVG et animée à l'écran : aucune vidéo n'est téléchargée, aucun
 * lecteur externe n'est appelé, et l'ensemble pèse quelques kilo-octets. Elles
 * fonctionnent donc hors ligne et dans Expo Go, sans dépendance nouvelle.
 *
 * Le champ `videoUri` est réservé : si un vrai fichier MP4 est ajouté plus tard
 * (avec expo-video), il remplacera le dessin de cette scène sans changer le
 * reste. Le lecteur ignore ce champ tant qu'aucun fichier n'est fourni.
 *
 * Le contenu reste explicatif et non médical : il décrit ce que l'application
 * calcule et comment le lire, jamais ce que la personne devrait faire de son
 * corps. Aucune scène ne propose de compenser un repas.
 */

export type SceneArt =
  | 'clock'
  | 'balance'
  | 'ring'
  | 'label'
  | 'steps'
  | 'scale'
  | 'plate'
  | 'moon'
  | 'breath'
  | 'jaws';

export type StoryScene = {
  art: SceneArt;
  /** Le titre affiché en grand pendant la scène. Court : il est lu en 4 s. */
  headline: string;
  /** Une ou deux phrases sous le titre. */
  caption: string;
  durationMs?: number;
  /** Variante de dessin, interprétée par chaque scène. */
  variant?: string;
  /** Valeur mise en scène (un nombre de pas, un ratio…). */
  value?: number;
  /** Réservé : chemin d'un MP4 qui remplacerait le dessin de cette scène. */
  videoUri?: string;
};

export type StoryAccent = 'violet' | 'aqua' | 'gold' | 'coral';

export type Story = {
  id: string;
  title: string;
  theme: string;
  accent: StoryAccent;
  summary: string;
  scenes: StoryScene[];
  sources?: { label: string; url: string }[];
};

export const SCENE_DURATION = 4600;

export const STORIES: Story[] = [
  {
    id: 'repere',
    title: 'Ton repère en une minute',
    theme: 'Comprendre',
    accent: 'violet',
    summary: 'D’où sort le nombre affiché sur ton baromètre.',
    scenes: [
      {
        art: 'clock',
        headline: 'Le maintien',
        caption: 'C’est l’énergie estimée dont ton corps a besoin sur une journée entière, en comptant ton activité habituelle. L’application le calcule avec ton profil.',
      },
      {
        art: 'balance',
        headline: 'L’écart prévu',
        caption: 'Pour une perte, l’application retire 300 kcal au maintien estimé. Pour une prise, elle en ajoute 250. C’est un point de départ, modifiable.',
        variant: 'deficit',
      },
      {
        art: 'ring',
        headline: 'Ton objectif alimentaire',
        caption: 'Le nombre du baromètre, c’est le maintien une fois l’écart appliqué. L’écart est donc déjà dedans.',
        value: 0.58,
      },
      {
        art: 'jaws',
        headline: 'Ne le retire pas deux fois',
        caption: 'Suivre ce repère suffit. Manger encore moins « pour être sûr » retirerait le déficit une seconde fois.',
      },
    ],
    sources: [
      { label: 'Assurance Maladie — modifier son quotidien', url: 'https://www.ameli.fr/assure/sante/themes/surpoids-obesite-adulte/modifier-quotidien' },
    ],
  },
  {
    id: 'etiquette',
    title: 'Lire une étiquette',
    theme: 'Saisir',
    accent: 'aqua',
    summary: 'La colonne que tu choisis change tout le calcul.',
    scenes: [
      {
        art: 'label',
        headline: 'Pour 100 g',
        caption: 'La colonne de gauche décrit toujours 100 g du produit, pas le paquet ni ce que tu as mangé.',
        variant: 'hundred',
      },
      {
        art: 'label',
        headline: 'Par portion',
        caption: 'La colonne de droite décrit la portion choisie par la marque. « 200 kcal pour 2 biscuits » fait 100 kcal le biscuit, pas 200.',
        variant: 'portion',
      },
      {
        art: 'balance',
        headline: 'Puis ta quantité',
        caption: '150 kcal pour 100 g et 250 g mangés donnent 375 kcal. L’application fait ce calcul, mais c’est toi qui confirmes la quantité.',
        variant: 'scale',
      },
      {
        art: 'jaws',
        headline: 'Un poids ne s’invente pas',
        caption: 'Si le poids d’une pièce est inconnu, l’application le demande. Elle ne le devine ni depuis le nom, ni depuis la photo.',
      },
    ],
  },
  {
    id: 'pas',
    title: 'Les kcal de tes pas',
    theme: 'Bouger',
    accent: 'gold',
    summary: 'Comment l’application estime, et pourquoi elle se méfie.',
    scenes: [
      {
        art: 'steps',
        headline: 'Une hypothèse, pas une mesure',
        caption: 'L’application suppose une marche à 100 pas par minute et 3 MET. Elle ne lit ni ton allure, ni ton téléphone, ni ta montre.',
        value: 6000,
      },
      {
        art: 'steps',
        headline: 'Les pas déjà comptés',
        caption: 'Une partie de tes pas est déjà comprise dans la base de ta journée. Par défaut 2 000, un réglage modifiable, pas un objectif de santé.',
        variant: 'baseline',
        value: 6000,
      },
      {
        art: 'balance',
        headline: 'Jamais deux fois',
        caption: 'Si une marche est déjà dans ton total de pas, l’application garde la plus grande des deux estimations au lieu de les additionner.',
        variant: 'dedupe',
      },
      {
        art: 'jaws',
        headline: 'Et si tu as une montre',
        caption: 'Recopie ses calories actives : ta valeur remplace l’estimation. Le repos, lui, est déjà compté dans la base.',
      },
    ],
    sources: [
      { label: 'Compendium 2024 des activités physiques', url: 'https://pacompendium.com/' },
    ],
  },
  {
    id: 'poids',
    title: 'Le poids d’un matin',
    theme: 'Progresser',
    accent: 'coral',
    summary: 'Pourquoi la balance saute, et ce qu’il faut regarder.',
    scenes: [
      {
        art: 'scale',
        headline: 'Un point ne dit rien',
        caption: 'D’un matin à l’autre, le chiffre bouge surtout avec l’eau, le sel, le transit et l’heure de la pesée.',
        variant: 'points',
      },
      {
        art: 'scale',
        headline: 'La moyenne, elle, parle',
        caption: 'La courbe lissée sur sept jours efface ces variations. C’est la ligne à suivre, pas les points.',
        variant: 'average',
      },
      {
        art: 'balance',
        headline: 'Deux à trois semaines',
        caption: 'En dessous, une tendance n’est pas lisible. L’application le dit plutôt que d’afficher un chiffre rassurant.',
        variant: 'time',
      },
      {
        art: 'jaws',
        headline: 'Pèse-toi comme tu veux',
        caption: 'Tous les jours ou une fois par semaine, l’important est de garder les mêmes conditions. Sauter une pesée n’efface rien.',
      },
    ],
    sources: [
      { label: 'NIDDK — Body Weight Planner', url: 'https://www.niddk.nih.gov/bwp' },
    ],
  },
  {
    id: 'assiette',
    title: 'Composer une assiette',
    theme: 'Manger',
    accent: 'aqua',
    summary: 'Des repères de volume, sans peser chaque aliment.',
    scenes: [
      {
        art: 'plate',
        headline: 'Des repères de volume',
        caption: 'Légumes, féculents, source de protéines : penser en parts d’assiette évite de tout peser à chaque repas.',
        variant: 'thirds',
      },
      {
        art: 'plate',
        headline: 'Les protéines rassasient',
        caption: 'L’application vise environ 1,5 g par kilo de poids, ou 1,8 g en prise. Un repère de calcul, pas une prescription.',
        variant: 'protein',
      },
      {
        art: 'balance',
        headline: 'Cuit ou cru, ce n’est pas pareil',
        caption: 'Un riz cru et un riz cuit n’ont pas la même référence Ciqual. Choisis la préparation que tu as réellement mangée.',
        variant: 'scale',
      },
      {
        art: 'jaws',
        headline: 'Une moyenne, pas ta recette',
        caption: 'Ciqual donne une composition moyenne. Ta recette et ta marque peuvent en différer : compose un plat maison si tu veux être précis.',
      },
    ],
    sources: [
      { label: 'Anses — table Ciqual 2025', url: 'https://doi.org/10.57745/RDMHWY' },
    ],
  },
  {
    id: 'soir',
    title: 'Une journée différente',
    theme: 'Souffler',
    accent: 'violet',
    summary: 'Ce que l’application ne te demandera jamais de faire.',
    scenes: [
      {
        art: 'clock',
        headline: 'Le repas est passé',
        caption: 'Il est noté, et c’est tout. L’application ne propose jamais de compenser un repas par de l’activité.',
        variant: 'evening',
      },
      {
        art: 'moon',
        headline: 'Pas de punition demain',
        caption: 'Une journée au-dessus du repère ne demande pas une journée en dessous. Les habitudes se lisent sur des semaines.',
      },
      {
        art: 'breath',
        headline: 'Bouger reste une envie',
        caption: 'Les idées de marche ou de mobilité sont là si tu en as envie. Consulter une idée n’ajoute jamais de minutes à ton journal.',
      },
      {
        art: 'jaws',
        headline: 'Et tu peux me couper',
        caption: 'Dans Profil, tu peux désactiver mes conseils après un repas, les animations, ou ces séquences. L’application fonctionne sans moi.',
      },
    ],
  },
];

export const storyById = (id: string) => STORIES.find(story => story.id === id) ?? null;

export const storyDuration = (story: Story) =>
  story.scenes.reduce((total, scene) => total + (scene.durationMs ?? SCENE_DURATION), 0);

export const storyLengthLabel = (story: Story) => {
  const seconds = Math.round(storyDuration(story) / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')}` : `${seconds} s`;
};

export type StoryHistory = { seen: string[] };
export const EMPTY_STORY_HISTORY: StoryHistory = { seen: [] };

export function readStoryHistory(raw: unknown): StoryHistory {
  if (!raw || typeof raw !== 'object') return { seen: [] };
  const seen = (raw as Partial<StoryHistory>).seen;
  if (!Array.isArray(seen)) return { seen: [] };
  return { seen: seen.filter((id): id is string => typeof id === 'string' && STORIES.some(story => story.id === id)) };
}

export function markStorySeen(history: StoryHistory, id: string): StoryHistory {
  if (!STORIES.some(story => story.id === id) || history.seen.includes(id)) return history;
  return { seen: [...history.seen, id] };
}

/** Les séquences non vues d'abord, puis les autres, sans jamais rien cacher. */
export function orderedStories(history: StoryHistory): Story[] {
  return [...STORIES].sort((a, b) => Number(history.seen.includes(a.id)) - Number(history.seen.includes(b.id)));
}
