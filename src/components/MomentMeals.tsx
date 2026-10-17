import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { groupMacros, mealSummary, MomentGroup } from '../domain/meals';
import { colors, fonts, MAX_FONT_SCALE, radii, typeScale } from '../theme';
import { Meal, MealMoment } from '../types';
import { AppIcon } from './AppIcon';
import { toneFor } from './MealCard';
import { MotionPressable } from './Motion';

type Props = {
  groups: MomentGroup[];
  total: number;
  /** Le moment mis en avant : celui de l'heure, s'il est encore vide. */
  suggested?: MealMoment | null;
  onAddFor: (moment: MealMoment) => void;
  onEdit: (meal: Meal) => void;
};

/**
 * V4.0 — « Tes repas », rangés par moment de la journée.
 *
 * Remplace « Dans ton assiette » (V3.5), qui listait les trois derniers repas.
 * Chaque moment a sa ligne et son bouton +, qui ouvre l'ajout déjà réglé sur
 * ce moment : on n'a plus à le choisir dans une rangée de puces. Une ligne vide
 * dit simplement « Pas encore noté », sans reproche.
 *
 * Un repas noté se modifie d'un appui sur sa ligne, comme avant.
 */
export function MomentMeals({ groups, total, suggested, onAddFor, onEdit }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title} accessibilityRole="header">Tes repas</Text>
        <Text maxFontSizeMultiplier={1.3} style={styles.total}>{total.toLocaleString('fr-FR')} kcal</Text>
      </View>
      <View style={styles.card}>
        {groups.map((group, index) => {
          const tone = toneFor(group.moment);
          const highlighted = suggested === group.moment && group.meals.length === 0;
          const last = index === groups.length - 1;
          return (
            <View key={group.moment} style={[styles.group, !last && styles.divider]}>
              <View style={styles.row}>
                <View style={[styles.tile, { backgroundColor: tone.pale }]}>
                  <MomentIcon moment={group.moment} color={tone.ink} />
                </View>
                {group.meals.length === 1 ? (
                  <MotionPressable
                    onPress={() => onEdit(group.meals[0])}
                    accessibilityRole="button"
                    accessibilityLabel={`Modifier ${group.moment} : ${mealSummary(group.meals[0])}, ${group.kcal} kilocalories`}
                    containerStyle={styles.textOuter}
                    style={styles.text}
                  >
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.moment}>{group.moment}</Text>
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.summary} numberOfLines={1}>{mealSummary(group.meals[0])}</Text>
                    <MacroDots meals={group.meals} />
                  </MotionPressable>
                ) : (
                  <View style={[styles.textOuter, styles.text]}>
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.moment}>{group.moment}</Text>
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.summary} numberOfLines={1}>
                      {group.meals.length === 0 ? 'Pas encore noté' : `${group.meals.length} repas notés`}
                    </Text>
                    <MacroDots meals={group.meals} />
                  </View>
                )}
                {group.kcal > 0 && (
                  <Text maxFontSizeMultiplier={1.3} style={[styles.kcal, { color: tone.ink }]}>{group.kcal.toLocaleString('fr-FR')}</Text>
                )}
                <MotionPressable
                  onPress={() => onAddFor(group.moment)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ajouter au ${group.moment.toLocaleLowerCase('fr-FR')}`}
                  style={[styles.add, highlighted && styles.addHighlighted]}
                >
                  <AppIcon name="plus" size={20} color={highlighted ? colors.white : colors.navy} strokeWidth={2.4} />
                </MotionPressable>
              </View>

              {/* Plusieurs repas au même moment : chacun garde sa ligne, modifiable. */}
              {group.meals.length > 1 && group.meals.map(meal => (
                <MotionPressable
                  key={meal.id}
                  onPress={() => onEdit(meal)}
                  accessibilityRole="button"
                  accessibilityLabel={`Modifier ${mealSummary(meal)}, ${meal.calories.estimated} kilocalories`}
                  style={styles.sub}
                >
                  <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.subText} numberOfLines={1}>{mealSummary(meal)}</Text>
                  <Text maxFontSizeMultiplier={1.3} style={styles.subKcal}>{meal.calories.estimated.toLocaleString('fr-FR')}</Text>
                </MotionPressable>
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** V4.3 — trois pastilles : protéines, glucides, lipides, en grammes. */
function MacroDots({ meals }: { meals: Meal[] }) {
  const macros = groupMacros(meals);
  if (!macros) return null;
  const items = [
    { key: 'P', label: 'protéines', value: macros.protein, color: colors.protein },
    { key: 'G', label: 'glucides', value: macros.carbs, color: colors.carbs },
    { key: 'L', label: 'lipides', value: macros.fat, color: colors.fat },
  ];
  return (
    <View style={styles.macros} accessible accessibilityLabel={items.map(item => `${item.value} grammes de ${item.label}`).join(', ')}>
      {items.map(item => (
        <View key={item.key} style={styles.macro}>
          <View style={[styles.macroDot, { backgroundColor: item.color }]} />
          <Text maxFontSizeMultiplier={1.3} style={styles.macroText}>{item.key} {item.value} g</Text>
        </View>
      ))}
    </View>
  );
}

/** Une icône par moment : le soleil, l'assiette, la tasse, la lune. */
function MomentIcon({ moment, color }: { moment: MealMoment; color: string }) {
  const common = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityElementsHidden>
      {moment === 'Petit-déjeuner' && <>
        <Circle cx="12" cy="12" r="4" {...common} />
        <Path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" {...common} />
      </>}
      {moment === 'Déjeuner' && <><Circle cx="12" cy="12" r="8" {...common} /><Circle cx="12" cy="12" r="4.5" {...common} /></>}
      {(moment === 'Goûter' || moment === 'Snack') && <>
        <Path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9Z" {...common} />
        <Path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" {...common} />
        <Line x1="9" y1="3" x2="9" y2="6" {...common} /><Line x1="12.5" y1="3" x2="12.5" y2="6" {...common} />
      </>}
      {moment === 'Dîner' && <Path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" {...common} />}
    </Svg>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 4 },
  title: { color: colors.ink, ...typeScale.section },
  total: { color: colors.muted, fontSize: 14, lineHeight: 20, fontFamily: fonts.semibold },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, paddingHorizontal: 14, paddingVertical: 4 },
  group: { paddingVertical: 10, gap: 4 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.background },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  tile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  textOuter: { flex: 1, minWidth: 0 },
  text: { minHeight: 44, justifyContent: 'center' },
  moment: { color: colors.ink, fontSize: 16, lineHeight: 21, fontFamily: fonts.semibold },
  summary: { color: colors.muted, fontSize: 14, lineHeight: 19, fontFamily: fonts.regular },
  kcal: { fontSize: 15, lineHeight: 20, fontFamily: fonts.bold },
  add: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  addHighlighted: { backgroundColor: colors.violet },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, marginLeft: 56, paddingRight: 56 },
  subText: { flex: 1, color: colors.inkSoft, fontSize: 14, lineHeight: 19, fontFamily: fonts.medium },
  subKcal: { color: colors.ink, fontSize: 14, lineHeight: 19, fontFamily: fonts.bold },
  macros: { flexDirection: 'row', gap: 10, marginTop: 3 },
  macro: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  macroDot: { width: 7, height: 7, borderRadius: 4 },
  macroText: { color: colors.muted, fontSize: 12, lineHeight: 16, fontFamily: fonts.semibold },
});
