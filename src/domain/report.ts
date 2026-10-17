import { ActivityJournal, Meal, Profile } from '../types';
import { dailyEnergyPlan } from './activity-energy';
import { shiftDay } from './date';
import { mealsForDay, totalCalories, totalMacros } from './meals';

/**
 * V5.0 — le bilan d'une période (7 ou 30 jours), pour le premium.
 *
 * Il ne fait que relire ce qui est déjà saisi : aucune valeur n'est inventée.
 * Une journée sans repas n'est pas une journée à zéro calorie, elle est
 * simplement absente des moyennes. Les macros ne comptent que les journées
 * dont tous les aliments ont leurs valeurs.
 */

export type ReportPeriod = 7 | 30;

export type ReportDay = {
  day: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Repère du jour ; 0 quand le profil est à vérifier. */
  target: number;
  activeKcal: number;
  minutes: number;
  hasMeals: boolean;
  macrosComplete: boolean;
};

export type PeriodReport = {
  period: ReportPeriod;
  days: ReportDay[];
  recordedDays: number;
  avgKcal: number | null;
  avgTarget: number | null;
  /** Moyenne saisie moins repère moyen ; positif : au-dessus. */
  gapKcal: number | null;
  daysAbove: number;
  macros: { protein: number; carbs: number; fat: number; days: number } | null;
  macrosPartialDays: number;
  activity: { minutes: number; activeKcal: number; activeDays: number };
  /** Moyenne de la période d'avant, seulement si les deux périodes ont au moins 3 jours renseignés. */
  previous: { avgKcal: number; deltaKcal: number } | null;
};

const MIN_DAYS_TO_COMPARE = 3;
const average = (values: number[]) => values.reduce((sum, n) => sum + n, 0) / values.length;

function buildDays(
  meals: Meal[], profile: Profile, activity: ActivityJournal, profileCompleted: boolean, lastDay: string, length: number,
): ReportDay[] {
  return Array.from({ length }, (_, index) => {
    const day = shiftDay(lastDay, -(length - 1 - index));
    const entries = mealsForDay(meals, day);
    const plan = dailyEnergyPlan(profile, activity, day, profileCompleted);
    const macros = totalMacros(entries);
    return {
      day,
      kcal: totalCalories(entries),
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      target: plan.issue ? 0 : plan.target,
      activeKcal: plan.activity.hasEnergy ? plan.activity.activeKcal : 0,
      minutes: plan.activity.minutes,
      hasMeals: entries.length > 0,
      macrosComplete: !entries.some(meal => meal.items.some(item => item.macrosComplete === false)),
    };
  });
}

function averageKcal(days: ReportDay[]): number | null {
  const recorded = days.filter(day => day.hasMeals);
  return recorded.length ? Math.round(average(recorded.map(day => day.kcal))) : null;
}

export function periodReport(
  allMeals: Meal[], profile: Profile, activity: ActivityJournal, profileCompleted: boolean, today: string, period: ReportPeriod,
): PeriodReport {
  // Les journées d'exemple ne sont pas les tiennes : elles ne font jamais un bilan.
  const meals = allMeals.filter(meal => !meal.id.startsWith('demo-'));
  const days = buildDays(meals, profile, activity, profileCompleted, today, period);
  const recorded = days.filter(day => day.hasMeals);
  const avgKcal = averageKcal(days);

  const withTarget = recorded.filter(day => day.target > 0);
  const avgTarget = withTarget.length ? Math.round(average(withTarget.map(day => day.target))) : null;
  const gapKcal = avgKcal !== null && avgTarget !== null ? Math.round(average(withTarget.map(day => day.kcal)) - avgTarget) : null;

  const complete = recorded.filter(day => day.macrosComplete);
  const macros = complete.length
    ? {
      protein: Math.round(average(complete.map(day => day.protein))),
      carbs: Math.round(average(complete.map(day => day.carbs))),
      fat: Math.round(average(complete.map(day => day.fat))),
      days: complete.length,
    }
    : null;

  let previous: PeriodReport['previous'] = null;
  if (avgKcal !== null && recorded.length >= MIN_DAYS_TO_COMPARE) {
    const before = buildDays(meals, profile, activity, profileCompleted, shiftDay(today, -period), period);
    const beforeAvg = averageKcal(before);
    if (beforeAvg !== null && before.filter(day => day.hasMeals).length >= MIN_DAYS_TO_COMPARE) {
      previous = { avgKcal: beforeAvg, deltaKcal: avgKcal - beforeAvg };
    }
  }

  return {
    period,
    days,
    recordedDays: recorded.length,
    avgKcal,
    avgTarget,
    gapKcal,
    daysAbove: withTarget.filter(day => day.kcal > day.target).length,
    macros,
    macrosPartialDays: recorded.length - complete.length,
    activity: {
      minutes: days.reduce((sum, day) => sum + day.minutes, 0),
      activeKcal: days.reduce((sum, day) => sum + day.activeKcal, 0),
      activeDays: days.filter(day => day.minutes > 0 || day.activeKcal > 0).length,
    },
    previous,
  };
}

/** « 3 h 20 » ou « 45 min », pour la ligne d'activité. */
export function durationLabel(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60), rest = total % 60;
  return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`;
}

/** « +70 », « −70 » (vrai signe moins), « 0 ». */
export function signedKcal(value: number): string {
  const rounded = Math.round(value);
  if (rounded === 0) return '0';
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toLocaleString('fr-FR')}`;
}
