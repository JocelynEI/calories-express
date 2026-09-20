export const shortTime = (iso: string) => new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit', minute: '2-digit',
}).format(new Date(iso));

export const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// V1.8 — navigation par date. Un jour est une chaîne « AAAA-MM-JJ » interprétée
// à midi, pour qu'un changement d'heure d'été ne décale jamais la journée.
export const dayDate = (day: string) => new Date(`${day}T12:00:00`);

export const isValidDay = (day: unknown): day is string =>
  typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && dayKey(dayDate(day)) === day;

export const shiftDay = (day: string, delta: number) => {
  const date = dayDate(day);
  date.setDate(date.getDate() + delta);
  return dayKey(date);
};

/** Distance en jours entre deux journées ; positive si `day` est après `from`. */
export const dayDistance = (day: string, from: string) =>
  Math.round((dayDate(day).getTime() - dayDate(from).getTime()) / 86400000);

/** « Aujourd'hui », « Hier », « Avant-hier », puis la date écrite. */
export const dayLabel = (day: string, today = dayKey(new Date())) => {
  const distance = dayDistance(day, today);
  if (distance === 0) return 'Aujourd’hui';
  if (distance === -1) return 'Hier';
  if (distance === -2) return 'Avant-hier';
  const formatted = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(dayDate(day));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

/** Forme courte pour les puces et l'axe du graphique : « lun. 15 ». */
export const shortDayLabel = (day: string) =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' }).format(dayDate(day));

/**
 * Horodatage d'un repas ajouté sur une journée choisie. Aujourd'hui garde
 * l'heure réelle ; une journée passée est datée à midi, faute de mieux, plutôt
 * que d'inventer une heure de repas.
 */
export const timestampForDay = (day: string, now = new Date()) => {
  if (day === dayKey(now)) return now.toISOString();
  const date = dayDate(day);
  return date.toISOString();
};

/** « Samedi 20 septembre », pour l'écran d'ouverture. */
export const longDayLabel = (date = new Date()) => {
  const formatted = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};
