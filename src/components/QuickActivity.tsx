import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ACTIVITY_LABELS } from '../domain/activity';
import {
  ASSUMED_WEIGHT_KG, DEFAULT_EFFORT, normallyIncludedInSteps, resolveWeight, sessionEnergy, validActivityWeight,
} from '../domain/activity-energy';
import { Praise, sessionPraise } from '../domain/praise';
import { useApp } from '../state/AppContext';
import { colors, fonts, MAX_FONT_SCALE, radii, typeScale } from '../theme';
import { ActivityKind, ActivitySession } from '../types';
import { AppIcon } from './AppIcon';
import { MotionPressable } from './Motion';
import { PraiseCard } from './PraiseCard';

/**
 * V2.8 — « 30 minutes de natation », en deux gestes.
 *
 * Le formulaire complet demande l'activité, le mode d'estimation, la durée, le
 * poids, l'intensité, un interrupteur sur les pas, puis une section de
 * précisions. C'est juste, et c'est beaucoup trop pour quelqu'un qui veut
 * simplement savoir ce que valent ses trente minutes de piscine.
 *
 * Ici : une activité, une durée, un chiffre. L'intensité retenue est l'allure
 * habituelle, écrite dans la séance ; le poids vient du profil, ou d'une
 * moyenne annoncée comme telle. Tout reste modifiable ensuite dans le
 * formulaire complet, qui n'a rien perdu.
 */

const QUICK_KINDS: ActivityKind[] = ['walk', 'run', 'cycle', 'swim', 'strength', 'mobility'];
const DURATIONS = [15, 30, 45, 60];

type Props = { day: string; onProfile?: () => void; onDetails?: () => void };

export function QuickActivity({ day, onProfile, onDetails }: Props) {
  const { profile, profileCompleted, activity, recordActivity } = useApp();
  const [kind, setKind] = useState<ActivityKind>('walk');
  const [minutes, setMinutes] = useState(30);
  const [praise, setPraise] = useState<Praise | null>(null);
  const [error, setError] = useState('');

  const profileWeight = profileCompleted && validActivityWeight(profile.weightKg) ? profile.weightKg : undefined;
  const { weightKg, assumed } = resolveWeight({}, profileWeight);

  const draft: ActivitySession = {
    id: 'apercu',
    day,
    kind,
    minutes,
    note: '',
    effort: DEFAULT_EFFORT,
    weightKg,
    weightAssumed: assumed,
    energySource: 'estimated',
    includedInSteps: normallyIncludedInSteps(kind),
  };
  const estimate = sessionEnergy(draft, profileWeight);

  const save = () => {
    if (!estimate) { setError('Cette séance n’a pas pu être estimée. Ouvre le détail pour la saisir.'); return; }
    const record: ActivitySession = { ...draft, id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    try {
      recordActivity(record);
      setError('');
      setPraise(sessionPraise({
        kind, minutes, activeKcal: estimate.activeKcal, assumedWeight: estimate.assumedWeight,
        journal: { ...activity, sessions: [record, ...activity.sessions] }, day, id: record.id,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'La séance n’a pas pu être enregistrée.');
    }
  };

  if (praise) {
    return (
      <View style={styles.wrap}>
        <PraiseCard praise={praise} tone="mint" onClose={() => setPraise(null)} />
        <MotionPressable onPress={() => setPraise(null)} accessibilityRole="button" style={styles.again}>
          <AppIcon name="plus" size={16} color={colors.violet} strokeWidth={2.4} />
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.againText}>Ajouter une autre séance</Text>
        </MotionPressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.lead}>
        J’ai fait du sport — choisis l’activité et la durée, la dépense s’affiche.
      </Text>

      <View style={styles.chips}>
        {QUICK_KINDS.map(item => (
          <MotionPressable
            key={item}
            onPress={() => { setKind(item); setError(''); }}
            accessibilityRole="radio"
            accessibilityState={{ selected: kind === item }}
            style={[styles.chip, kind === item && styles.chipOn]}
          >
            <Text maxFontSizeMultiplier={1.3} style={[styles.chipText, kind === item && styles.chipTextOn]}>{ACTIVITY_LABELS[item]}</Text>
          </MotionPressable>
        ))}
      </View>

      <View style={styles.chips}>
        {DURATIONS.map(value => (
          <MotionPressable
            key={value}
            onPress={() => { setMinutes(value); setError(''); }}
            accessibilityRole="radio"
            accessibilityLabel={`${value} minutes`}
            accessibilityState={{ selected: minutes === value }}
            containerStyle={styles.grow}
            style={[styles.time, minutes === value && styles.timeOn]}
          >
            <Text maxFontSizeMultiplier={1.3} style={[styles.timeText, minutes === value && styles.timeTextOn]}>{value} min</Text>
          </MotionPressable>
        ))}
      </View>

      <View style={styles.result} accessibilityLiveRegion="polite">
        <View style={styles.resultBody}>
          <Text maxFontSizeMultiplier={1.3} style={styles.number}>
            ≈ {(estimate?.activeKcal ?? 0).toLocaleString('fr-FR')}
          </Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.unit}>kcal dépensées</Text>
        </View>
        <MotionPressable onPress={save} accessibilityRole="button" style={styles.save}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.saveText}>Enregistrer</Text>
        </MotionPressable>
      </View>

      {assumed ? (
        <MotionPressable onPress={onProfile} accessibilityRole="button" disabled={!onProfile} style={styles.note}>
          <AppIcon name="info" size={15} color={colors.warmInk} strokeWidth={2} />
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.noteText}>
            Estimation pour un poids moyen de {ASSUMED_WEIGHT_KG} kg. Indique ton poids pour l’ajuster.
          </Text>
        </MotionPressable>
      ) : null}

      {error ? <Text accessibilityRole="alert" maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.error}>{error}</Text> : null}

      {onDetails ? (
        <MotionPressable onPress={onDetails} accessibilityRole="button" style={styles.again}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.againText}>Intensité, poids, montre : tout régler</Text>
          <AppIcon name="chevron" size={15} color={colors.violet} strokeWidth={2.4} />
        </MotionPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  lead: { color: colors.inkSoft, ...typeScale.body },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grow: { flexGrow: 1 },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 13, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.violet, borderColor: colors.violet },
  chipText: { color: colors.inkSoft, fontSize: 13, lineHeight: 18, fontFamily: fonts.semibold },
  chipTextOn: { color: colors.white },
  time: { minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: radii.input, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  timeOn: { backgroundColor: colors.purplePale, borderColor: colors.violet },
  timeText: { color: colors.inkSoft, fontSize: 14, lineHeight: 20, fontFamily: fonts.semibold },
  timeTextOn: { color: colors.violet, fontFamily: fonts.bold },
  result: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.mintPale, borderRadius: radii.large, padding: 14 },
  resultBody: { flex: 1, minWidth: 0 },
  number: { color: colors.mintInk, fontSize: 30, lineHeight: 36, fontFamily: fonts.extrabold, letterSpacing: -0.8 },
  unit: { color: colors.mintInk, ...typeScale.caption },
  save: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 18, borderRadius: radii.pill, backgroundColor: colors.violet },
  saveText: { color: colors.white, fontSize: 15, lineHeight: 20, fontFamily: fonts.bold },
  note: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.warmPale, borderRadius: radii.input, paddingHorizontal: 11, paddingVertical: 9 },
  noteText: { flex: 1, color: colors.warmInk, ...typeScale.caption },
  error: { color: colors.coral, ...typeScale.caption },
  again: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44 },
  againText: { color: colors.violet, fontSize: 14, lineHeight: 20, fontFamily: fonts.bold },
});
