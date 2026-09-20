import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { dayDistance, dayLabel, shiftDay } from '../domain/date';
import { readNumber } from '../domain/foods';
import { movingAverage, trendSentence, weightTrend } from '../domain/weight';
import { useApp } from '../state/AppContext';
import { colors, MAX_FONT_SCALE, radii } from '../theme';
import { WeightEntry } from '../types';
import { AppIcon } from './AppIcon';
import { MotionPressable } from './Motion';

const WINDOW_DAYS = 30;
const CHART_HEIGHT = 148;

/**
 * V1.8 — la courbe de poids qui manquait.
 *
 * L'application est construite autour d'un objectif de poids, et Progression ne
 * montrait que des calories. Ici, une seule série est tracée : la moyenne
 * mobile sur sept jours, en violet. Les pesées elles-mêmes restent en gris,
 * volontairement discrètes — ce sont des points de contexte, pas la ligne à
 * suivre. Aucune projection n'est dessinée : la courbe décrit le passé.
 */
export function WeightCard() {
  const { weightLog, selectedDay, today, recordWeight, forgetWeight } = useApp();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [width, setWidth] = useState(0);

  const existing = weightLog.find(entry => entry.day === selectedDay) ?? null;
  const last = weightLog.length ? weightLog[weightLog.length - 1] : null;
  const trend = useMemo(() => weightTrend(weightLog, 28, today), [weightLog, today]);

  const visible = useMemo(() => {
    const from = shiftDay(today, -(WINDOW_DAYS - 1));
    return weightLog.filter(entry => entry.day >= from);
  }, [weightLog, today]);
  const average = useMemo(() => movingAverage(visible, 7), [visible]);

  const save = () => {
    const value = readNumber(draft);
    if (value === null) { setError('Indique ton poids en kilogrammes, par exemple 78,4.'); return; }
    try {
      recordWeight(selectedDay, value);
      setDraft(''); setError(''); setSaved(true);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Vérifie le poids saisi.');
    }
  };

  const onLayout = (event: LayoutChangeEvent) => setWidth(Math.max(0, event.nativeEvent.layout.width));

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headIcon}><AppIcon name="weight" size={20} color={colors.violet} strokeWidth={1.9} /></View>
        <View style={{ flex: 1 }}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>Mon poids</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.subtitle}>
            {last ? `Dernière pesée ${dayLabel(last.day, today).toLocaleLowerCase('fr-FR')}` : 'Aucune pesée enregistrée'}
          </Text>
        </View>
        {last && (
          <View style={styles.heroWrap}>
            <Text maxFontSizeMultiplier={1.3} style={styles.hero}>{last.kg.toFixed(1).replace('.', ',')}</Text>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.heroUnit}>kg</Text>
          </View>
        )}
      </View>

      <View style={styles.chartWrap} onLayout={onLayout}>
        {width > 0 && visible.length >= 2 ? (
          <Chart width={width} points={visible} average={average} today={today} />
        ) : (
          <View style={styles.chartEmpty}>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.chartEmptyText}>
              La courbe apparaît à partir de deux pesées.
            </Text>
          </View>
        )}
      </View>

      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.trend}>{trendSentence(trend)}</Text>

      <View style={styles.formRow}>
        <View style={styles.inputWrap}>
          <TextInput
            accessibilityLabel={`Poids en kilogrammes pour ${dayLabel(selectedDay, today)}`}
            value={draft}
            onChangeText={value => { setDraft(value); setError(''); setSaved(false); }}
            placeholder={existing ? existing.kg.toFixed(1).replace('.', ',') : '78,4'}
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            maxLength={6}
            style={styles.input}
          />
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.inputSuffix}>kg</Text>
        </View>
        <MotionPressable onPress={save} accessibilityRole="button" containerStyle={styles.saveOuter} style={styles.save}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.saveText}>{existing ? 'Corriger' : 'Noter'}</Text>
        </MotionPressable>
      </View>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.formHint}>
        Pesée du {dayLabel(selectedDay, today).toLocaleLowerCase('fr-FR')}. Une seule par journée : une nouvelle valeur remplace la précédente.
      </Text>

      {error ? <Text accessibilityRole="alert" maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.error}>{error}</Text> : null}
      {saved && !error ? <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.saved}>C’est noté.</Text> : null}

      {existing && (
        <MotionPressable
          onPress={() => { forgetWeight(selectedDay); setSaved(false); setDraft(''); }}
          accessibilityRole="button"
          style={styles.forget}
        >
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.forgetText}>Retirer la pesée de cette journée</Text>
        </MotionPressable>
      )}
    </View>
  );
}

function Chart({ width, points, average, today }: { width: number; points: WeightEntry[]; average: WeightEntry[]; today: string }) {
  const padLeft = 8;
  const padRight = 44;
  const innerWidth = Math.max(40, width - padLeft - padRight);
  const oldest = points[0].day;
  const span = Math.max(1, dayDistance(today, oldest));
  const values = [...points.map(p => p.kg), ...average.map(p => p.kg)];
  const min = Math.min(...values) - 0.4;
  const max = Math.max(...values) + 0.4;
  const range = Math.max(0.8, max - min);
  const x = (day: string) => padLeft + (dayDistance(day, oldest) / span) * innerWidth;
  const y = (kg: number) => CHART_HEIGHT - ((kg - min) / range) * CHART_HEIGHT;
  const line = average.map((entry, index) => `${index === 0 ? 'M' : 'L'} ${x(entry.day).toFixed(1)} ${y(entry.kg).toFixed(1)}`).join(' ');
  const lastAverage = average[average.length - 1];

  return (
    <View
      accessible
      accessibilityLabel={`Courbe de poids sur ${span + 1} jours. ${points.length} pesées, de ${points[0].kg.toFixed(1)} à ${points[points.length - 1].kg.toFixed(1)} kilogrammes. Moyenne actuelle sur sept jours : ${lastAverage.kg.toFixed(1)} kilogrammes.`}
    >
      <Svg width={width} height={CHART_HEIGHT + 22}>
        <Line x1={0} y1={CHART_HEIGHT} x2={width} y2={CHART_HEIGHT} stroke={colors.line} strokeWidth={1} />
        {/* Les pesées : marques de contexte, volontairement neutres. */}
        {points.map(entry => (
          <Circle
            key={entry.day}
            cx={x(entry.day)} cy={y(entry.kg)} r={4}
            fill={colors.muted} opacity={0.42}
            stroke={colors.card} strokeWidth={2}
          />
        ))}
        {/* La seule série tracée : la moyenne mobile. */}
        <Path d={line} fill="none" stroke={colors.violet} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={x(lastAverage.day)} cy={y(lastAverage.kg)} r={5} fill={colors.violet} stroke={colors.card} strokeWidth={2} />
      </Svg>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.axisLabel, { top: Math.max(0, y(lastAverage.kg) - 9), right: 0 }]}>
        {lastAverage.kg.toFixed(1).replace('.', ',')} kg
      </Text>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.axisFoot, { left: padLeft }]}>
        {dayLabel(oldest, today).toLocaleLowerCase('fr-FR')}
      </Text>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.axisFoot, { right: padRight }]}>aujourd’hui</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.violetPale, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 2 },
  heroWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  hero: { color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  heroUnit: { color: colors.muted, fontSize: 13, fontWeight: '700' },

  chartWrap: { minHeight: CHART_HEIGHT + 22, justifyContent: 'center' },
  chartEmpty: { height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderRadius: radii.medium },
  chartEmptyText: { color: colors.muted, fontSize: 13, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20 },
  axisLabel: { position: 'absolute', color: colors.violet, fontSize: 12, fontWeight: '800' },
  axisFoot: { position: 'absolute', bottom: 0, color: colors.muted, fontSize: 12, fontWeight: '600' },

  trend: { color: colors.inkSoft, fontSize: 14, lineHeight: 20, fontWeight: '500' },

  formRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#C9CEDC', borderRadius: 13, paddingHorizontal: 12, backgroundColor: colors.white },
  input: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '700', paddingVertical: 12 },
  inputSuffix: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  saveOuter: { minWidth: 104 },
  save: { minHeight: 48, borderRadius: 13, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  saveText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  formHint: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: -4 },
  error: { color: '#8E241D', backgroundColor: colors.coralPale, borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 19 },
  saved: { color: colors.aqua, fontSize: 13, fontWeight: '700' },
  forget: { minHeight: 44, justifyContent: 'center' },
  forgetText: { color: colors.muted, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});
