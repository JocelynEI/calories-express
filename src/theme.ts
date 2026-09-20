// V1.8 — Les clés de couleur de la V1.7 sont conservées pour ne rien casser
// dans les écrans qui ne sont pas réécrits. Seules les valeurs changent, afin
// que chaque couleur portant du texte atteigne le contraste WCAG AA (4,5:1),
// et 3:1 pour les traits et icônes. Les teintes vives d'origine restent
// disponibles sous les clés « Bright » pour les aplats décoratifs.
//
// Ratios mesurés sur le fond #F5F7FC et sur la carte #FFFFFF :
//   muted 5,8 · inkSoft 9,7 · violet 6,5 · sageDark 8,0 · aqua 4,5
//   gold 4,1 (trait/icône) · goldText 5,5 · coral 6,0
export const colors = {
  reference: '#25364B',
  intake: '#1660B8',
  today: '#A85C07',
  protein: '#1660B8',
  carbs: '#A85C07',
  fat: '#9C2C71',
  background: '#F5F7FC',
  card: '#FFFFFF',
  ink: '#15162B',
  inkSoft: '#3E435C',
  muted: '#5A6076',
  line: '#E4E7F2',
  track: '#ECEFF7',
  sage: '#8B87F5',
  sageDark: '#4A2FD0',
  sagePale: '#EFEEFF',
  gold: '#A8720A',
  goldText: '#8A6209',
  goldBright: '#F2B84B',
  goldPale: '#FFF7E4',
  coral: '#B93027',
  coralBright: '#F26D64',
  coralPale: '#FFF0EF',
  navy: '#1D1B4B',
  aqua: '#0F857D',
  aquaBright: '#21BEB2',
  aquaPale: '#E6FAF7',
  violet: '#5B3FE0',
  violetInk: '#2E2266',
  violetPale: '#F0EDFF',
  violetEdge: '#DCD5FF',
  // V2.6 — surfaces éditoriales pour les visuels premium. Elles restent
  // séparées des couleurs fonctionnelles afin de ne pas modifier le sens des
  // indicateurs déjà utilisés dans le journal.
  visualPale: '#F2F0FF',
  visualInk: '#2F285F',
  visualMint: '#D9F2E9',
  visualWarm: '#FFF7E9',
  // V2.5 — un vert pour le déjeuner. Les quatre moments de la journée
  // partageaient deux violets presque identiques : dans le journal, on ne
  // distinguait plus un déjeuner d'un dîner. Contraste mesuré : 4,8:1 sur
  // blanc pour le texte, l'aplat ne porte que de la couleur.
  leaf: '#2F7A3C',
  leafPale: '#E8F6EA',
  white: '#FFFFFF',
  shadow: '#26235D24',
} as const;

export const radii = {
  small: 12,
  medium: 18,
  large: 26,
  pill: 999,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// Six tailles, au lieu des vingt et une de la V1.7. Rien sous 12.
// Toute nouvelle vue se sert dans cette échelle et nulle part ailleurs.
export const typeScale = {
  hero: { fontSize: 44, lineHeight: 48, fontWeight: '800' as const, letterSpacing: -1.6 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const, letterSpacing: -0.6 },
  section: { fontSize: 20, lineHeight: 26, fontWeight: '800' as const, letterSpacing: -0.3 },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '600' as const },
  secondary: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '600' as const },
} as const;

// Un texte trop petit ne devient pas lisible en grossissant à l'infini :
// au-delà de ce facteur les cartes cassent. Les vues le passent à <Text>.
export const MAX_FONT_SCALE = 1.6;

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  raised: {
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 7,
  },
} as const;
