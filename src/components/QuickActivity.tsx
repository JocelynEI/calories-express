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
 * V3.0 — « Ajouter une activité », puis on remplit.
 *
 * La V2.9 affichait une phrase déjà remplie — « J'ai fait de la natation
 * pendant 30 min » — et son résultat, avant que personne n'ait rien demandé.
 * C'était lisible, mais malhonnête sur deux points : l'écran affirmait une
 * séance qui n'avait pas eu lieu, et un doigt sur « Enregistrer » suffisait à
 * l'inscrire pour de bon.
 *
 * Ici, deux temps, comme pour un repas :
 *
 *   1. au repos, un seul bouton — « Ajouter une activité » ;
 *   2. une fois touché, la phrase s'ouvre **sur place**, avec ses blancs vides :
 *
 *          J'ai fait ______ pendant ______
 *
 * Le premier blanc s'ouvre tout seul, le second s'enchaîne dès que le premier
 * est rempli. Le chiffre n'apparaît qu'une fois les deux choisis : tant qu'il
 * manque quelque chose, l'application ne prétend rien.
 *
 * Rien n'est mémorisé d'une fois sur l'autre : chaque séance repart de zéro,
 * pour qu'on ne puisse jamais enregistrer par inadvertance le sport de la
 * veille.
 */

const QUICK_KINDS: ActivityKind[] = ['walk', 'run', 'cycle', 'swim', 'strength', 'interval', 'aqua', 'mobility'];
const DURATIONS = [10, 15, 20, 30, 45, 60, 90];

/**
 * Des noms courts, pour les pastilles seulement. « Aquagym / Aquafitness »
 * occupe une ligne à lui tout seul et fait passer la liste de trois à quatre
 * rangées ; le nom complet reste celui du formulaire, et c'est lui qu'annonce
 * le lecteur d'écran.
 */
const SHORT_LABELS: Partial<Record<ActivityKind, string>> = {
  run: 'Course',
  interval: 'Fractionné',
  aqua: 'Aquagym',
};

type Props = { day: string; onProfile?: () => void; onDetails?: () => void };
type Open = 'kind' | 'minutes' | null;

export function QuickActivity({ day, onProfile, onDetails }: Props) {
  const { profile, profileCompleted, activity, recordActivity } = useApp();
  const [editing, setEditing] = useState(false);
  // Volontairement `null` au départ, et jamais rempli par défaut : un blanc
  // vide se remarque, une valeur d'exemple se prend pour une réponse.
  const [kind, setKind] = useState<ActivityKind | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [open, setOpen] = useState<Open>(null);
  const [praise, setPraise] = useState<Praise | null>(null);
  const [error, setError] = useState('');

  const profileWeight = profileCompleted && validActivityWeight(profile.weightKg) ? profile.weightKg : undefined;
  const { weightKg, assumed } = resolveWeight({}, profileWeight);

  const reset = () => {
    setEditing(false);
    setKind(null);
    setMinutes(null);
    setOpen(null);
    setError('');
  };

  const start = () => {
    setEditing(true);
    setError('');
    // Le premier blanc s'ouvre sans qu'on ait à le toucher : le geste suivant
    // est évident, et « remplir » commence vraiment après le bouton.
    setOpen('kind');
  };

  const draft: ActivitySession | null = kind !== null && minutes !== null ? {
    id: 'apercu', day, kind, minutes, note: '',
    effort: DEFAULT_EFFORT, weightKg, weightAssumed: assumed,
    energySource: 'estimated', includedInSteps: normallyIncludedInSteps(kind),
  } : null;
  const estimate = draft ? sessionEnergy(draft, profileWeight) : null;

  const save = () => {
    if (!draft || !estimate) { setError('Choisis une activité et une durée pour estimer la séance.'); return; }
    const record: ActivitySession = { ...draft, id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    try {
      recordActivity(record);
      setPraise(sessionPraise({
        kind: record.kind, minutes: record.minutes, activeKcal: estimate.activeKcal, assumedWeight: estimate.assumedWeight,
        journal: { ...activity, sessions: [record, ...activity.sessions] }, day, id: record.id,
      }));
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'La séance n’a pas pu être enregistrée.');
    }
  };

  if (praise) {
    return (
      <View style={styles.wrap}>
        <PraiseCard praise={praise} tone="mint" onClose={() => setPraise(null)} />
        <MotionPressable
          onPress={() => { setPraise(null); start(); }}
          accessibilityRole="button"
          style={styles.link}
        >
          <AppIcon name="plus" size={16} color={colors.violet} strokeWidth={2.4} />
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.linkText}>Ajouter une autre activité</Text>
        </MotionPressable>
      </View>
    );
  }

  /* --- Au repos : un bouton, comme « Ajouter un repas ». ------------------ */
  if (!editing) {
    return (
      <View style={styles.wrap}>
        <MotionPressable onPress={start} accessibilityRole="button" style={styles.primary}>
          <AppIcon name="plus" size={21} color={colors.white} strokeWidth={2.6} />
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.primaryText}>Ajouter une activité</Text>
        </MotionPressable>
        {/* La promesse du bloc tient en une ligne. Elle remplace l'ancienne
            phrase pré-remplie : elle annonce le calcul sans rien inventer. */}
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.pitch}>
          Ton sport et sa durée : l’application estime les calories dépensées.
        </Text>
      </View>
    );
  }

  /* --- Une fois touché : la phrase à remplir. ----------------------------- */
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.question}>Combien ai-je dépensé ?</Text>

        <Text maxFontSizeMultiplier={1.4} style={styles.sentence}>
          {'J’ai fait '}
          <Text
            onPress={() => setOpen(open === 'kind' ? null : 'kind')}
            accessibilityRole="button"
            accessibilityLabel={kind === null ? 'Choisir l’activité' : `Activité : ${ACTIVITY_LABELS[kind]}. Appuie pour changer.`}
            style={kind === null ? styles.blank : styles.token}
          >
            {kind === null ? 'quelle activité ?' : ACTIVITY_PHRASES[kind]}
          </Text>
          {' pendant '}
          <Text
            onPress={() => setOpen(open === 'minutes' ? null : 'minutes')}
            accessibilityRole="button"
            accessibilityLabel={minutes === null ? 'Choisir la durée' : `Durée : ${minutes} minutes. Appuie pour changer.`}
            style={minutes === null ? styles.blank : styles.token}
          >
            {minutes === null ? 'combien de temps ?' : `${minutes} min`}
          </Text>
        </Text>

        {open === 'kind' ? (
          <View style={styles.chips}>
            {QUICK_KINDS.map(item => (
              <MotionPressable
                key={item}
                onPress={() => {
                  setKind(item);
                  setError('');
                  // On enchaîne sur la durée tant qu'elle manque ; si elle est
                  // déjà là, on referme et le chiffre s'affiche.
                  setOpen(minutes === null ? 'minutes' : null);
                }}
                accessibilityRole="radio"
                accessibilityLabel={ACTIVITY_LABELS[item]}
                accessibilityState={{ selected: kind === item }}
                style={[styles.chip, kind === item && styles.chipOn]}
              >
                <Text maxFontSizeMultiplier={1.3} style={[styles.chipText, kind === item && styles.chipTextOn]}>{SHORT_LABELS[item] ?? ACTIVITY_LABELS[item]}</Text>
              </MotionPressable>
            ))}
          </View>
        ) : null}

        {open === 'minutes' ? (
          <View style={styles.chips}>
            {DURATIONS.map(value => (
              <MotionPressable
                key={value}
                onPress={() => {
                  setMinutes(value);
                  setError('');
                  setOpen(kind === null ? 'kind' : null);
                }}
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

        {/* Tant qu'un blanc est vide, aucun chiffre : ni zéro, ni exemple. */}
        {estimate ? (
          <View style={styles.result} accessibilityLiveRegion="polite">
            <Text maxFontSizeMultiplier={1.25} style={styles.number}>
              ≈ {estimate.activeKcal.toLocaleString('fr-FR')}
            </Text>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.unit}>kilocalories dépensées</Text>
          </View>
        ) : null}

        {estimate ? (
          <MotionPressable onPress={save} accessibilityRole="button" style={styles.save}>
            <AppIcon name="check" size={18} color={colors.white} strokeWidth={2.6} />
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.saveText}>Enregistrer cette séance</Text>
          </MotionPressable>
        ) : null}

        {error ? <Text accessibilityRole="alert" maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.error}>{error}</Text> : null}

        <MotionPressable onPress={reset} accessibilityRole="button" style={styles.cancel}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.cancelText}>Annuler</Text>
        </MotionPressable>
      </View>

      {assumed && estimate ? (
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
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, minHeight: 54, borderRadius: radii.large, backgroundColor: colors.violet, ...shadows.raised },
  primaryText: { color: colors.white, fontSize: 16, lineHeight: 22, fontFamily: fonts.bold },
  pitch: { color: colors.muted, textAlign: 'center', ...typeScale.caption },
  card: { backgroundColor: colors.card, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 14, ...shadows.card },
  question: { color: colors.ink, ...typeScale.section },
  sentence: { color: colors.inkSoft, fontSize: 18, lineHeight: 30, fontFamily: fonts.medium },
  token: { color: colors.violet, fontFamily: fonts.extrabold, textDecorationLine: 'underline' },
  // Un blanc vide : souligné comme un mot rempli, mais en gris, pour qu'on
  // voie tout de suite qu'il reste quelque chose à dire. Pas d'italique : la
  // police chargée n'en a pas, et React Native l'ignorerait en silence.
  blank: { color: colors.muted, fontFamily: fonts.semibold, textDecorationLine: 'underline' },
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
  cancel: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: colors.muted, fontSize: 14, lineHeight: 20, fontFamily: fonts.semibold },
  note: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.warmPale, borderRadius: radii.input, paddingHorizontal: 11, paddingVertical: 9 },
  noteText: { flex: 1, color: colors.warmInk, ...typeScale.caption },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44 },
  linkText: { color: colors.violet, fontSize: 14, lineHeight: 20, fontFamily: fonts.bold },
});
