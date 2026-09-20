import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { AppIcon } from '../components/AppIcon';
import { MotionPressable } from '../components/Motion';
import { StoryList } from '../components/StoryRail';
import { WeightCard } from '../components/WeightCard';
import { dailyEnergyPlan } from '../domain/activity-energy';
import { dayLabel, shiftDay, shortDayLabel } from '../domain/date';
import { mealsForDay, totalCalories } from '../domain/meals';
import { orderedStories, Story } from '../domain/stories';
import { useApp } from '../state/AppContext';
import { colors, MAX_FONT_SCALE, radii } from '../theme';

const CHART_HEIGHT = 168;

export function ProgressScreen({ onPlayStory }: { onPlayStory: (story: Story) => void }) {
  const { meals, profile, activity, today, selectedDay, setSelectedDay, profileCompleted, storyHistory } = useApp();
  const [width, setWidth] = useState(0);

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const day = shiftDay(today, -(6 - index));
    const entries = mealsForDay(meals, day);
    const plan = dailyEnergyPlan(profile, activity, day, profileCompleted);
    return {
      day,
      label: shortDayLabel(day).replace('.', ''),
      total: totalCalories(entries),
      hasData: entries.length > 0,
      target: plan.issue ? 0 : plan.target,
      isToday: day === today,
    };
  }), [meals, profile, activity, today, profileCompleted]);

  const withData = days.filter(day => day.hasData);
  const average = withData.length ? Math.round(withData.reduce((sum, day) => sum + day.total, 0) / withData.length) : 0;
  const currentTarget = days[days.length - 1].target;
  const stories = useMemo(() => orderedStories(storyHistory), [storyHistory]);

  const scale = Math.max(1, ...days.map(day => Math.max(day.total, day.target * 1.12)));
  const onLayout = (event: LayoutChangeEvent) => setWidth(Math.max(0, event.nativeEvent.layout.width));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.eyebrow}>TA TENDANCE</Text>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>Progression</Text>

      <WeightCard />

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={{ flex: 1 }}>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.cardTitle}>Calories saisies</Text>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.cardSub}>7 derniers jours · touche une barre pour ouvrir la journée</Text>
          </View>
          {currentTarget > 0 && (
            <View style={styles.targetPill}>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.targetPillText}>{profileCompleted ? 'Repère' : 'Exemple'} {currentTarget.toLocaleString('fr-FR')}</Text>
            </View>
          )}
        </View>

        <Text maxFontSizeMultiplier={1.3} style={styles.average}>
          {average.toLocaleString('fr-FR')} <Text style={styles.averageUnit}>kcal par jour renseigné</Text>
        </Text>

        <View style={styles.chart} onLayout={onLayout}>
          {width > 0 && (
            <View style={styles.bars}>
              {days.map(day => {
                const height = day.hasData ? Math.max(10, (day.total / scale) * CHART_HEIGHT) : 4;
                const targetY = day.target > 0 ? CHART_HEIGHT - (day.target / scale) * CHART_HEIGHT : null;
                const columnWidth = (width - 6 * 6) / 7;
                const barWidth = Math.max(14, Math.min(30, columnWidth * 0.62));
                return (
                  <MotionPressable
                    key={day.day}
                    onPress={() => setSelectedDay(day.day)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: day.day === selectedDay }}
                    accessibilityLabel={`${dayLabel(day.day, today)} : ${day.hasData ? `${day.total} kilocalories saisies` : 'aucun repas saisi'}${day.target > 0 ? `, repère ${day.target}` : ''}. Ouvrir cette journée.`}
                    containerStyle={styles.columnOuter}
                    style={styles.column}
                  >
                    <View style={styles.plot}>
                      {targetY !== null && (
                        <Svg width={columnWidth} height={CHART_HEIGHT} style={StyleSheet.absoluteFill}>
                          <Line
                            x1={0} y1={targetY} x2={columnWidth} y2={targetY}
                            stroke={colors.reference} strokeWidth={2} strokeDasharray="5 4" strokeLinecap="round"
                          />
                        </Svg>
                      )}
                      {day.hasData && (
                        <Text maxFontSizeMultiplier={1.2} style={styles.barValue} numberOfLines={1}>{day.total}</Text>
                      )}
                      <Svg width={barWidth} height={height}>
                        <Rect
                          x={0} y={0} width={barWidth} height={height}
                          rx={4} ry={4}
                          fill={!day.hasData ? colors.line : day.isToday ? colors.today : colors.intake}
                        />
                      </Svg>
                    </View>
                    <Text
                      maxFontSizeMultiplier={1.2}
                      style={[styles.dayLabel, day.day === selectedDay && styles.dayLabelActive]}
                      numberOfLines={1}
                    >
                      {day.isToday ? '● ' : ''}{day.label}
                    </Text>
                  </MotionPressable>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <View style={styles.insight}>
        <View style={styles.insightIcon}><AppIcon name="sparkle" size={20} color={colors.goldText} strokeWidth={2} /></View>
        <View style={{ flex: 1 }}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.insightTitle}>
            {withData.length < 3 ? 'Ta tendance se construit' : 'Regarde la semaine, pas la journée'}
          </Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.insightText}>
            {withData.length < 3
              ? 'Renseigne plusieurs journées complètes avant de comparer. Une journée partielle tire la moyenne vers le bas.'
              : 'Les écarts d’un jour à l’autre sont normaux. Vérifie que tous les repas sont saisis avant de tirer une conclusion.'}
          </Text>
        </View>
      </View>

      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.sectionTitle}>Lire les graphiques</Text>
      <View style={styles.legend}>
        <Legend dashed color={colors.reference} title="Ligne de repère" copy="Ton objectif alimentaire du jour, recalculé avec ton profil actuel — y compris pour les jours passés." />
        <View style={styles.divider} />
        <Legend color={colors.intake} title="Repas enregistrés" copy="Le total saisi. Une barre vide ne signifie pas zéro calorie mangée, mais aucun repas noté." />
        <View style={styles.divider} />
        <Legend color={colors.today} title="Aujourd’hui" copy="La journée est encore en cours : sa barre n’est pas comparable aux autres." />
        <View style={styles.divider} />
        <Legend color={colors.violet} title="Moyenne du poids" copy="La seule ligne tracée sur la courbe de poids. Les points gris sont les pesées, gardées en fond." />
      </View>

      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.sectionTitle}>Les minutes de Jaws</Text>
      <StoryList stories={stories} seen={storyHistory.seen} onPlay={onPlayStory} />

      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.legal}>
        Ces graphiques décrivent ce que tu as saisi. Ils ne mesurent ni ton déficit réel, ni ta composition corporelle.
      </Text>
    </ScrollView>
  );
}

function Legend({ color, title, copy, dashed = false }: { color: string; title: string; copy: string; dashed?: boolean }) {
  return (
    <View style={styles.legendRow}>
      {dashed
        ? <View style={[styles.legendDash, { borderColor: color }]} />
        : <View style={[styles.legendDot, { backgroundColor: color }]} />}
      <View style={{ flex: 1 }}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.legendTitle}>{title}</Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.legendCopy}>{copy}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 14 },
  eyebrow: { color: colors.sageDark, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.6, marginTop: 2, marginBottom: 2 },

  card: { backgroundColor: colors.card, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  cardSub: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 3, lineHeight: 17 },
  targetPill: { backgroundColor: colors.sagePale, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill },
  targetPillText: { color: colors.sageDark, fontSize: 12, fontWeight: '800' },
  average: { color: colors.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  averageUnit: { color: colors.muted, fontSize: 13, fontWeight: '600' },

  chart: { minHeight: CHART_HEIGHT + 30 },
  bars: { flexDirection: 'row', gap: 6, alignItems: 'flex-end' },
  columnOuter: { flex: 1 },
  column: { alignItems: 'center', gap: 8 },
  plot: { height: CHART_HEIGHT, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 5 },
  dayLabel: { color: colors.muted, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  dayLabelActive: { color: colors.navy, fontWeight: '800' },

  insight: { flexDirection: 'row', gap: 12, backgroundColor: colors.goldPale, borderRadius: radii.large, padding: 15, borderWidth: 1, borderColor: '#EFDDBE' },
  insightIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  insightTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  insightText: { color: '#6F4E07', fontSize: 13, lineHeight: 19, marginTop: 4, fontWeight: '500' },

  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginTop: 10 },
  legend: { backgroundColor: colors.card, borderRadius: radii.large, padding: 16, borderWidth: 1, borderColor: colors.line },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendDot: { width: 16, height: 16, borderRadius: 4 },
  legendDash: { width: 22, borderTopWidth: 2, borderStyle: 'dashed' },
  legendTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  legendCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 13 },

  legal: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
});
