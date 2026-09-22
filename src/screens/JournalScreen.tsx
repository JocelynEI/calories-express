import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../components/AppIcon';
import { MealCard } from '../components/MealCard';
import { FoodMotion } from '../components/FoodMotion';
import { SectionHeader } from '../components/SectionHeader';
import { DayNavigator } from '../components/DayNavigator';
import { MotionPressable } from '../components/Motion';
import { dailyEnergyPlan } from '../domain/activity-energy';
import { dayLabel, shiftDay } from '../domain/date';
import { mealDay, mealsForDay, totalCalories } from '../domain/meals';
import { useApp } from '../state/AppContext';
import { colors, fonts, MAX_FONT_SCALE, radii, shadows, typeScale } from '../theme';
import { Meal } from '../types';

/**
 * V1.8 — le journal n'est plus limité à aujourd'hui.
 *
 * Toutes les journées sont consultables, et une entrée peut enfin être
 * modifiée au lieu d'être supprimée puis ressaisie. La suppression demande
 * toujours une confirmation, affichée dans la carte plutôt que dans une alerte
 * système, pour rester lisible avec un grand texte.
 */
export function JournalScreen({ onEditMeal, onAdd }: { onEditMeal: (meal: Meal) => void; onAdd: () => void }) {
  const { meals, profile, activity, today, selectedDay, setSelectedDay, profileCompleted, removeMeal } = useApp();
  const [confirming, setConfirming] = useState<string | null>(null);

  const dayMeals = useMemo(() => mealsForDay(meals, selectedDay), [meals, selectedDay]);
  const consumed = totalCalories(dayMeals);
  const { target, issue } = dailyEnergyPlan(profile, activity, selectedDay, profileCompleted);

  // Les journées récentes qui contiennent quelque chose, pour sauter
  // directement à la dernière saisie plutôt que de reculer jour par jour.
  const recentDays = useMemo(() => {
    const days = new Set(meals.map(mealDay));
    return Array.from({ length: 14 }, (_, index) => shiftDay(today, -index))
      .filter(day => days.has(day) || day === today)
      .slice(0, 7);
  }, [meals, today]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.eyebrow}>TON HISTORIQUE</Text>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>Journal</Text>

      <View style={styles.navCard}>
        <DayNavigator />
      </View>

      {recentDays.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {recentDays.map(day => (
            <MotionPressable
              key={day}
              onPress={() => setSelectedDay(day)}
              accessibilityRole="button"
              accessibilityState={{ selected: day === selectedDay }}
              style={[styles.chip, day === selectedDay && styles.chipActive]}
            >
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.chipText, day === selectedDay && styles.chipTextActive]}>
                {dayLabel(day, today)}
              </Text>
            </MotionPressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.summary}>
        <View style={{ flex: 1 }}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.summaryLabel}>{dayLabel(selectedDay, today)}</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.summaryValue}>
            {consumed.toLocaleString('fr-FR')} <Text style={styles.summaryUnit}>kcal saisies</Text>
          </Text>
        </View>
        <View style={styles.summaryRight}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.summaryLabel}>Repère</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.targetValue}>{issue ? 'À vérifier' : `${target.toLocaleString('fr-FR')} kcal`}</Text>
        </View>
      </View>

      <SectionHeader
        icon="journal"
        tone={colors.aqua}
        pale={colors.aquaPale}
        art="salade"
        title="Repas et collations"
        meta={`${dayMeals.length} ${dayMeals.length > 1 ? 'entrées' : 'entrée'}`}
      />
      <MotionPressable onPress={onAdd} accessibilityRole="button" accessibilityLabel="Ajouter un repas à cette journée" style={styles.addSmall}>
        <AppIcon name="plus" size={16} color={colors.violet} strokeWidth={2.4} />
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.addSmallText}>Ajouter un repas</Text>
      </MotionPressable>

      <View style={styles.list}>
        {dayMeals.map(meal => (
          <View key={meal.id} style={styles.entry}>
            <MealCard meal={meal} onEdit={() => onEditMeal(meal)} onRemove={() => setConfirming(meal.id)} />
            {confirming === meal.id && (
              <View style={styles.confirm}>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.confirmText}>
                  Supprimer cette entrée ? Le baromètre de cette journée sera recalculé.
                </Text>
                <View style={styles.confirmRow}>
                  <MotionPressable onPress={() => setConfirming(null)} accessibilityRole="button" style={[styles.confirmButton, styles.keep]}>
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.keepText}>Garder</Text>
                  </MotionPressable>
                  <MotionPressable
                    onPress={() => { removeMeal(meal.id); setConfirming(null); }}
                    accessibilityRole="button"
                    style={[styles.confirmButton, styles.destroy]}
                  >
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.destroyText}>Supprimer</Text>
                  </MotionPressable>
                </View>
              </View>
            )}
          </View>
        ))}

        {dayMeals.length === 0 && (
          <View style={styles.empty}>
            {/* V2.4 — la frise d'aliments a quitté l'accueil pour venir ici :
                le Journal est l'écran qui parle de nourriture, c'est sa place. */}
            <View style={styles.emptyArt}><FoodMotion kind="orbit" size={30} height={100} width={160} /></View>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.emptyTitle}>
              {selectedDay === today ? 'Ton journal du jour est vide' : 'Rien n’a été saisi ce jour-là'}
            </Text>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.emptyCopy}>
              Une case vide ne veut pas dire zéro calorie mangée : elle veut dire qu’aucun repas n’a été noté.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.parade}>
        <FoodMotion kind="parade" size={28} height={50} width={320} foods={['pomme', 'poisson', 'riz', 'avocat', 'pain', 'carotte', 'brocoli', 'oeuf']} />
      </View>

      <View style={styles.method}>
        <AppIcon name="info" size={18} color={colors.goldText} strokeWidth={2} />
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.methodText}>
          Les calories dépendent des valeurs et des quantités saisies. Ciqual donne une composition moyenne ; une recette
          ou une marque peuvent en différer. Une entrée se corrige directement, sans la supprimer.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  emptyArt: { height: 100, justifyContent: 'center' },
  parade: { alignItems: 'center', opacity: 0.9 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 38, gap: 14 },
  eyebrow: { color: colors.violet, fontSize: 12, lineHeight: 16, fontFamily: fonts.bold, letterSpacing: 1.5 },
  title: { color: colors.ink, ...typeScale.display, marginTop: 2 },

  navCard: { backgroundColor: colors.card, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 6, paddingVertical: 6, alignSelf: 'flex-start' },

  chips: { gap: 8, paddingRight: 20 },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.violet, borderColor: colors.violet },
  chipText: { color: colors.inkSoft, fontSize: 13, fontFamily: fonts.bold },
  chipTextActive: { color: colors.white },

  summary: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, backgroundColor: colors.card, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, padding: 16, ...shadows.card },
  summaryLabel: { color: colors.muted, ...typeScale.caption },
  summaryValue: { color: colors.ink, ...typeScale.numeric, marginTop: 2 },
  summaryUnit: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium, letterSpacing: 0 },
  summaryRight: { alignItems: 'flex-end' },
  targetValue: { color: colors.violet, fontSize: 16, lineHeight: 22, fontFamily: fonts.bold, marginTop: 4 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontFamily: fonts.extrabold, letterSpacing: -0.3 },
  addSmall: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 48, paddingHorizontal: 14, borderRadius: radii.pill, backgroundColor: colors.violetPale },
  addSmallText: { color: colors.violet, fontSize: 13, fontFamily: fonts.extrabold },

  list: { gap: 10 },
  entry: { gap: 8 },
  confirm: { backgroundColor: colors.coralPale, borderRadius: radii.medium, padding: 12, gap: 10 },
  confirmText: { color: '#8E241D', fontSize: 13, lineHeight: 19, fontFamily: fonts.semibold },
  confirmRow: { flexDirection: 'row', gap: 8 },
  confirmButton: { flex: 1, minHeight: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  keep: { backgroundColor: colors.white },
  keepText: { color: colors.inkSoft, fontSize: 14, fontFamily: fonts.extrabold },
  destroy: { backgroundColor: colors.coral },
  destroyText: { color: colors.white, fontSize: 14, fontFamily: fonts.extrabold },

  empty: { backgroundColor: colors.card, borderRadius: radii.large, alignItems: 'center', padding: 28, borderWidth: 1, borderColor: colors.line, gap: 8 },
  emptyIcon: { width: 56, height: 56, borderRadius: 19, backgroundColor: colors.violetPale, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.ink, fontSize: 17, fontFamily: fonts.extrabold, marginTop: 6, textAlign: 'center' },
  emptyCopy: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium, lineHeight: 19, textAlign: 'center', maxWidth: 280 },

  method: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.goldPale, borderRadius: radii.medium, padding: 14, marginTop: 8 },
  methodText: { flex: 1, color: '#6F4E07', fontSize: 13, lineHeight: 19, fontFamily: fonts.medium },
});
