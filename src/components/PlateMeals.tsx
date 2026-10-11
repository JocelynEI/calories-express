import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { shortTime } from '../domain/date';
import { colors, fonts, MAX_FONT_SCALE, radii, typeScale } from '../theme';
import { Meal } from '../types';
import { toneFor } from './MealCard';
import { MotionPressable } from './Motion';

/** L'accueil montre les trois derniers repas ; le reste vit dans le Journal. */
export const PLATE_MEALS_SHOWN = 3;

type Props = {
  meals: Meal[];
  total: number;
  onEdit: (meal: Meal) => void;
};

/**
 * V3.5 — « Dans ton assiette ».
 *
 * La liste des repas de l'accueil, resserrée en lignes. Le total mangé passe
 * en tête de la carte : c'est ici qu'on le cherche, à côté de ce qui le
 * compose, et il n'est plus répété dans la jauge.
 *
 * Chaque ligne garde la teinte de son moment de la journée, la même que dans
 * le Journal, et s'ouvre d'un appui pour être modifiée.
 */
export function PlateMeals({ meals, total, onEdit }: Props) {
  const shown = meals.slice(0, PLATE_MEALS_SHOWN);
  const hidden = meals.length - shown.length;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>Dans ton assiette</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.count}>
            {meals.length} repas noté{meals.length > 1 ? 's' : ''}
          </Text>
        </View>
        <Text maxFontSizeMultiplier={1.3} style={styles.total}>
          {total.toLocaleString('fr-FR')} <Text style={styles.totalUnit}>kcal</Text>
        </Text>
      </View>

      {shown.map(meal => {
        const tone = toneFor(meal.moment);
        return (
          <MotionPressable
            key={meal.id}
            onPress={() => onEdit(meal)}
            accessibilityRole="button"
            accessibilityLabel={`Modifier ${meal.description}, ${meal.calories.estimated} kilocalories`}
            style={styles.row}
          >
            <View style={[styles.moment, { backgroundColor: tone.pale }]}>
              <Text maxFontSizeMultiplier={1.2} style={[styles.momentText, { color: tone.ink }]} numberOfLines={1}>{meal.moment}</Text>
            </View>
            <View style={styles.rowText}>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.description} numberOfLines={2}>{meal.description}</Text>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.time}>{shortTime(meal.createdAt)}</Text>
            </View>
            <Text maxFontSizeMultiplier={1.3} style={styles.kcal}>{meal.calories.estimated.toLocaleString('fr-FR')}</Text>
          </MotionPressable>
        );
      })}

      {hidden > 0 && (
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.more}>
          {hidden === 1 ? 'Un autre repas est dans le Journal.' : `${hidden} autres repas sont dans le Journal.`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.xl, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingBottom: 8 },
  headerText: { flexShrink: 1, minWidth: 0 },
  title: { color: colors.ink, ...typeScale.section, fontSize: 19, lineHeight: 24 },
  count: { color: colors.muted, ...typeScale.caption, marginTop: 2 },
  total: { color: colors.ink, fontSize: 18, lineHeight: 24, fontFamily: fonts.extrabold },
  totalUnit: { color: colors.muted, fontSize: 13, fontFamily: fonts.semibold },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
  moment: { flexShrink: 0, maxWidth: 112, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  momentText: { fontSize: 12, lineHeight: 16, fontFamily: fonts.bold },
  rowText: { flex: 1, minWidth: 0 },
  description: { color: colors.ink, fontSize: 15, lineHeight: 20, fontFamily: fonts.semibold },
  time: { color: colors.muted, ...typeScale.caption, marginTop: 1 },
  kcal: { color: colors.ink, fontSize: 15, lineHeight: 20, fontFamily: fonts.extrabold, minWidth: 36, textAlign: 'right' },

  more: { color: colors.muted, ...typeScale.caption, textAlign: 'center', paddingTop: 10, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.line },
});
