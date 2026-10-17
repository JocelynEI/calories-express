import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import {
  applyTemplate, MAX_TEMPLATE_NAME, suggestedTemplateName, templateFromDay, templateIssue, templateLine,
} from '../domain/day-template';
import { dayLabel } from '../domain/date';
import { mealsForDay } from '../domain/meals';
import { useApp } from '../state/AppContext';
import { colors, fonts, MAX_FONT_SCALE, radii } from '../theme';
import { AppIcon } from './AppIcon';
import { MotionPressable } from './Motion';
import { GhostBars, PremiumLock } from './PremiumLock';

/**
 * V5.0 (premium) — « Ma journée type » sur l'accueil.
 *
 * Juste sous « Refaire un repas habituel », qui reste gratuit : là c'est un
 * repas, ici la journée entière. Le bloc verrouillé n'apparaît que lorsque la
 * personne a déjà de quoi en faire un modèle — proposer d'enregistrer une
 * journée vide n'aurait aucun sens.
 */
const MIN_MEALS_TO_OFFER = 3;

export function DayTemplates() {
  const { premium, meals, selectedDay, today, dayTemplates, saveDayTemplate, forgetDayTemplate, addMeals } = useApp();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const dayMeals = useMemo(() => mealsForDay(meals, selectedDay).filter(meal => !meal.id.startsWith('demo-')), [meals, selectedDay]);
  const own = useMemo(() => meals.filter(meal => !meal.id.startsWith('demo-')), [meals]);

  if (!premium.unlocked) {
    if (own.length < MIN_MEALS_TO_OFFER && dayTemplates.length === 0) return null;
    return (
      <PremiumLock
        feature="journee"
        icon="repeat"
        title="Ma journée type"
        copy="Enregistre une journée entière et rejoue-la en un appui, au lieu de ressaisir chaque repas."
        preview={<GhostBars heights={[26, 44, 20, 38]} />}
      />
    );
  }

  const save = () => {
    const issue = templateIssue(dayTemplates, name, dayMeals.length);
    if (issue) { setError(issue); return; }
    const template = templateFromDay(meals, selectedDay, name);
    if (!template) { setError('Cette journée ne contient aucun repas à enregistrer.'); return; }
    saveDayTemplate(template);
    setNaming(false); setError(''); setNotice(`« ${template.name} » enregistrée.`);
  };

  const apply = (id: string) => {
    const template = dayTemplates.find(entry => entry.id === id);
    if (!template) return;
    const added = applyTemplate(template, selectedDay);
    addMeals(added);
    setNotice(`${added.length} repas ajoutés à ${dayLabel(selectedDay, today).toLocaleLowerCase('fr-FR')}.`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}><AppIcon name="repeat" size={20} color={colors.violet} strokeWidth={2.1} /></View>
        <View style={{ flex: 1 }}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>Ma journée type</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.sub}>Une journée entière, replacée en un appui.</Text>
        </View>
      </View>

      {dayTemplates.map(template => (
        <View key={template.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.rowName} numberOfLines={1}>{template.name}</Text>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.rowLine}>{templateLine(template)}</Text>
          </View>
          <MotionPressable
            onPress={() => apply(template.id)}
            accessibilityRole="button"
            accessibilityLabel={`Ajouter ${template.name} : ${templateLine(template)}`}
            style={styles.add}
          >
            <Text maxFontSizeMultiplier={1.3} style={styles.addText}>Ajouter</Text>
          </MotionPressable>
          <MotionPressable
            onPress={() => { forgetDayTemplate(template.id); setNotice(`« ${template.name} » supprimée.`); }}
            accessibilityRole="button"
            accessibilityLabel={`Supprimer la journée type ${template.name}`}
            style={styles.remove}
          >
            <AppIcon name="trash" size={17} color={colors.coral} strokeWidth={2} />
          </MotionPressable>
        </View>
      ))}

      {naming ? (
        <View style={styles.form}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.formLabel}>Nom de cette journée type</Text>
          <TextInput
            value={name}
            onChangeText={value => { setName(value); setError(''); }}
            maxLength={MAX_TEMPLATE_NAME}
            accessibilityLabel="Nom de cette journée type"
            style={styles.input}
          />
          <View style={styles.formRow}>
            <MotionPressable onPress={save} accessibilityRole="button" containerStyle={{ flex: 1 }} style={styles.primary}>
              <Text maxFontSizeMultiplier={1.3} style={styles.primaryText}>Enregistrer</Text>
            </MotionPressable>
            <MotionPressable onPress={() => { setNaming(false); setError(''); }} accessibilityRole="button" containerStyle={{ flex: 1 }} style={styles.secondary}>
              <Text maxFontSizeMultiplier={1.3} style={styles.secondaryText}>Annuler</Text>
            </MotionPressable>
          </View>
        </View>
      ) : dayMeals.length > 0 ? (
        <MotionPressable
          onPress={() => { setName(suggestedTemplateName(dayTemplates)); setNaming(true); setNotice(''); }}
          accessibilityRole="button"
          accessibilityLabel={`Enregistrer ${dayLabel(selectedDay, today).toLocaleLowerCase('fr-FR')} comme journée type, ${dayMeals.length} repas`}
          style={styles.link}
        >
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.linkText}>
            Enregistrer cette journée ({dayMeals.length} repas) comme modèle
          </Text>
        </MotionPressable>
      ) : dayTemplates.length === 0 ? (
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.sub}>
          Note les repas d’une journée, puis reviens ici pour l’enregistrer comme modèle.
        </Text>
      ) : null}

      {dayTemplates.length > 0 && dayMeals.length > 0 && (
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.warn}>
          Cette journée contient déjà {dayMeals.length} repas. Ceux d’un modèle s’ajouteront aux siens, sans les remplacer.
        </Text>
      )}

      {error ? <Text accessibilityRole="alert" maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.error}>{error}</Text> : null}
      {notice ? <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.notice}>{notice}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.sagePale, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.ink, fontSize: 17, fontFamily: fonts.extrabold, letterSpacing: -0.2 },
  sub: { color: colors.muted, fontSize: 13, lineHeight: 19, fontFamily: fonts.medium, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  rowName: { color: colors.ink, fontSize: 15, fontFamily: fonts.bold },
  rowLine: { color: colors.muted, fontSize: 12, fontFamily: fonts.semibold, marginTop: 2 },
  add: { minHeight: 44, paddingHorizontal: 16, borderRadius: radii.pill, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  addText: { color: colors.white, fontSize: 14, fontFamily: fonts.extrabold },
  remove: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coralPale },
  form: { gap: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  formLabel: { color: colors.inkSoft, fontSize: 13, fontFamily: fonts.bold },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.fieldEdge, borderRadius: radii.medium, paddingHorizontal: 12, minHeight: 48, color: colors.ink, fontSize: 16, fontFamily: fonts.semibold },
  formRow: { flexDirection: 'row', gap: 10 },
  primary: { minHeight: 48, borderRadius: radii.medium, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.white, fontSize: 15, fontFamily: fonts.extrabold },
  secondary: { minHeight: 48, borderRadius: radii.medium, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.inkSoft, fontSize: 15, fontFamily: fonts.bold },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { color: colors.violet, fontSize: 14, fontFamily: fonts.extrabold },
  warn: { color: colors.muted, fontSize: 12, lineHeight: 18, fontFamily: fonts.medium },
  error: { backgroundColor: '#FFF1D9', color: '#75510D', padding: 12, borderRadius: 12, fontSize: 13, fontFamily: fonts.medium, lineHeight: 18 },
  notice: { color: colors.greenInk, fontSize: 13, fontFamily: fonts.semibold },
});
