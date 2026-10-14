import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { dayDate, dayDistance, dayLabel, shiftDay, weekdayInitials, weekOf } from '../domain/date';
import { mealDay } from '../domain/meals';
import { useApp } from '../state/AppContext';
import { colors, fonts, MAX_FONT_SCALE, radii } from '../theme';
import { AppIcon } from './AppIcon';
import { MotionPressable } from './Motion';

/**
 * V4.0 — la semaine en une bande, à la place des flèches « ‹ Aujourd'hui › ».
 *
 * Les sept jours sont visibles d'un coup : un point sous un jour dit qu'un repas
 * y est noté, et un appui l'ouvre. Les flèches des bords passent d'une semaine
 * à l'autre. Le futur reste fermé, comme avant.
 */
export function WeekStrip() {
  const { selectedDay, setSelectedDay, today, meals } = useApp();
  const days = useMemo(() => weekOf(selectedDay), [selectedDay]);
  const logged = useMemo(() => new Set(meals.map(mealDay)), [meals]);
  const nextWeek = shiftDay(days[6], 1);
  const canGoForward = dayDistance(nextWeek, today) <= 0;

  return (
    <View style={styles.row}>
      <MotionPressable
        onPress={() => setSelectedDay(shiftDay(selectedDay, -7))}
        accessibilityRole="button"
        accessibilityLabel="Semaine précédente"
        style={styles.arrow}
      >
        <AppIcon name="chevronLeft" size={18} color={colors.inkSoft} strokeWidth={2.4} />
      </MotionPressable>

      {days.map(day => {
        const { name, number } = weekdayInitials(day);
        const selected = day === selectedDay;
        const future = dayDistance(day, today) > 0;
        const isToday = day === today;
        const hasMeals = logged.has(day);
        return (
          <MotionPressable
            key={day}
            onPress={() => setSelectedDay(day)}
            disabled={future}
            accessibilityRole="button"
            accessibilityLabel={`${dayLabel(day, today)}${hasMeals ? ', repas notés' : ''}`}
            accessibilityState={{ selected, disabled: future }}
            containerStyle={styles.cellOuter}
            style={[styles.cell, selected && styles.cellSelected]}
          >
            <Text maxFontSizeMultiplier={1.2} style={[styles.name, selected && styles.nameSelected, future && styles.future]}>{name}</Text>
            <Text maxFontSizeMultiplier={1.2} style={[styles.number, selected && styles.numberSelected, future && styles.future, isToday && !selected && styles.numberToday]}>{number}</Text>
            <View style={[styles.dot, hasMeals && (selected ? styles.dotOnDark : styles.dotOn)]} />
          </MotionPressable>
        );
      })}

      <MotionPressable
        onPress={() => {
          const target = shiftDay(selectedDay, 7);
          setSelectedDay(dayDistance(target, today) > 0 ? today : target);
        }}
        disabled={!canGoForward && selectedDay === today}
        accessibilityRole="button"
        accessibilityLabel="Semaine suivante"
        accessibilityState={{ disabled: !canGoForward && selectedDay === today }}
        style={[styles.arrow, !canGoForward && selectedDay === today && styles.arrowOff]}
      >
        <AppIcon name="chevron" size={18} color={!canGoForward && selectedDay === today ? colors.line : colors.inkSoft} strokeWidth={2.4} />
      </MotionPressable>
    </View>
  );
}

/** Le jour en toutes lettres pour l'en-tête : « Mercredi 14 octobre ». */
export function longDay(day: string) {
  const formatted = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(dayDate(day));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  arrow: { width: 28, height: 58, alignItems: 'center', justifyContent: 'center' },
  arrowOff: { opacity: 0.6 },
  cellOuter: { flex: 1 },
  cell: { height: 60, borderRadius: radii.large, alignItems: 'center', justifyContent: 'center', gap: 1 },
  cellSelected: { backgroundColor: colors.navy },
  name: { color: colors.muted, fontSize: 12, lineHeight: 16, fontFamily: fonts.medium },
  nameSelected: { color: colors.onDarkMuted },
  number: { color: colors.ink, fontSize: 16, lineHeight: 21, fontFamily: fonts.bold },
  numberSelected: { color: colors.white },
  numberToday: { color: colors.violet },
  future: { color: colors.muted, opacity: 0.6 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  dotOn: { backgroundColor: colors.violet },
  dotOnDark: { backgroundColor: colors.greenFill },
});
