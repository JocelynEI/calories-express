import { ActivityEffort, ActivityJournal, ActivityKind, ActivitySession, Profile } from '../types';
import { activitySummary, reportedDayIssue, validActiveKcal } from './activity';
import { usesDailyActivity } from './calories';
import { energyPlan, profileIssue } from './energy';

// Standard MET values: 2024 Adult Compendium, https://pacompendium.com/.
// The options describe representative activities, not measured individual effort.
export const ACTIVITY_EFFORTS: Record<Exclude<ActivityKind, 'other'>, Record<ActivityEffort, { met: number; label: string; code: string }>> = {
  walk: { easy: { met: 2.8, label: 'Lente · environ 3–4 km/h', code: '17152' }, moderate: { met: 3.8, label: 'Modérée · environ 4,5–5,5 km/h', code: '17190' }, brisk: { met: 4.8, label: 'Rapide · environ 5,5–6,3 km/h', code: '17200' } },
  run: { easy: { met: 6.5, label: 'Course lente · environ 6,5 km/h', code: '12028' }, moderate: { met: 8.5, label: 'Course · environ 8 km/h', code: '12030' }, brisk: { met: 9.3, label: 'Course · environ 10 km/h', code: '12050' } },
  aqua: { easy: { met: 3.8, label: 'Exercices de résistance dans l’eau', code: '18356' }, moderate: { met: 5.5, label: 'Aquagym générale', code: '18355' }, brisk: { met: 7.5, label: 'Aquafitness soutenu', code: '18358' } },
  cycle: { easy: { met: 4.3, label: 'Allure facile', code: '01015' }, moderate: { met: 7, label: 'Allure modérée', code: '01016' }, brisk: { met: 9, label: 'Allure soutenue', code: '01017' } },
  swim: { easy: { met: 5.8, label: 'Crawl lent / loisir', code: '18240' }, moderate: { met: 8, label: 'Crawl à allure moyenne', code: '18290' }, brisk: { met: 9.8, label: 'Nage libre rapide', code: '18230' } },
  strength: { easy: { met: 3, label: 'Poids du corps, général', code: '02056' }, moderate: { met: 3.5, label: 'Plusieurs exercices avec charges', code: '02054' }, brisk: { met: 6, label: 'Musculation soutenue', code: '02050' } },
  interval: { easy: { met: 3.5, label: 'Circuit léger', code: '02034' }, moderate: { met: 5, label: 'Circuit modéré', code: '02035' }, brisk: { met: 7.5, label: 'Circuit soutenu, peu de repos', code: '02040' } },
  mobility: { easy: { met: 2.3, label: 'Mobilité / étirements doux', code: '02101' }, moderate: { met: 2.3, label: 'Mobilité / étirements doux', code: '02101' }, brisk: { met: 2.3, label: 'Mobilité / étirements doux', code: '02101' } },
};

export function validActivityWeight(weight: unknown): weight is number {
  return typeof weight === 'number' && Number.isFinite(weight) && weight >= 35 && weight <= 300;
}
export function normallyIncludedInSteps(kind: ActivityKind) { return kind === 'walk' || kind === 'run'; }
export function sessionEnergyIssue(session: ActivitySession, fallbackWeight?: number): string | null {
  if (!Number.isFinite(session.minutes) || session.minutes < 1 || session.minutes > 600) return 'Indique la durée réellement effectuée, entre 1 et 600 minutes.';
  if (session.energySource === 'reported') return validActiveKcal(session.reportedActiveKcal) ? null : 'Recopie les calories actives de ta séance (0 à 10 000 kcal).';
  if (session.kind === 'other' || !Object.hasOwn(ACTIVITY_EFFORTS, session.kind)) return 'Choisis une activité proposée pour l’estimation, ou « Saisir mes kcal » si tu connais la dépense de cette séance.';
  if (!validActivityWeight(session.weightKg ?? fallbackWeight)) return 'Indique ton poids en kg pour calculer les kcal de la séance.';
  if (!Object.hasOwn(ACTIVITY_EFFORTS[session.kind], session.effort ?? 'easy')) return 'Choisis une intensité pour calculer la dépense.';
  return null;
}
export function sessionEnergy(session: ActivitySession, fallbackWeight?: number) {
  if (sessionEnergyIssue(session, fallbackWeight)) return null;
  if (session.energySource === 'reported') return { source: 'reported' as const, activeKcal: Math.round(session.reportedActiveKcal!), grossKcal: null, weightKg: null, met: null, label: session.deviceName?.trim() || 'Kcal saisies', code: null, usesDefaults: false };
  if (session.kind === 'other') return null;
  const weight = (session.weightKg ?? fallbackWeight)!;
  const reference = ACTIVITY_EFFORTS[session.kind][session.effort ?? 'easy'];
  const hours = session.minutes / 60;
  return { source: 'estimated' as const, activeKcal: Math.round((reference.met - 1) * weight * hours), grossKcal: Math.round(reference.met * weight * hours), weightKg: weight, met: reference.met, label: reference.label, code: reference.code, usesDefaults: !session.effort || !session.weightKg };
}

// Explicit app model, not a pedometer measurement: 3 MET, 100 steps/minute.
// These assumptions vary with gait, terrain and pauses. Rest is subtracted.
export const DEFAULT_BASELINE_STEPS = 2000; // Editable accounting allowance, not a health target.
export function stepEnergy(steps: number | null, weight?: number, baselineSteps = DEFAULT_BASELINE_STEPS) {
  if (steps === null || !Number.isInteger(steps) || steps < 0 || steps > 100000 || typeof weight !== 'number' || !Number.isFinite(weight) || weight < 35 || weight > 300 || !Number.isInteger(baselineSteps) || baselineSteps < 0 || baselineSteps > 100000) return null;
  const kcalPerStep = (3 - 1) * weight / (100 * 60);
  return { activeKcal: Math.round(steps * kcalPerStep), eligibleKcal: Math.round(Math.max(0, steps - baselineSteps) * kcalPerStep), weightKg: weight, baselineSteps };
}
export function activityEnergy(journal: ActivityJournal, day: string, weight?: number) {
  const summary = activitySummary(journal, day);
  const details = journal.stepDetailsByDay?.[day];
  const stepsEstimate = stepEnergy(summary.steps, details?.weightKg ?? weight, details?.baselineSteps);
  const rows = summary.sessions.map(session => ({ session, estimate: sessionEnergy(session, weight) }));
  const overlaps = (s: ActivitySession) => s.includedInSteps ?? normallyIncludedInSteps(s.kind);
  const overlapRows = rows.filter(row => overlaps(row.session));
  const separateRows = rows.filter(row => !overlaps(row.session));
  const sum = (rs: typeof rows, eligible = false) => rs.reduce((n, row) => n + (!eligible || row.session.includeInGoal !== false ? row.estimate?.activeKcal ?? 0 : 0), 0);
  // The larger estimate replaces the other in the shared movement bucket.
  // Do not add step-derived energy to energy from the same walking session.
  const overlapKcal = sum(overlapRows);
  const computedActiveKcal = Math.max(stepsEstimate?.activeKcal ?? 0, overlapKcal) + sum(separateRows);
  const excludedOverlapKcal = overlapKcal - sum(overlapRows, true);
  const stepCredit = stepsEstimate ? Math.min(stepsEstimate.eligibleKcal, Math.max(0, stepsEstimate.activeKcal - excludedOverlapKcal)) : 0;
  const computedEligibleKcal = Math.max(stepCredit, sum(overlapRows, true)) + sum(separateRows, true);
  const rawReport = journal.reportedEnergyByDay?.[day];
  const report = rawReport && !reportedDayIssue(rawReport) ? rawReport : null;
  const excludedSessionKcal = sum(rows) - sum(rows, true);
  const activeKcal = report ? Math.round(report.activeKcal) : computedActiveKcal;
  // A reported DAILY total replaces estimates; steps and sessions stay informative.
  const eligibleKcal = report ? Math.round(Math.max(0, report.activeKcal - Math.max(report.baselineActiveKcal, excludedSessionKcal))) : computedEligibleKcal;
  const estimatedSessionKcal = sum(rows.filter(row => row.estimate?.source === 'estimated'));
  const reportedSessionKcal = sum(rows.filter(row => row.estimate?.source === 'reported'));
  const sessionKcal = estimatedSessionKcal + reportedSessionKcal;
  const hasEnergy = Boolean(report || stepsEstimate || rows.some(row => row.estimate));
  const partial = !report && (rows.some(row => !row.estimate) || (summary.steps !== null && !stepsEstimate));
  return { ...summary, rows, stepsEstimate, report, computedActiveKcal, estimatedSessionKcal, reportedSessionKcal, sessionKcal, hasEnergy, partial, overlapKcal, deduplicatedKcal: stepsEstimate ? Math.min(stepsEstimate.activeKcal, overlapKcal) : 0, activeKcal, eligibleKcal, unknown: rows.filter(row => !row.estimate).length, usesDefaults: rows.some(row => row.estimate?.usesDefaults) || (summary.steps !== null && !details?.weightKg) };
}

export function dailyEnergyPlan(profile: Profile, journal: ActivityJournal, day: string, hasProfile = true) {
  const activity = activityEnergy(journal, day, hasProfile ? profile.weightKg : undefined);
  const dynamic = usesDailyActivity(profile);
  const creditedKcal = dynamic && hasProfile && !profileIssue(profile) ? activity.eligibleKcal : 0;
  const base = energyPlan(profile);
  const plan = energyPlan(profile, creditedKcal);
  const issue = profileIssue(profile) ?? (plan.target > 10000 ? 'Vérifie les durées saisies : ce repère dépasse les limites de cette version.' : null);
  return { ...plan, baseTarget: base.target, baseMaintenance: base.maintenance, creditedKcal, dynamic, activity, issue };
}
