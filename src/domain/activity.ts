import { ActivityJournal, ActivityKind, ActivitySession, StepDetails, ReportedDayEnergy } from '../types';
import { dayKey } from './date';

export const ACTIVITY_LABELS: Record<ActivityKind, string> = { walk: 'Marche', run: 'Course à pied', swim: 'Natation', aqua: 'Aquagym / Aquafitness', cycle: 'Vélo', strength: 'Renforcement', interval: 'Circuit / Fractionné', mobility: 'Mobilité', other: 'Autre activité' };
export const EMPTY_ACTIVITY: ActivityJournal = { sessions: [], stepsByDay: {} };
export function validDay(day: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && dayKey(new Date(`${day}T12:00:00`)) === day;
}
export function activityIssue(entry: ActivitySession, journal: ActivityJournal): string | null {
  if (!validDay(entry.day) || entry.day > dayKey(new Date())) return 'Choisis une journée passée ou aujourd’hui.';
  if (!Object.hasOwn(ACTIVITY_LABELS, entry.kind)) return 'Choisis une activité.';
  if (entry.effort !== undefined && !['easy', 'moderate', 'brisk'].includes(entry.effort)) return 'Vérifie l’intensité de la séance.';
  if (entry.energySource !== undefined && !['estimated', 'reported'].includes(entry.energySource)) return 'Choisis une estimation ou une valeur saisie.';
  if (entry.energySource === 'reported' && !validActiveKcal(entry.reportedActiveKcal)) return 'Indique les kcal actives de la séance, entre 0 et 10 000.';
  if (entry.deviceName !== undefined && (typeof entry.deviceName !== 'string' || entry.deviceName.length > 60)) return 'Vérifie le nom de la montre.';
  if (entry.weightKg !== undefined && (!Number.isFinite(entry.weightKg) || entry.weightKg < 35 || entry.weightKg > 300)) return 'Indique un poids entre 35 et 300 kg pour estimer cette séance.';
  if (entry.includedInSteps !== undefined && typeof entry.includedInSteps !== 'boolean') return 'Vérifie si cette séance est déjà incluse dans les pas.';
  if (entry.weightAssumed !== undefined && typeof entry.weightAssumed !== 'boolean') return 'Vérifie le poids utilisé pour cette séance.';
  if (entry.includeInGoal !== undefined && typeof entry.includeInGoal !== 'boolean') return 'Vérifie la prise en compte de cette séance.';
  if (!Number.isFinite(entry.minutes) || entry.minutes < 1 || entry.minutes > 600) return 'Indique une durée entre 1 et 600 minutes.';
  const others = journal.sessions.filter(s => s.day === entry.day && s.id !== entry.id).reduce((n, s) => n + s.minutes, 0);
  if (others + entry.minutes > 1440) return 'Le total ne peut pas dépasser la durée d’une journée.';
  return null;
}
export function saveSession(journal: ActivityJournal, entry: ActivitySession): ActivityJournal {
  const issue = activityIssue(entry, journal); if (issue) throw new Error(issue);
  return { ...journal, sessions: [entry, ...journal.sessions.filter(s => s.id !== entry.id)] };
}
export function setDaySteps(journal: ActivityJournal, day: string, steps: number, details?: StepDetails): ActivityJournal {
  if (!validDay(day) || day > dayKey(new Date()) || !Number.isInteger(steps) || steps < 0 || steps > 100000) throw new Error('Indique un total valide, entre 0 et 100 000 pas, pour cette journée.');
  if (details && (!Number.isInteger(details.baselineSteps) || details.baselineSteps < 0 || details.baselineSteps > 100000 || (details.weightKg !== undefined && (!Number.isFinite(details.weightKg) || details.weightKg < 35 || details.weightKg > 300)))) throw new Error('Vérifie le poids et les pas habituels.');
  return { ...journal, stepsByDay: { ...journal.stepsByDay, [day]: steps }, ...(details ? { stepDetailsByDay: { ...journal.stepDetailsByDay, [day]: details } } : {}) };
}
export function validActiveKcal(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10000;
}
export function reportedDayIssue(report: ReportedDayEnergy): string | null {
  if (!report || !validActiveKcal(report.activeKcal)) return 'Indique un total de calories actives entre 0 et 10 000 kcal.';
  if (!validActiveKcal(report.baselineActiveKcal)) return 'Vérifie les kcal habituelles déjà comprises dans la base.';
  if (typeof report.deviceName !== 'string' || report.deviceName.length > 60) return 'Indique le nom de ta montre (60 caractères maximum).';
  return null;
}
export function setDayEnergy(journal: ActivityJournal, day: string, report: ReportedDayEnergy | null): ActivityJournal {
  if (!validDay(day) || day > dayKey(new Date())) throw new Error('Choisis une journée passée ou aujourd’hui.');
  if (report) { const issue = reportedDayIssue(report); if (issue) throw new Error(issue); }
  const next = { ...journal.reportedEnergyByDay };
  if (report === null) delete next[day];
  else next[day] = { ...report, deviceName: report.deviceName.trim() || 'Ma montre' };
  return { ...journal, reportedEnergyByDay: next };
}
export function activitySummary(journal: ActivityJournal, day: string) {
  const sessions = journal.sessions.filter(s => s.day === day);
  return { steps: journal.stepsByDay[day] ?? null, minutes: sessions.reduce((n, s) => n + s.minutes, 0), sessions };
}
export function readActivity(raw: unknown): ActivityJournal {
  if (!raw || typeof raw !== 'object') return { sessions: [], stepsByDay: {} };
  const v = raw as Partial<ActivityJournal>;
  let result: ActivityJournal = { sessions: [], stepsByDay: {} };
  for (const s of Array.isArray(v.sessions) ? v.sessions : []) {
    try { if (s && typeof s.id === 'string') result = saveSession(result, { ...s, note: typeof s.note === 'string' ? s.note.slice(0, 100) : '' }); } catch { /* Ignore invalid saved entries. */ }
  }
  for (const [day, value] of Object.entries(v.stepsByDay ?? {})) { try { result = setDaySteps(result, day, value);
    const details = v.stepDetailsByDay?.[day];
    if (details) { try { result = setDaySteps(result, day, value, details); } catch { /* Preserve the count even if metadata is damaged. */ } } } catch { /* Invalid old values do not become activity. */ } }
  for (const [day, report] of Object.entries(v.reportedEnergyByDay ?? {})) { try { result = setDayEnergy(result, day, report); } catch { /* Ignore invalid reports without losing steps or sessions. */ } }
  return result;
}

export const ACTIVITY_IDEAS = [
  { title: 'Une marche à ton rythme', kind: 'walk' as const, minutes: 15, description: '15 min dehors ou en intérieur, à une allure qui te permet de parler. Tu peux commencer par 5 min.', steps: ['Pars doucement quelques minutes.', 'Garde une allure confortable.', 'Termine tranquillement.'] },
  { title: 'Un circuit fractionné doux', kind: 'interval' as const, minutes: 15, description: 'Une alternance de mouvements et de pauses, sans saut et sans effort maximal.', steps: ['3 min : marche sur place et mobilisation douce des épaules.', '8 min : alterne 30 s de mouvement et 30 s de pause, 8 fois. Choisis marche sur place ou pas de côté.', '4 min : marche lente et respiration tranquille. Allonge les pauses si besoin.'] },
  { title: 'Une pause mobilité', kind: 'mobility' as const, minutes: 5, description: 'Après un moment assis, change de position et mobilise-toi sans forcer.', steps: ['1 min : se lever et marcher doucement.', '3 min : petits mouvements confortables des épaules, bras et chevilles.', '1 min : marcher ou respirer tranquillement.'] },
];
