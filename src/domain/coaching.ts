import { ActivityJournal, MealMoment } from '../types';
import { activitySummary } from './activity';
import { dayKey } from './date';

export type CoachHistory = { day: string; count: number; lastAt: number; snoozedDay: string };
export const EMPTY_COACH_HISTORY: CoachHistory = { day: '', count: 0, lastAt: 0, snoozedDay: '' };
export function readCoachHistory(raw: unknown): CoachHistory {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_COACH_HISTORY };
  const value = raw as Partial<CoachHistory>;
  return { day: typeof value.day === 'string' ? value.day : '', count: Number.isInteger(value.count) && value.count! >= 0 ? Math.min(2, value.count!) : 0, lastAt: typeof value.lastAt === 'number' && Number.isFinite(value.lastAt) && value.lastAt >= 0 ? value.lastAt : 0, snoozedDay: typeof value.snoozedDay === 'string' ? value.snoozedDay : '' };
}
export function canShowMealPrompt(history: CoachHistory, enabled: boolean, now = new Date()) {
  const day = dayKey(now);
  return enabled && history.snoozedDay !== day && (history.day !== day || history.count < 2) && (history.lastAt === 0 || now.getTime() - history.lastAt >= 3 * 60 * 60 * 1000);
}
export function markMealPrompt(history: CoachHistory, now = new Date()): CoachHistory {
  const day = dayKey(now); return { ...history, day, count: history.day === day ? Math.min(2, history.count + 1) : 1, lastAt: now.getTime() };
}
export type MealEncouragement = { title: string; message: string; idea: 'walk' | 'mobility' | null; action: string | null };
export function mealEncouragement(journal: ActivityJournal, moment: MealMoment, now = new Date()): MealEncouragement {
  const summary = activitySummary(journal, dayKey(now));
  if (now.getHours() >= 21 || now.getHours() < 6) return { title: 'Repas enregistré', message: 'Ta journée peut se terminer tranquillement. Prends aussi le temps de récupérer.', idea: null, action: null };
  if (summary.minutes >= 15 || (summary.steps ?? 0) >= 5000) return { title: 'Tu as pris du temps pour bouger', message: 'Ton repas est noté et ton activité aussi. Tu peux maintenant écouter ton énergie et prendre une pause si tu en as envie.', idea: null, action: null };
  if (moment === 'Petit-déjeuner' || moment === 'Snack') return { title: 'Une petite pause dans ta journée ?', message: 'Ton repas est enregistré. Si tu en as envie, 5 minutes de mobilité douce peuvent ponctuer ta journée.', idea: 'mobility', action: 'Voir la pause mobilité' };
  return { title: 'Une petite marche quand tu veux ?', message: 'Ton repas est enregistré. Si tu te sens disponible, une marche tranquille de 5 à 15 minutes est une idée pour bouger à ton rythme.', idea: 'walk', action: 'Voir l’idée de marche' };
}
