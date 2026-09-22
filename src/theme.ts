// V2.7 — design system « Calories Express » (Modern Soft UI).
//
// Deux familles de couleurs, et une règle pour choisir :
//
// - Les couleurs du brief, **exactes**, pour tout ce qui est aplat : fonds de
//   carte, jauge, pastilles, icônes posées sur fond clair. Clés `…Fill`/`…Pale`
//   et les clés historiques qui ne portent pas de texte.
// - Leurs **encres**, calculées pour le texte. Trois accents du brief sont
//   illisibles comme texte : cyan 2,2:1, jaune 1,7:1, vert 2,8:1, pour un
//   minimum de 4,5:1. Chaque encre est la même teinte, assombrie juste assez
//   pour passer 4,5:1 sur sa pastille ET sous un texte blanc. Le brun doré
//   obtenu pour le jaune est d'ailleurs celui de la pastille « Petit-déjeuner »
//   du moodboard.
//
// Les clés de la V1.7 sont conservées pour ne rien casser dans les écrans qui
// ne sont pas encore repris : seules leurs valeurs changent.
//
// Contrastes mesurés (texte sur fond) :
//   ink 15,2 sur l'écran · muted 4,7 sur carte, 4,4 sur l'écran
//   violet 5,9 · mintInk 4,7 · warmInk 4,6 · greenInk 4,7 · purpleInk 4,6
export const colors = {
  // ---- Brief : couleurs exactes ----------------------------------------------
  violet: '#5B48E8',        // Primary Violet — CTA, jauge
  navy: '#1A1B4B',          // Primary Dark — titres majeurs, badges
  mintFill: '#00C4CC',      // Mint / Fresh Cyan — aplat
  mintPale: '#E6F8F8',
  warmFill: '#EAC15C',      // Warm Orange — aplat
  warmPale: '#FFF9EB',
  greenFill: '#4CAF50',     // Soft Green — aplat
  greenPale: '#EBF7ED',
  purpleFill: '#8C62FF',    // Soft Purple — aplat
  purplePale: '#F3EFFF',
  background: '#F5F7FB',    // Background Light
  card: '#FFFFFF',          // Surface White
  ink: '#1E2022',           // Text Main
  muted: '#6C757D',         // Text Muted
  white: '#FFFFFF',

  // ---- Encres : les mêmes teintes, lisibles en texte -------------------------
  mintInk: '#007A7F',
  warmInk: '#906C13',
  greenInk: '#367B38',
  purpleInk: '#7643FF',

  // ---- Neutres dérivés -------------------------------------------------------
  inkSoft: '#43484D',       // corps de texte long, entre ink et muted
  line: '#E9ECF2',
  track: '#EDEFF5',

  // ---- Clés historiques, remappées sur le design system ----------------------
  reference: '#1A1B4B',
  intake: '#5B48E8',
  today: '#906C13',
  protein: '#5B48E8',
  carbs: '#EAC15C',
  fat: '#00C4CC',
  sage: '#8C62FF',
  sageDark: '#5B48E8',
  sagePale: '#F3EFFF',
  gold: '#906C13',
  goldText: '#906C13',
  goldBright: '#EAC15C',
  goldPale: '#FFF9EB',
  coral: '#B93027',
  coralBright: '#F26D64',
  coralPale: '#FFF0EF',
  aqua: '#007A7F',
  aquaBright: '#00C4CC',
  aquaPale: '#E6F8F8',
  violetInk: '#1A1B4B',
  violetPale: '#F3EFFF',
  violetEdge: '#DDD5FF',
  leaf: '#367B38',
  leafPale: '#EBF7ED',
  visualPale: '#F3EFFF',
  visualInk: '#1A1B4B',
  visualMint: '#E6F8F8',
  visualWarm: '#FFF9EB',
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
 * V2.7 — Plus Jakarta Sans, une famille par graisse.
 *
 * Avec une police chargée, Android ignore `fontWeight` : il faut nommer la
 * famille de la graisse voulue. Aucune vue ne doit donc écrire `fontWeight` —
 * un garde-fou automatique le vérifie.
 */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

// Hiérarchie du brief. Rien sous 12.
export const typeScale = {
  numeric: { fontSize: 32, lineHeight: 38, fontFamily: fonts.extrabold, letterSpacing: -1 },   // 1 310
  display: { fontSize: 28, lineHeight: 34, fontFamily: fonts.bold, letterSpacing: -0.6 },      // Bonjour Jocelyn
  section: { fontSize: 20, lineHeight: 26, fontFamily: fonts.bold, letterSpacing: -0.3 },      // Mes repas
  cardTitle: { fontSize: 16, lineHeight: 22, fontFamily: fonts.semibold },                      // Porridge…
  body: { fontSize: 14, lineHeight: 20, fontFamily: fonts.medium },
  caption: { fontSize: 12, lineHeight: 17, fontFamily: fonts.regular },                         // Petit-déjeuner · 08:10
  // Anciennes clés, pour les vues pas encore reprises.
  hero: { fontSize: 44, lineHeight: 48, fontFamily: fonts.extrabold, letterSpacing: -1.6 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: fonts.bold, letterSpacing: -0.6 },
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
