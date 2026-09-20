import { Profile } from '../types';
import { calculateDailyTarget, calculateMaintenance } from './calories';

export const kcal = (value: number) => Math.round(value).toLocaleString('fr-FR');

export function profileIssue(profile: Profile): string | null {
  if (!Number.isInteger(profile.age) || profile.age < 18 || profile.age > 120) return 'Renseigne un âge adulte valide, entre 18 et 120 ans.';
  if (!Number.isFinite(profile.heightCm) || profile.heightCm < 120 || profile.heightCm > 230) return 'Vérifie la taille saisie, en centimètres (120 à 230).';
  if (!Number.isFinite(profile.weightKg) || profile.weightKg < 35 || profile.weightKg > 300) return 'Vérifie le poids saisi, en kilogrammes (35 à 300).';
  const target = calculateDailyTarget(profile);
  if (target < 1000 || target > 10000) return 'Cet objectif sort des limites de cette version. Vérifie tes informations et définis un repère adapté avec un professionnel de santé.';
  return null;
}

export function energyPlan(profile: Profile, activeCalories = 0) {
  const maintenance = calculateMaintenance(profile, activeCalories);
  const target = calculateDailyTarget(profile, activeCalories);
  // Manual targets are final targets, not an amount to which a second
  // goal adjustment should be applied.
  const plannedDifference = maintenance - target;
  const direction = plannedDifference > 0 ? 'deficit' : plannedDifference < 0 ? 'surplus' : 'maintenance';
  return { maintenance, target, plannedDifference, direction } as const;
}

// Only compare amounts. A partial journal cannot establish the real energy
// deficit for a full day, so this function never returns an actual deficit.
export function compareIntake(intake: number, target: number, maintenance: number) {
  return { toTarget: target - intake, toMaintenance: maintenance - intake };
}

export function goalMismatch(profile: Profile): string | null {
  const { direction } = energyPlan(profile);
  if (profile.goal === 'lose' && direction !== 'deficit') return 'Ta valeur manuelle ne prévoit pas de déficit par rapport au maintien estimé. Vérifie-la si ton objectif est de perdre du poids.';
  if (profile.goal === 'gain' && direction !== 'surplus') return 'Ta valeur manuelle ne prévoit pas d’apport au-dessus du maintien estimé. Vérifie sa cohérence avec ton objectif.';
  if (profile.goal === 'maintain' && direction !== 'maintenance') return 'Ta valeur manuelle diffère du maintien estimé. C’est possible : vérifie qu’elle correspond au repère que tu souhaites utiliser.';
  return null;
}
