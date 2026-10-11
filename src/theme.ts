// V3.4 — « L'assiette » : un vert de cuisine à la place du violet.
//
// La refonte de l'accueil part d'une assiette vue du dessus. Le violet et le
// cyan venaient d'un brief d'application de santé ; le vert, l'orange des
// pastilles de quantité et le prune du dîner viennent de la cuisine.
//
// La règle de la V2.7 ne change pas : les aplats (`…Fill`, `…Pale`) pour les
// fonds et les pastilles, leurs **encres** (`…Ink`) pour le texte, chacune
// assombrie juste assez pour passer 4,5:1 sur sa pastille ET sous un texte
// blanc.
//
// Les noms des clés ne changent pas, seules leurs valeurs : `violet` reste la
// couleur principale (désormais verte), `navy` la couleur sombre. Renommer
// toucherait chaque écran pour un même résultat.
//
// Contrastes mesurés (texte sur fond) :
//   ink 10,9 sur l'écran · muted 6,5 sur carte, 5,7 sur l'écran
//   violet 5,8 sur carte, 4,9 sur sa pastille · blanc sur violet 5,8
//   mintInk 5,7 · warmInk 6,1 · greenInk 5,4 · purpleInk 5,9
//   onDarkMuted 9,2 sur navy
export const colors = {
  // ---- Couleurs de base -------------------------------------------------------
  violet: '#2A7246',        // Couleur principale (vert) — boutons, jauge
  navy: '#1F3A2E',          // Vert très sombre — titres majeurs, badges
  mintFill: '#3FA7B5',      // Bleu-vert — aplat
  mintPale: '#E2F2F3',
  warmFill: '#F29A4A',      // Orange — aplat
  warmPale: '#FCEBD7',
  greenFill: '#7BB662',     // Vert tendre — aplat
  greenPale: '#E7F1DF',
  purpleFill: '#A0679B',    // Prune — aplat
  purplePale: '#F4E9F2',
  background: '#EEF2EA',    // Fond de l'écran, vert très pâle
  card: '#FFFFFF',
  ink: '#1F3A2E',           // Texte principal
  muted: '#4E6357',         // Texte secondaire
  white: '#FFFFFF',

  // ---- Encres : les mêmes teintes, lisibles en texte -------------------------
  mintInk: '#1D6670',
  warmInk: '#8A4500',
  greenInk: '#3A6B29',
  purpleInk: '#7F4579',

  // ---- Neutres dérivés -------------------------------------------------------
  inkSoft: '#3A5245',       // corps de texte long, entre ink et muted
  line: '#E2E8DD',
  track: '#DCE4D6',
  onDarkMuted: '#CFE3D6',   // texte secondaire sur fond sombre (navy)
  fieldEdge: '#C3CEC4',     // bord des champs de saisie et des choix

  // ---- Bords des pastilles : un ton plus soutenu que chaque aplat pâle -------
  mintEdge: '#C4E3E6',
  warmEdge: '#F3D3AE',
  greenEdge: '#CFE2C2',

  // ---- Clés historiques, remappées sur les couleurs de base ------------------
  reference: '#1F3A2E',
  intake: '#2A7246',
  today: '#8A4500',
  protein: '#2A7246',
  carbs: '#F29A4A',
  fat: '#3FA7B5',
  sage: '#A0679B',
  sageDark: '#2A7246',
  sagePale: '#E3EFE6',     // pastille de la couleur principale, comme violetPale
  gold: '#8A4500',
  goldText: '#8A4500',
  goldBright: '#F29A4A',
  goldPale: '#FCEBD7',
  coral: '#B93027',
  coralBright: '#F26D64',
  coralPale: '#FFF0EF',
  aqua: '#1D6670',
  aquaBright: '#3FA7B5',
  aquaPale: '#E2F2F3',
  violetInk: '#1F3A2E',
  violetPale: '#E3EFE6',    // pastille de la couleur principale
  violetEdge: '#C5DCCB',    // bord des cartes de la couleur principale
  leaf: '#3A6B29',
  leafPale: '#E7F1DF',
  visualPale: '#E3EFE6',
  visualInk: '#1F3A2E',
  visualMint: '#E2F2F3',
  visualWarm: '#FCEBD7',
  shadow: '#000000',
} as const;

// Brief : cartes 20 px, pilules 100 px, champs de saisie 16 px.
export const radii = {
  small: 12,
  input: 16,
  medium: 16,
  large: 20,
  xl: 24,
  pill: 100,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/**
 * V3.4 — Figtree pour le texte, Bricolage Grotesque pour les titres et les
 * grands chiffres. Une famille par graisse.
 *
 * Avec une police chargée, Android ignore `fontWeight` : il faut nommer la
 * famille de la graisse voulue. Aucune vue ne doit donc écrire `fontWeight` —
 * un garde-fou automatique le vérifie.
 */
export const fonts = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
  extrabold: 'Figtree_800ExtraBold',
  display: 'BricolageGrotesque_700Bold',
  displayHeavy: 'BricolageGrotesque_800ExtraBold',
} as const;

// Hiérarchie du brief. Rien sous 12. Titres et grands chiffres en Bricolage.
export const typeScale = {
  numeric: { fontSize: 32, lineHeight: 38, fontFamily: fonts.displayHeavy, letterSpacing: -1 }, // 1 310
  display: { fontSize: 28, lineHeight: 34, fontFamily: fonts.display, letterSpacing: -0.6 },    // Bonjour Jocelyn
  section: { fontSize: 20, lineHeight: 26, fontFamily: fonts.display, letterSpacing: -0.3 },    // Mes repas
  cardTitle: { fontSize: 16, lineHeight: 22, fontFamily: fonts.semibold },                      // Porridge…
  body: { fontSize: 14, lineHeight: 20, fontFamily: fonts.medium },
  caption: { fontSize: 12, lineHeight: 17, fontFamily: fonts.regular },                         // Petit-déjeuner · 08:10
  // Anciennes clés, pour les vues pas encore reprises.
  hero: { fontSize: 44, lineHeight: 48, fontFamily: fonts.displayHeavy, letterSpacing: -1.6 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: fonts.display, letterSpacing: -0.6 },
  secondary: { fontSize: 14, lineHeight: 20, fontFamily: fonts.medium },
} as const;

// Un texte trop petit ne devient pas lisible en grossissant à l'infini :
// au-delà de ce facteur les cartes cassent. Les vues le passent à <Text>.
export const MAX_FONT_SCALE = 1.6;

// Brief : « Soft Elevation » 0 8 24 rgba(0,0,0,0.04). Sur iOS, shadowRadius
// correspond à peu près à la moitié du flou CSS ; Android n'a qu'une élévation.
export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 7,
  },
} as const;
