import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ACTIVITY_LABELS, ACTIVITY_PHRASES } from '../domain/activity';
import {
  ASSUMED_WEIGHT_KG, DEFAULT_EFFORT, normallyIncludedInSteps, resolveWeight, sessionEnergy, validActivityWeight,
} from '../domain/activity-energy';
import { Praise, sessionPraise } from '../domain/praise';
import { useApp } from '../state/AppContext';
import { colors, fonts, MAX_FONT_SCALE, radii, shadows, typeScale } from '../theme';
import { ActivityKind, ActivitySession } from '../types';
import { AppIcon } from './AppIcon';
import { MotionPressable } from './Motion';
import { PraiseCard } from './PraiseCard';

/**
 * V2.9 — « Combien ai-je dépensé ? », en une phrase.
 *
 * La V2.8 avait déjà réduit la saisie à deux rangées de boutons, mais elle
 * n'annonçait pas ce qu'elle faisait : on voyait des choix, pas un calcul. Et
 * elle se trouvait dans le troisième bloc de l'accueil, après une longue
 * descente.
 *
 * Ici, une question en titre et une phrase à compléter :
 *
 *     J'ai fait **de la natation** pendant **30 min**
 *
 * Les deux mots soulignés s'ouvrent au toucher. La phrase se lit avant même
 * d'avoir compris l'interface, et le résultat se met à jour sous les yeux :
 * personne n'a besoin qu'on lui explique ce que fait cet écran.
 *
 * Le formulaire complet — intensité, poids de la séance, calories de la
 * montre, notes — reste accessible par un lien, et n'a rien perdu.
 */

const QUICK_KINDS: ActivityKind[] = ['walk', 'run', 'cycle', 'swim', 'strength', 'interval', 'aqua', 'mobility'];
const DURATIONS = [10, 15, 20, 30, 45, 60, 90];

type Props = { day: string; onProfile?: () => void; onDetails?: () => void };
type Open = 'kind' | 'minutes' | null;

export function QuickActivity({ day, onProfile, onDetails }: Props) {
  const { profile, profileCompleted, activity, recordActivity } = useApp();
  const [kind, setKind] = useState<ActivityKind>('swim');
  const [minutes, setMinutes] = useState(30);
  const [open, setOpen] = useState<Open>(null);
  const [praise, setPraise] = useState<Praise | null>(null);
  const [error, setError] = useState('');

  const profileWeight = profileCompleted && validActivityWeight(profile.weightKg) ? profile.weightKg : undefined;
  const { weightKg, assumed } = resolveWeight({}, profileWeight);

  const draft: ActivitySession = {
    id: 'apercu', day, kind, minutes, note: '',
    effort: DEFAULT_EFFORT, weightKg, weightAssumed: assumed,
    energySource: 'estimated', includedInSteps: normallyIncludedInSteps(kind),
  };
  const estimate = sessionEnergy(draft, profileWeight);

  const save = () => {
    if (!estimate) { setError('Cette séance n’a pas pu être estimée. Ouvre le détail pour la saisir.'); return; }
    const record: ActivitySession = { ...draft, id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    try {
      recordActivity(record);
      setError('');
      setOpen(null);
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
        <MotionPressable onPress={() => setPraise(null)} accessibilityRole="button" style={styles.link}>
          <AppIcon name="plus" size={16} color={colors.violet} strokeWidth={2.4} />
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.linkText}>Estimer une autre séance</Text>
        </MotionPressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.question}>Combien ai-je dépensé ?</Text>

        {/* La phrase. Les deux mots soulignés sont des boutons : en français
            comme à l'écran, on remplit les blancs d'une phrase. */}
        <Text maxFontSizeMultiplier={1.4} style={styles.sentence}>
          {'J’ai fait '}
          <Text
            onPress={() => setOpen(open === 'kind' ? null : 'kind')}
            accessibilityRole="button"
            accessibilityLabel={`Activité : ${ACTIVITY_LABELS[kind]}. Appuie pour changer.`}
            style={styles.token}
          >
            {ACTIVITY_PHRASES[kind]}
          </Text>
          {' pendant '}
          <Text
            onPress={() => setOpen(open === 'minutes' ? null : 'minutes')}
            accessibilityRole="button"
            accessibilityLabel={`Durée : ${minutes} minutes. Appuie pour changer.`}
            style={styles.token}
          >
            {minutes} min
          </Text>
        </Text>

        {open === 'kind' ? (
          <View style={styles.chips}>
            {QUICK_KINDS.map(item => (
              <MotionPressable
                key={item}
                onPress={() => { setKind(item); setOpen(null); setError(''); }}
                accessibilityRole="radio"
                accessibilityState={{ selected: kind === item }}
                style={[styles.chip, kind === item && styles.chipOn]}
              >
                <Text maxFontSizeMultiplier={1.3} style={[styles.chipText, kind === item && styles.chipTextOn]}>{ACTIVITY_LABELS[item]}</Text>
              </MotionPressable>
            ))}
          </View>
        ) : null}

        {open === 'minutes' ? (
          <View style={styles.chips}>
            {DURATIONS.map(value => (
              <MotionPressable
                key={value}
                onPress={() => { setMinutes(value); setOpen(null); setError(''); }}
                accessibilityRole="radio"
                accessibilityLabel={`${value} minutes`}
                accessibilityState={{ selected: minutes === value }}
                style={[styles.chip, minutes === value && styles.chipOn]}
              >
                <Text maxFontSizeMultiplier={1.3} style={[styles.chipText, minutes === value && styles.chipTextOn]}>{value} min</Text>
              </MotionPressable>
            ))}
          </View>
        ) : null}

        <View style={styles.result} accessibilityLiveRegion="polite">
          <Text maxFontSizeMultiplier={1.25} style={styles.number}>
            ≈ {(estimate?.activeKcal ?? 0).toLocaleString('fr-FR')}
          </Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.unit}>kilocalories dépensées</Text>
        </View>

        <MotionPressable onPress={save} accessibilityRole="button" style={styles.save}>
          <AppIcon name="check" size={18} color={colors.white} strokeWidth={2.6} />
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.saveText}>Enregistrer cette séance</Text>
        </MotionPressable>

        {error ? <Text accessibilityRole="alert" maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.error}>{error}</Text> : null}
      </View>

      {assumed ? (
        <MotionPressable onPress={onProfile} accessibilityRole="button" disabled={!onProfile} style={styles.note}>
          <AppIcon name="info" size={15} color={colors.warmInk} strokeWidth={2} />
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.noteText}>
            Calcul pour un poids moyen de {ASSUMED_WEIGHT_KG} kg. Indique le tien pour l’ajuster.
          </Text>
        </MotionPressable>
      ) : null}

      {onDetails ? (
        <MotionPressable onPress={onDetails} accessibilityRole="button" style={styles.link}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.linkText}>Intensité, poids, montre : tout régler</Text>
          <AppIcon name="chevron" size={15} color={colors.violet} strokeWidth={2.4} />
        </MotionPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  card: { backgroundColor: colors.card, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 14, ...shadows.card },
  question: { color: colors.ink, ...typeScale.section },
  sentence: { color: colors.inkSoft, fontSize: 18, lineHeight: 30, fontFamily: fonts.medium },
  token: { color: colors.violet, fontFamily: fonts.extrabold, textDecorationLine: 'underline' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 13, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background },
  chipOn: { backgroundColor: colors.violet, borderColor: colors.violet },
  chipText: { color: colors.inkSoft, fontSize: 13, lineHeight: 18, fontFamily: fonts.semibold },
  chipTextOn: { color: colors.white },
  result: { alignItems: 'center', backgroundColor: colors.mintPale, borderRadius: radii.large, paddingVertical: 16 },
  number: { color: colors.mintInk, fontSize: 46, lineHeight: 54, fontFamily: fonts.extrabold, letterSpacing: -1.6 },
  unit: { color: colors.mintInk, fontSize: 13, lineHeight: 18, fontFamily: fonts.semibold },
  save: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, borderRadius: radii.large, backgroundColor: colors.violet, ...shadows.raised },
  saveText: { color: colors.white, fontSize: 16, lineHeight: 22, fontFamily: fonts.bold },
  error: { color: colors.coral, ...typeScale.caption },
  note: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.warmPale, borderRadius: radii.input, paddingHorizontal: 11, paddingVertical: 9 },
  noteText: { flex: 1, color: colors.warmInk, ...typeScale.caption },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44 },
  linkText: { color: colors.violet, fontSize: 14, lineHeight: 20, fontFamily: fonts.bold },
});
