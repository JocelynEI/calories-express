import { ActivityKind, AvatarChoice, Profile } from '../types';

/**
 * V4.3 — la page Activités en tuiles, avec ton personnage.
 *
 * Le personnage est un choix, jamais une déduction cachée : tant que le profil
 * n'est pas rempli et qu'aucun choix n'est fait, il n'y en a pas. Ensuite, il
 * suit le paramètre de la formule (homme ou femme) jusqu'à ce que la personne
 * en choisisse un autre, ou aucun.
 */
export const AVATAR_CHOICES: { id: AvatarChoice; label: string }[] = [
  { id: 'femme', label: 'Elle' },
  { id: 'homme', label: 'Lui' },
  { id: 'aucun', label: 'Aucun' },
];

export function avatarFor(profile: Profile, profileCompleted: boolean): Exclude<AvatarChoice, 'aucun'> | null {
  if (profile.avatar === 'aucun') return null;
  if (profile.avatar) return profile.avatar;
  if (!profileCompleted) return null;
  return profile.sexForFormula === 'male' ? 'homme' : 'femme';
}

/** Les activités proposées en tuiles, dans l'ordre où on les pratique le plus. */
export const TILE_KINDS: ActivityKind[] = ['walk', 'run', 'cycle', 'swim', 'strength', 'interval', 'aqua', 'mobility'];

export const TILE_LABELS: Record<ActivityKind, string> = {
  walk: 'Marche', run: 'Course', cycle: 'Vélo', swim: 'Natation', strength: 'Renfo',
  interval: 'Fractionné', aqua: 'Aquagym', mobility: 'Mobilité', other: 'Autre',
};

type Row = { session: { kind: ActivityKind; minutes: number }; estimate: { activeKcal: number } | null };

/** Minutes et kcal de la journée, par activité. Une séance sans estimation compte ses minutes, pas de kcal inventées. */
export function kindTotals(rows: Row[]): Partial<Record<ActivityKind, { minutes: number; kcal: number }>> {
  const out: Partial<Record<ActivityKind, { minutes: number; kcal: number }>> = {};
  for (const { session, estimate } of rows) {
    const current = out[session.kind] ?? { minutes: 0, kcal: 0 };
    out[session.kind] = { minutes: current.minutes + session.minutes, kcal: current.kcal + (estimate?.activeKcal ?? 0) };
  }
  return out;
}
