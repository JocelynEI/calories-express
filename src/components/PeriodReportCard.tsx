import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { macroTargets } from '../domain/calories';
import { shortDateLabel, shortDayLabel } from '../domain/date';
import { effectiveMacroGoals } from '../domain/premium';
import { durationLabel, periodReport, ReportPeriod, signedKcal } from '../domain/report';
import { useApp } from '../state/AppContext';
import { colors, fonts, MAX_FONT_SCALE, radii } from '../theme';
import { MacroBar } from './MacroBar';
import { MotionPressable } from './Motion';

const CHART_HEIGHT = 120;
const PERIODS: { id: ReportPeriod; label: string }[] = [{ id: 7, label: '7 jours' }, { id: 30, label: '30 jours' }];
const kcal = (n: number) => n.toLocaleString('fr-FR');

/**
 * V5.0 (premium) — le bilan de la semaine ou du mois.
 *
 * Tout est relu depuis le journal : une journée sans repas n'est pas comptée
 * comme zéro, et rien ne juge. Le texte dit ce qui s'est passé, pas ce qu'il
 * aurait fallu.
 */
export function PeriodReportCard() {
  const { meals, profile, activity, today, profileCompleted, macroGoals, premium } = useApp();
  const [period, setPeriod] = useState<ReportPeriod>(7);
  const [width, setWidth] = useState(0);
  const report = useMemo(
    () => periodReport(meals, profile, activity, profileCompleted, today, period),
    [meals, profile, activity, profileCompleted, today, period],
  );
  const onLayout = (event: LayoutChangeEvent) => setWidth(Math.max(0, event.nativeEvent.layout.width));

  const scale = Math.max(1, ...report.days.map(day => Math.max(day.kcal, (report.avgTarget ?? 0) * 1.12)));
  const gap = period === 7 ? 6 : 2;
  const barWidth = width > 0 ? Math.max(3, (width - gap * (period - 1)) / period) : 0;
  const targetY = report.avgTarget ? CHART_HEIGHT - (report.avgTarget / scale) * CHART_HEIGHT : null;

  const auto = macroTargets(profile, report.avgTarget ?? 0);
  const { goals, custom } = effectiveMacroGoals(auto, macroGoals, premium.unlocked);
  const showTargets = custom || report.avgTarget !== null;
  const first = report.days[0].day, last = report.days[report.days.length - 1].day;
  const periodName = period === 7 ? 'la semaine' : 'le mois';

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title} accessibilityRole="header">Bilan</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.sub}>{period} derniers jours, repas renseignés seulement</Text>
        </View>
      </View>

      <View style={styles.segmented}>
        {PERIODS.map(item => (
          <MotionPressable
            key={item.id}
            onPress={() => setPeriod(item.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: period === item.id }}
            containerStyle={{ flex: 1 }}
            style={[styles.segment, period === item.id && styles.segmentOn]}
          >
            <Text maxFontSizeMultiplier={1.3} style={[styles.segmentText, period === item.id && styles.segmentTextOn]}>{item.label}</Text>
          </MotionPressable>
        ))}
      </View>

      {report.avgKcal === null ? (
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.empty}>
          Aucun repas noté sur cette période. Le bilan se remplit dès les premiers repas saisis.
        </Text>
      ) : (
        <>
          <Text maxFontSizeMultiplier={1.3} style={styles.average}>
            {kcal(report.avgKcal)} <Text style={styles.unit}>kcal par jour renseigné</Text>
          </Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.sub}>
            {report.recordedDays} jour{report.recordedDays > 1 ? 's' : ''} renseigné{report.recordedDays > 1 ? 's' : ''} sur {period}
          </Text>

          <View onLayout={onLayout} style={styles.chart}>
            {width > 0 && (
              <Svg width={width} height={CHART_HEIGHT} accessibilityLabel={`Calories saisies chaque jour sur ${period} jours`}>
                {report.days.map((day, index) => {
                  const h = day.hasMeals ? Math.max(4, (day.kcal / scale) * CHART_HEIGHT) : 3;
                  return (
                    <Rect
                      key={day.day} x={index * (barWidth + gap)} y={CHART_HEIGHT - h} width={barWidth} height={h} rx={2}
                      fill={!day.hasMeals ? colors.line : day.day === today ? colors.today : colors.intake}
                    />
                  );
                })}
                {targetY !== null && (
                  <Line x1={0} y1={targetY} x2={width} y2={targetY} stroke={colors.reference} strokeWidth={2} strokeDasharray="5 4" strokeLinecap="round" />
                )}
              </Svg>
            )}
          </View>
          <View style={styles.axis}>
            <Text maxFontSizeMultiplier={1.2} style={styles.axisText}>{period === 7 ? shortDayLabel(first).replace('.', '') : shortDateLabel(first)}</Text>
            <Text maxFontSizeMultiplier={1.2} style={styles.axisText}>{period === 7 ? shortDayLabel(last).replace('.', '') : shortDateLabel(last)}</Text>
          </View>

          <View style={styles.rows}>
            {report.avgTarget !== null && report.gapKcal !== null && (
              <>
                <Row label="Repère moyen" value={`${kcal(report.avgTarget)} kcal`} />
                <Row label="Écart moyen au repère" value={`${signedKcal(report.gapKcal)} kcal`} />
                <Row label="Jours au-dessus du repère" value={`${report.daysAbove} sur ${report.recordedDays}`} />
              </>
            )}
            {report.previous && (
              <Row
                label={`Avant : ${kcal(report.previous.avgKcal)} kcal`}
                value={`${signedKcal(report.previous.deltaKcal)} kcal`}
                hint={`par jour renseigné, par rapport à ${period === 7 ? 'la semaine d’avant' : 'au mois d’avant'}`}
              />
            )}
          </View>
        </>
      )}

      {report.macros ? (
        <View style={styles.macros}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.sectionLabel}>
            Macros, moyenne par jour {custom ? '· tes objectifs' : showTargets ? '· repères automatiques' : ''}
          </Text>
          {showTargets ? (
            <>
              <MacroBar label="Protéines" value={report.macros.protein} target={goals.protein} color={colors.protein} />
              <MacroBar label="Glucides" value={report.macros.carbs} target={goals.carbs} color={colors.carbs} />
              <MacroBar label="Lipides" value={report.macros.fat} target={goals.fat} color={colors.fat} />
            </>
          ) : (
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.plain}>
              Protéines {report.macros.protein} g · Glucides {report.macros.carbs} g · Lipides {report.macros.fat} g
            </Text>
          )}
          {report.macrosPartialDays > 0 && (
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.note}>
              {report.macrosPartialDays} jour{report.macrosPartialDays > 1 ? 's' : ''} sans macros complètes {report.macrosPartialDays > 1 ? 'ne sont' : 'n’est'} pas compté{report.macrosPartialDays > 1 ? 's' : ''} ici.
            </Text>
          )}
        </View>
      ) : report.avgKcal !== null ? (
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.note}>
          Les macros ne sont pas affichées : sur cette période, aucune journée n’a toutes ses valeurs.
        </Text>
      ) : null}

      <View style={styles.macros}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.sectionLabel}>Activité sur {periodName}</Text>
        {report.activity.activeDays > 0 ? (
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.plain}>
            {report.activity.minutes > 0 ? `${durationLabel(report.activity.minutes)} de séances` : 'Pas de séance notée'}
            {report.activity.activeKcal > 0 ? ` · ${kcal(report.activity.activeKcal)} kcal actives` : ''}
            {` · ${report.activity.activeDays} jour${report.activity.activeDays > 1 ? 's' : ''} actif${report.activity.activeDays > 1 ? 's' : ''}`}
          </Text>
        ) : (
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.plain}>Aucune activité notée sur cette période.</Text>
        )}
      </View>

      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.note}>
        Ce bilan décrit ce que tu as saisi. Il ne mesure ni ton déficit réel, ni ta composition corporelle.
      </Text>
    </View>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.rowLabel}>{label}</Text>
        {hint ? <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.rowHint}>{hint}</Text> : null}
      </View>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { color: colors.ink, fontSize: 20, fontFamily: fonts.extrabold, letterSpacing: -0.3 },
  sub: { color: colors.muted, fontSize: 12, fontFamily: fonts.semibold, lineHeight: 17 },
  segmented: { flexDirection: 'row', gap: 8 },
  segment: { minHeight: 42, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line },
  segmentOn: { backgroundColor: colors.violet, borderColor: colors.violet },
  segmentText: { color: colors.inkSoft, fontSize: 14, fontFamily: fonts.bold },
  segmentTextOn: { color: colors.white },
  empty: { color: colors.muted, fontSize: 14, lineHeight: 21, fontFamily: fonts.medium },
  average: { color: colors.ink, fontSize: 26, fontFamily: fonts.extrabold, letterSpacing: -0.6 },
  unit: { color: colors.muted, fontSize: 13, fontFamily: fonts.semibold },
  chart: { height: CHART_HEIGHT },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { color: colors.muted, fontSize: 12, fontFamily: fonts.semibold, textTransform: 'capitalize' },
  rows: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.line },
  rowLabel: { color: colors.inkSoft, fontSize: 14, fontFamily: fonts.semibold },
  rowHint: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },
  rowValue: { color: colors.ink, fontSize: 15, fontFamily: fonts.extrabold },
  macros: { gap: 9, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 },
  sectionLabel: { color: colors.ink, fontSize: 14, fontFamily: fonts.extrabold },
  plain: { color: colors.inkSoft, fontSize: 14, lineHeight: 21, fontFamily: fonts.medium },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18, fontFamily: fonts.medium },
});
