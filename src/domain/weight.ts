import { WeightEntry } from '../types';
import { dayDistance, dayKey, isValidDay } from './date';

export const MIN_WEIGHT = 35;
export const MAX_WEIGHT = 300;

export function weightIssue(day: string, kg: number, today = dayKey(new Date())): string | null {
  if (!isValidDay(day)) return 'Choisis une journée valide.';
  if (dayDistance(day, today) > 0) return 'Une pesée ne peut pas être enregistrée pour une journée à venir.';
  if (!Number.isFinite(kg) || kg < MIN_WEIGHT || kg > MAX_WEIGHT) return `Indique un poids entre ${MIN_WEIGHT} et ${MAX_WEIGHT} kg.`;
  return null;
}

/** Une seule pesée par jour : la nouvelle remplace la précédente. */
export function saveWeight(log: WeightEntry[], entry: WeightEntry, today = dayKey(new Date())): WeightEntry[] {
  const issue = weightIssue(entry.day, entry.kg, today);
  if (issue) throw new Error(issue);
  const kg = Math.round(entry.kg * 10) / 10;
  return [...log.filter(item => item.day !== entry.day), { day: entry.day, kg }]
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-400);
}

export function removeWeight(log: WeightEntry[], day: string): WeightEntry[] {
  return log.filter(item => item.day !== day);
}

export function readWeightLog(raw: unknown): WeightEntry[] {
  if (!Array.isArray(raw)) return [];
  let log: WeightEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const { day, kg } = item as Partial<WeightEntry>;
    // Une pesée passée reste valide même si l'horloge a avancé depuis.
    try { log = saveWeight(log, { day: day as string, kg: kg as number }, '9999-12-31'); } catch { /* Une entrée abîmée ne fait pas perdre les autres. */ }
  }
  return log;
}

/**
 * Moyenne mobile sur `window` jours. C'est elle qu'il faut lire, pas les points :
 * une pesée isolée varie surtout avec l'eau, le sel et le transit.
 */
export function movingAverage(log: WeightEntry[], window = 7): WeightEntry[] {
  return log.map((entry, index) => {
    const from = log.filter(item => {
      const distance = dayDistance(entry.day, item.day);
      return distance >= 0 && distance < window;
    });
    const source = from.length ? from : [log[index]];
    return { day: entry.day, kg: Math.round((source.reduce((sum, item) => sum + item.kg, 0) / source.length) * 100) / 100 };
  });
}

export type WeightTrend = {
  kgPerWeek: number;
  days: number;
  first: WeightEntry;
  last: WeightEntry;
  /** Faux tant qu'il n'y a pas assez de pesées étalées pour lire quoi que ce soit. */
  readable: boolean;
};

/**
 * Pente par moindres carrés sur les `days` derniers jours, convertie en kg par
 * semaine. Ce n'est pas une prévision : c'est la description de ce qui a été
 * pesé, et elle bouge encore beaucoup en dessous de trois semaines.
 */
export function weightTrend(log: WeightEntry[], days = 28, today = dayKey(new Date())): WeightTrend | null {
  const recent = log.filter(entry => {
    const distance = dayDistance(entry.day, today);
    return distance <= 0 && distance > -days;
  });
  if (recent.length < 2) return null;
  const base = recent[0].day;
  const points = recent.map(entry => ({ x: dayDistance(entry.day, base), y: entry.kg }));
  const span = points[points.length - 1].x - points[0].x;
  if (span <= 0) return null;
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const variance = points.reduce((sum, p) => sum + (p.x - meanX) ** 2, 0);
  if (variance === 0) return null;
  const slope = points.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0) / variance;
  return {
    kgPerWeek: Math.round(slope * 7 * 100) / 100,
    days: span + 1,
    first: recent[0],
    last: recent[recent.length - 1],
    readable: recent.length >= 4 && span >= 13,
  };
}

/** Phrase de lecture du graphique, volontairement descriptive et sans verdict. */
export function trendSentence(trend: WeightTrend | null): string {
  if (!trend) return 'Deux pesées à quelques jours d’intervalle suffisent pour commencer une courbe.';
  if (!trend.readable) return `Sur ${trend.days} jours, la courbe se construit encore. Deux ou trois semaines de pesées régulières la rendent lisible.`;
  const amount = Math.abs(trend.kgPerWeek).toFixed(2).replace('.', ',');
  if (Math.abs(trend.kgPerWeek) < 0.1) return `Sur ${trend.days} jours, ta moyenne est stable. Les écarts d’un matin à l’autre viennent surtout de l’eau et du transit.`;
  const direction = trend.kgPerWeek < 0 ? 'baisse' : 'hausse';
  return `Sur ${trend.days} jours, ta moyenne est en ${direction} d’environ ${amount} kg par semaine. C’est une description de tes pesées, pas une prévision.`;
}
