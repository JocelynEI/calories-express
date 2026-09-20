import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { dayDistance, dayLabel, shiftDay } from '../domain/date';
import { useApp } from '../state/AppContext';
import { colors, MAX_FONT_SCALE, radii } from '../theme';
import { AppIcon } from './AppIcon';
import { MotionPressable } from './Motion';

/**
 * V1.8 — la navigation par date qui manquait.
 *
 * Jusqu'ici, les repas d'hier étaient enregistrés mais inaccessibles : un dîner
 * oublié ne pouvait plus être rattrapé. Le futur reste fermé, et un retour
 * direct à aujourd'hui est toujours proposé dès qu'on s'en éloigne.
 */
export function DayNavigator({ compact = false }: { compact?: boolean }) {
  const { selectedDay, setSelectedDay, today } = useApp();
  const distance = dayDistance(selectedDay, today);
  const atToday = distance === 0;
  return (
    <View style={styles.row}>
      <MotionPressable
        onPress={() => setSelectedDay(shiftDay(selectedDay, -1))}
        accessibilityRole="button"
        accessibilityLabel="Journée précédente"
        style={styles.arrow}
      >
        <AppIcon name="chevronLeft" size={18} color={colors.inkSoft} strokeWidth={2.4} />
      </MotionPressable>

      <View style={styles.labelWrap}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.label, compact && styles.labelCompact]} numberOfLines={1}>
          {dayLabel(selectedDay, today)}
        </Text>
      </View>

      <MotionPressable
        onPress={() => setSelectedDay(shiftDay(selectedDay, 1))}
        disabled={atToday}
        accessibilityRole="button"
        accessibilityLabel="Journée suivante"
        accessibilityState={{ disabled: atToday }}
        style={[styles.arrow, atToday && styles.arrowOff]}
      >
        <AppIcon name="chevron" size={18} color={atToday ? colors.line : colors.inkSoft} strokeWidth={2.4} />
      </MotionPressable>

      {!atToday && (
        <MotionPressable
          onPress={() => setSelectedDay(today)}
          accessibilityRole="button"
          accessibilityLabel="Revenir à aujourd’hui"
          style={styles.back}
        >
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.backText}>Aujourd’hui</Text>
        </MotionPressable>
      )}
    </View>
  );
}

/** Bandeau affiché en haut des écrans quand la journée consultée n'est pas aujourd'hui. */
export function PastDayBanner() {
  const { selectedDay, today } = useApp();
  if (selectedDay === today) return null;
  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      <AppIcon name="calendar" size={17} color={colors.goldText} strokeWidth={2} />
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.bannerText}>
        Tu consultes {dayLabel(selectedDay, today).toLocaleLowerCase('fr-FR')}. Ce que tu ajoutes est daté de cette journée.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2, flexWrap: 'wrap' },
  arrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  arrowOff: { opacity: 0.6 },
  labelWrap: { minWidth: 0, flexShrink: 1 },
  label: { color: colors.inkSoft, fontSize: 14, fontWeight: '700' },
  labelCompact: { fontSize: 13 },
  back: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 10, marginLeft: 4, borderRadius: radii.pill, backgroundColor: colors.violetPale },
  backText: { color: colors.violet, fontSize: 12, fontWeight: '800' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.goldPale, borderRadius: radii.medium, paddingHorizontal: 13, paddingVertical: 11 },
  bannerText: { flex: 1, color: '#6F4E07', fontSize: 13, lineHeight: 19, fontWeight: '600' },
});
