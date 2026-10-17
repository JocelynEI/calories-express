import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { macroTargets } from '../domain/calories';
import { dailyEnergyPlan } from '../domain/activity-energy';
import {
  goalsFromPreset, goalsKcal, MACRO_GOAL_LIMITS, MACRO_PRESETS, MacroGoals, macroGoalsIssue,
} from '../domain/premium';
import { useApp } from '../state/AppContext';
import { colors, fonts, MAX_FONT_SCALE, radii } from '../theme';
import { AppIcon } from './AppIcon';
import { GhostBars, PremiumLock } from './PremiumLock';
import { MotionPressable } from './Motion';

const FIELDS: { key: keyof MacroGoals; label: string }[] = [
  { key: 'protein', label: 'Protéines' }, { key: 'carbs', label: 'Glucides' }, { key: 'fat', label: 'Lipides' },
];

/**
 * V5.0 — « Objectifs de macros ».
 *
 * Gratuit : les repères automatiques restent affichés partout, inchangés.
 * Premium : la personne fixe ses propres grammes, qui les remplacent sur
 * l'accueil et dans le bilan. Revenir aux repères automatiques est un appui.
 */
export function MacroGoalsSection() {
  const { premium, profile, activity, today, profileCompleted, macroGoals, saveMacroGoals } = useApp();

  if (!premium.unlocked) {
    return (
      <PremiumLock
        feature="objectifs"
        icon="target"
        title="Tes objectifs de macros"
        copy="Fixe toi-même tes grammes de protéines, glucides et lipides. Les repères automatiques restent affichés en attendant."
        preview={<GhostBars heights={[34, 52, 24]} />}
      />
    );
  }
  return <Editor profile={profile} activity={activity} today={today} profileCompleted={profileCompleted} macroGoals={macroGoals} onSave={saveMacroGoals} />;
}

function Editor({ profile, activity, today, profileCompleted, macroGoals, onSave }: {
  profile: ReturnType<typeof useApp>['profile']; activity: ReturnType<typeof useApp>['activity']; today: string;
  profileCompleted: boolean; macroGoals: MacroGoals | null; onSave: (goals: MacroGoals | null) => void;
}) {
  const plan = dailyEnergyPlan(profile, activity, today, profileCompleted);
  const target = plan.issue ? 0 : plan.target;
  const automatic = useMemo(() => macroTargets(profile, target), [profile, target]);
  const start = macroGoals ?? automatic;

  const [draft, setDraft] = useState<Record<keyof MacroGoals, string>>({
    protein: String(start.protein), carbs: String(start.carbs), fat: String(start.fat),
  });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  // Quand les objectifs changent ailleurs (retour aux automatiques), le formulaire suit.
  useEffect(() => {
    setDraft({ protein: String(start.protein), carbs: String(start.carbs), fat: String(start.fat) });
  }, [start.protein, start.carbs, start.fat]);

  const parsed: MacroGoals = {
    protein: Number(draft.protein.replace(',', '.')), carbs: Number(draft.carbs.replace(',', '.')), fat: Number(draft.fat.replace(',', '.')),
  };
  const issue = macroGoalsIssue(parsed);
  const kcal = issue ? null : goalsKcal(parsed);
  const far = kcal !== null && target > 0 && Math.abs(kcal - target) / target > 0.1;

  const edit = (key: keyof MacroGoals, value: string) => {
    setDraft(current => ({ ...current, [key]: value.replace(/[^0-9.,]/g, '') }));
    setSaved(false); setError('');
  };
  const usePreset = (index: number) => {
    if (target <= 0) { setError('Enregistre d’abord ton profil : un modèle part de ton repère calorique.'); return; }
    const goals = goalsFromPreset(target, MACRO_PRESETS[index]);
    setDraft({ protein: String(goals.protein), carbs: String(goals.carbs), fat: String(goals.fat) });
    setSaved(false); setError('');
  };
  const save = () => {
    if (issue) { setError(issue); return; }
    onSave(parsed); setSaved(true);
  };
  const reset = () => { onSave(null); setSaved(false); setError(''); };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>Tes objectifs de macros</Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.sub}>
          {macroGoals ? 'Tes grammes remplacent les repères automatiques sur l’accueil et dans le bilan.' : 'Pour l’instant, les repères automatiques sont utilisés.'}
        </Text>
      </View>

      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.label}>Partir d’un modèle</Text>
      <View style={styles.presets}>
        {MACRO_PRESETS.map((preset, index) => (
          <MotionPressable
            key={preset.id}
            onPress={() => usePreset(index)}
            accessibilityRole="button"
            accessibilityLabel={`Modèle ${preset.label}, ${preset.detail}`}
            containerStyle={styles.presetOuter}
            style={styles.preset}
          >
            <Text maxFontSizeMultiplier={1.3} style={styles.presetLabel}>{preset.label}</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.presetDetail}>{preset.detail}</Text>
          </MotionPressable>
        ))}
      </View>

      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.label}>ou tes grammes par jour</Text>
      <View style={styles.fields}>
        {FIELDS.map(field => (
          <View key={field.key} style={styles.field}>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.fieldLabel}>{field.label}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={draft[field.key]}
                onChangeText={value => edit(field.key, value)}
                keyboardType="number-pad"
                maxLength={4}
                accessibilityLabel={`${field.label} en grammes par jour`}
                style={styles.input}
              />
              <Text style={styles.suffix}>g</Text>
            </View>
          </View>
        ))}
      </View>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.help}>Entre {MACRO_GOAL_LIMITS.min} et {MACRO_GOAL_LIMITS.max} g pour chacun.</Text>

      {kcal !== null && (
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.help}>
          Ces grammes font environ {kcal.toLocaleString('fr-FR')} kcal{target > 0 ? `, pour un repère de ${target.toLocaleString('fr-FR')} kcal` : ''}.
          {far ? ' Les deux peuvent différer : rien n’est bloqué.' : ''}
        </Text>
      )}

      <MotionPressable onPress={save} accessibilityRole="button" style={styles.save}>
        {saved && <AppIcon name="check" size={18} color={colors.white} strokeWidth={2.3} />}
        <Text maxFontSizeMultiplier={1.4} style={styles.saveText}>{saved ? 'Objectifs enregistrés' : 'Enregistrer mes objectifs'}</Text>
      </MotionPressable>
      {macroGoals ? (
        <MotionPressable onPress={reset} accessibilityRole="button" style={styles.reset}>
          <Text maxFontSizeMultiplier={1.4} style={styles.resetText}>Revenir aux repères automatiques</Text>
        </MotionPressable>
      ) : null}
      {error ? <Text accessibilityRole="alert" maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 10 },
  head: { gap: 3 },
  title: { color: colors.ink, fontSize: 17, fontFamily: fonts.extrabold, letterSpacing: -0.2 },
  sub: { color: colors.muted, fontSize: 13, lineHeight: 19, fontFamily: fonts.medium },
  label: { color: colors.inkSoft, fontSize: 13, fontFamily: fonts.bold, marginTop: 4 },
  presets: { flexDirection: 'row', gap: 8 },
  presetOuter: { flex: 1 },
  preset: { minHeight: 62, borderRadius: radii.medium, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 8, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', gap: 2 },
  presetLabel: { color: colors.ink, fontSize: 13, fontFamily: fonts.extrabold, textAlign: 'center' },
  presetDetail: { color: colors.muted, fontSize: 11, fontFamily: fonts.semibold, textAlign: 'center' },
  fields: { flexDirection: 'row', gap: 10 },
  field: { flex: 1, gap: 5 },
  fieldLabel: { color: colors.inkSoft, fontSize: 12, fontFamily: fonts.bold },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.fieldEdge, borderRadius: radii.medium, paddingHorizontal: 10, minHeight: 48 },
  input: { flex: 1, color: colors.ink, fontSize: 18, fontFamily: fonts.extrabold, paddingVertical: 8, minWidth: 0 },
  suffix: { color: colors.muted, fontSize: 14, fontFamily: fonts.bold },
  help: { color: colors.muted, fontSize: 12, lineHeight: 18, fontFamily: fonts.medium },
  save: { flexDirection: 'row', gap: 8, backgroundColor: colors.violet, borderRadius: radii.large, minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveText: { color: colors.white, fontSize: 16, fontFamily: fonts.extrabold },
  reset: { alignItems: 'center', paddingVertical: 10 },
  resetText: { color: colors.violet, fontSize: 14, fontFamily: fonts.bold, textDecorationLine: 'underline' },
  error: { backgroundColor: '#FFF1D9', color: '#75510D', padding: 12, borderRadius: 12, fontSize: 13, fontFamily: fonts.medium, lineHeight: 18 },
});
