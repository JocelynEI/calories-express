import React, { useRef, useState } from 'react';
import { Linking, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { compareIntake, goalMismatch, kcal } from '../domain/energy';
import { dailyEnergyPlan } from '../domain/activity-energy';
import { useApp } from '../state/AppContext';
import { useExperience } from '../state/ExperienceContext';
import { colors, radii, fonts } from '../theme';
import { Profile } from '../types';
import { AppIcon } from './AppIcon';
import { GuideCard } from './GuideCard';
import { Entrance, MotionPressable } from './Motion';

export function EnergyPlanCard({ profile, draft = false }: { profile: Profile; draft?: boolean }) {
  const [open, setOpen] = useState(false);
  const { activity, today, profileCompleted } = useApp();
  const plan = dailyEnergyPlan(profile, activity, today, draft || profileCompleted);
  const issue = plan.issue;
  const mismatch = !issue ? goalMismatch(profile) : null;
  return <View style={styles.planCard}>
    <View style={styles.cardHeading}><AppIcon name="target" size={18} color={colors.sageDark} /><Text style={styles.cardTitle}>{draft ? 'Comprendre ce repère' : 'Ton objectif expliqué'}</Text></View>
    {!issue ? <>
      <View style={styles.planRow}><View style={styles.rowCopy}><Text style={styles.label}>Maintien estimé</Text><Text style={styles.small}>{plan.dynamic ? 'Base calme + activité supplémentaire' : 'Besoins avec ton activité habituelle'}</Text></View><Text style={styles.number}>{kcal(plan.maintenance)} <Text style={styles.unit}>kcal</Text></Text></View>
      <View style={styles.planRow}><View style={styles.rowCopy}><Text style={styles.label}>Objectif alimentaire</Text><Text style={styles.small}>{profile.targetMode === 'manual' ? 'La valeur que tu as choisie' : 'Le repère utilisé par le baromètre'}</Text></View><Text style={[styles.number, { color: colors.sageDark }]}>{kcal(plan.target)} <Text style={styles.unit}>kcal</Text></Text></View>
      {plan.dynamic && <Text style={styles.copy}>Repère du jour : {kcal(plan.baseTarget)} kcal de base + {kcal(plan.creditedKcal)} kcal actives prises en compte = {kcal(plan.target)} kcal.</Text>}
      <View style={styles.explanation}>
        <Text style={styles.explanationTitle}>{plan.direction === 'deficit' ? `Déficit prévu : ${kcal(plan.plannedDifference)} kcal` : plan.direction === 'surplus' ? `Apport prévu en plus : ${kcal(-plan.plannedDifference)} kcal` : 'Objectif de maintien'}</Text>
        <Text style={styles.copy}>{plan.direction === 'deficit'
          ? 'Cet écart est déjà inclus dans ton objectif alimentaire. Il ne faut pas le retirer une deuxième fois.'
          : plan.direction === 'surplus' ? 'Cet écart est déjà ajouté au maintien estimé. La valeur du baromètre est ton repère final.'
            : 'Ton objectif alimentaire correspond ici à tes besoins estimés pour maintenir ton poids.'}</Text>
      </View>
      {mismatch && <Text style={styles.caution}>{mismatch}</Text>}
    </> : <Text style={styles.copy}>{issue}</Text>}
    <MotionPressable onPress={() => setOpen(true)} accessibilityRole="button" style={styles.learnButton}><Text style={styles.learnText}>Jaws m’explique le déficit</Text><AppIcon name="chevron" size={17} color={colors.sageDark} /></MotionPressable>
    {open && <EnergyEducation onClose={() => setOpen(false)} />}
  </View>;
}

const stepNames = ['Comprendre', 'Un exemple', 'Au quotidien'];
const guidance = [
  'Le maintien, c’est l’énergie dont ton corps a besoin sur une journée, en comptant ton activité habituelle. On l’estime avec ton profil.',
  'Compare les repas au maintien pour comprendre le bilan énergétique. Le baromètre, lui, les compare à ton objectif alimentaire.',
  'L’idée est de trouver des habitudes que tu peux garder. Une journée différente ne demande pas de punition le lendemain.',
];

export function EnergyEducation({ onClose }: { onClose: () => void }) {
  const { reducedMotion } = useExperience();
  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState(2200);
  const [sourceError, setSourceError] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const example = compareIntake(intake, 2100, 2400);
  const goTo = (next: number) => { setStep(next); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const openSource = (url: string) => { setSourceError(false); void Linking.openURL(url).catch(() => setSourceError(true)); };

  return <Modal visible animationType={reducedMotion ? 'none' : 'slide'} presentationStyle="pageSheet" onRequestClose={onClose}>
    <SafeAreaProvider>
    <SafeAreaView style={styles.modal}>
      <View style={styles.modalHeader}><View><Text style={styles.eyebrow}>LES REPÈRES DE JAWS</Text><Text style={styles.modalTitle}>Le déficit, simplement.</Text></View><MotionPressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer les explications" style={styles.close}><Text style={styles.closeText}>×</Text></MotionPressable></View>
      <View style={styles.tabs}>{stepNames.map((label, index) => <MotionPressable key={label} onPress={() => goTo(index)} accessibilityRole="tab" accessibilityState={{ selected: step === index }} containerStyle={{ flex: 1 }} style={[styles.tab, step === index && styles.tabActive]}><Text style={[styles.tabText, step === index && styles.tabTextActive]}>{index + 1}. {label}</Text></MotionPressable>)}</View>
      <ScrollView ref={scroll} contentContainerStyle={styles.modalContent}>
        <GuideCard compact message={guidance[step]} />
        <Entrance key={step} style={styles.lesson}>
          {step === 0 && <>
            <Text style={styles.lessonTitle}>Trois chiffres, trois rôles.</Text>
            <Definition number="1" title="Le maintien estimé" copy="Il comprend le repos et le mouvement. En mode fixe, le profil inclut ton activité habituelle. En mode ajusté, une base calme reçoit les pas et les séances supplémentaires sans les compter deux fois. Ce sont des estimations." />
            <Definition number="2" title="L’objectif alimentaire" copy="C’est ton repère pour les repas de la journée. Pour une perte de poids, on vise généralement un apport inférieur au maintien, adapté à ta situation." />
            <Definition number="3" title="Les calories saisies" copy="C’est le total des repas enregistrés. Un repas oublié ou une portion imprécise change ce total." />
            <View style={styles.formula}><Text style={styles.formulaText}>Maintien − objectif alimentaire</Text><Text style={styles.formulaResult}>= déficit prévu</Text></View>
            <Text style={styles.copy}>Dans le calcul automatique de cette version, la perte utilise un ajustement de −300 kcal. C’est un point de départ à personnaliser, pas une prescription ni une promesse de résultat.</Text>
            <Text style={styles.copy}>En cours de journée, les calories « avant le repère » sont simplement la différence avec l’objectif alimentaire. Elles ne représentent pas ton déficit réel.</Text>
          </>}
          {step === 1 && <>
            <Text style={styles.lessonTitle}>Et si je dépasse mon objectif ?</Text>
            <Text style={styles.copy}>Exemple fictif d’une journée complète, avec tous les repas saisis. Choisis un total pour voir ce qui change.</Text>
            <View style={styles.exampleChoice}>{[2100, 2200, 2500].map(value => <MotionPressable key={value} onPress={() => setIntake(value)} accessibilityRole="button" accessibilityState={{ selected: intake === value }} accessibilityLabel={`Exemple à ${value} kilocalories`} containerStyle={{ flex: 1 }} style={[styles.choice, intake === value && styles.choiceActive]}><Text style={[styles.choiceText, intake === value && styles.choiceTextActive]}>{kcal(value)}</Text><Text style={[styles.choiceUnit, intake === value && styles.choiceTextActive]}>kcal saisies</Text></MotionPressable>)}</View>
            <View style={styles.exampleBars}>
              <ExampleBar label="Maintien estimé" value={2400} color={colors.reference} />
              <ExampleBar label="Objectif alimentaire" value={2100} color={colors.today} />
              <ExampleBar label="Repas de la journée" value={intake} color={colors.intake} />
            </View>
            <View style={styles.exampleResult} accessibilityLiveRegion="polite">
              <Text style={styles.explanationTitle}>{example.toTarget === 0 ? 'Au niveau de l’objectif alimentaire' : `${kcal(Math.abs(example.toTarget))} kcal au-dessus de l’objectif`}</Text>
              <Text style={styles.copy}>{example.toMaintenance > 0
                ? `Mais ${kcal(example.toMaintenance)} kcal en dessous du maintien estimé : un déficit de ${kcal(example.toMaintenance)} kcal dans cet exemple.`
                : `${kcal(-example.toMaintenance)} kcal au-dessus du maintien estimé : un excédent dans cet exemple.`}</Text>
            </View>
            <Text style={styles.copy}>À 2 200 kcal, tu dépasses donc l’objectif de 100 kcal tout en restant 200 kcal sous le maintien. Les deux comparaisons ne racontent pas la même chose.</Text>
            <Text style={styles.note}>Tes besoins et les portions sont estimés. Cet exemple ne permet pas de prédire une variation précise de poids.</Text>
          </>}
          {step === 2 && <>
            <Text style={styles.lessonTitle}>De petits ajustements durables.</Text>
            <Definition number="1" title="Vérifier avant d’ajuster" copy="Regarde les portions, les boissons et les ajouts comme les sauces. Compare plusieurs journées complètes, pas seulement un repas." />
            <Definition number="2" title="Choisir une habitude simple" copy="Par exemple : remplacer une boisson sucrée par de l’eau, varier les légumes et les sources de protéines, ou adapter une portion à ta faim." />
            <Definition number="3" title="Bouger à ton rythme" copy="Marche, déplacements actifs ou activité qui te plaît : commence progressivement, selon tes capacités. En mode fixe, ton activité habituelle est déjà comptée. En mode ajusté, saisis les séances réellement faites sans compter deux fois la même marche." />
            <Definition number="4" title="Garder des repas réguliers" copy="Après un dépassement, reprends ton rythme habituel. Inutile de sauter un repas ou d’ajouter du sport pour compenser." />
            <View style={styles.explanation}><Text style={styles.explanationTitle}>Et si ça ne me convient pas ?</Text><Text style={styles.copy}>Faim persistante, fatigue ou objectif difficile à tenir : revois le repère avec un professionnel. Le poids peut fluctuer ; évite de réduire davantage les apports après une seule pesée.</Text></View>
            <Text style={styles.note}>Ces estimations s’adressent aux adultes. Elles ne sont pas adaptées à la grossesse ou à l’allaitement. Un professionnel peut tenir compte de ta situation et de ta santé.</Text>
            <Text style={styles.sourceTitle}>Pour aller plus loin</Text>
            <MotionPressable accessibilityRole="link" onPress={() => openSource('https://www.ameli.fr/assure/sante/themes/surpoids-obesite-adulte/modifier-quotidien')} style={styles.source}><Text style={styles.learnText}>Assurance Maladie · les habitudes au quotidien ↗</Text></MotionPressable>
            <MotionPressable accessibilityRole="link" onPress={() => openSource('https://www.niddk.nih.gov/bwp')} style={styles.source}><Text style={styles.learnText}>NIDDK · besoins et bilan énergétique (anglais) ↗</Text></MotionPressable>
            {sourceError && <Text style={styles.note}>Le lien n’a pas pu s’ouvrir. Tu peux consulter ameli.fr ou niddk.nih.gov dans ton navigateur.</Text>}
          </>}
        </Entrance>
        <MotionPressable accessibilityRole="button" onPress={() => step < 2 ? goTo(step + 1) : onClose()} style={styles.continue}><Text style={styles.continueText}>{step < 2 ? 'Continuer' : 'J’ai compris'}</Text><AppIcon name="chevron" size={18} color={colors.white} /></MotionPressable>
      </ScrollView>
    </SafeAreaView>
    </SafeAreaProvider>
  </Modal>;
}

function Definition({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <View style={styles.definition}><View style={styles.definitionNumber}><Text style={styles.definitionDigit}>{number}</Text></View><View style={styles.rowCopy}><Text style={styles.definitionTitle}>{title}</Text><Text style={styles.copy}>{copy}</Text></View></View>;
}

function ExampleBar({ label, value, color }: { label: string; value: number; color: string }) {
  return <View><View style={styles.barHeader}><Text style={styles.label}>{label}</Text><Text style={styles.number}>{kcal(value)}</Text></View><View style={styles.barTrack}><View style={[styles.bar, { width: `${value / 2600 * 100}%`, backgroundColor: color }]} /></View></View>;
}

const styles = StyleSheet.create({
  planCard: { backgroundColor: colors.white, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, padding: 16, marginTop: 16, gap: 13 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: colors.navy, fontSize: 15, fontFamily: fonts.bold },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowCopy: { flex: 1, minWidth: 0 },
  label: { color: colors.inkSoft, fontSize: 12, fontFamily: fonts.semibold, flexShrink: 1 },
  small: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium, lineHeight: 15, marginTop: 2 },
  number: { color: colors.navy, fontSize: 16, fontFamily: fonts.extrabold },
  unit: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium },
  explanation: { backgroundColor: colors.aquaPale, padding: 13, borderRadius: 16, gap: 5 },
  explanationTitle: { color: colors.navy, fontSize: 13, lineHeight: 18, fontFamily: fonts.extrabold },
  copy: { color: colors.inkSoft, fontSize: 13, fontFamily: fonts.medium, lineHeight: 19 },
  caution: { backgroundColor: colors.goldPale, borderRadius: 12, padding: 12, color: colors.inkSoft, fontSize: 12, fontFamily: fonts.medium, lineHeight: 18 },
  learnButton: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, minHeight: 44, alignItems: 'center', borderTopColor: colors.line, borderTopWidth: 1, paddingTop: 4 },
  learnText: { color: colors.sageDark, fontSize: 12, fontFamily: fonts.bold, flexShrink: 1, lineHeight: 18 },
  modal: { flex: 1, backgroundColor: colors.background, width: '100%', maxWidth: 520, alignSelf: 'center' },
  modalHeader: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eyebrow: { color: colors.sageDark, fontSize: 12, fontFamily: fonts.extrabold, letterSpacing: 1.6 },
  modalTitle: { color: colors.navy, fontSize: 21, fontFamily: fonts.extrabold, letterSpacing: -0.6, marginTop: 6 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.navy, fontSize: 27, fontFamily: fonts.medium },
  tabs: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 13, backgroundColor: colors.line, padding: 3, gap: 2 },
  tab: { minHeight: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2 },
  tabActive: { backgroundColor: colors.white },
  tabText: { color: colors.inkSoft, fontSize: 12, fontFamily: fonts.semibold },
  tabTextActive: { color: colors.sageDark, fontFamily: fonts.extrabold },
  modalContent: { padding: 20, paddingBottom: 30, gap: 20 },
  lesson: { gap: 17 },
  lessonTitle: { color: colors.navy, fontSize: 20, lineHeight: 26, fontFamily: fonts.extrabold, letterSpacing: -0.4 },
  definition: { flexDirection: 'row', gap: 10 },
  definitionNumber: { backgroundColor: colors.violetPale, width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  definitionDigit: { color: colors.sageDark, fontSize: 12, fontFamily: fonts.extrabold },
  definitionTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.navy, marginBottom: 4 },
  formula: { backgroundColor: colors.navy, padding: 18, borderRadius: 18, gap: 7 },
  formulaText: { color: '#DEDDFF', fontSize: 13, fontFamily: fonts.medium },
  formulaResult: { color: colors.white, fontSize: 20, fontFamily: fonts.extrabold },
  exampleChoice: { flexDirection: 'row', gap: 8 },
  choice: { minHeight: 61, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 3 },
  choiceActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  choiceText: { color: colors.ink, fontSize: 17, fontFamily: fonts.extrabold },
  choiceUnit: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium },
  choiceTextActive: { color: colors.white },
  exampleBars: { backgroundColor: colors.white, borderRadius: 20, padding: 16, gap: 17 },
  barHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 },
  barTrack: { height: 9, borderRadius: 5, backgroundColor: colors.line, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 5 },
  exampleResult: { backgroundColor: colors.aquaPale, borderRadius: 17, padding: 15, gap: 8 },
  note: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium, lineHeight: 18 },
  sourceTitle: { color: colors.inkSoft, fontSize: 12, fontFamily: fonts.bold },
  source: { minHeight: 44, justifyContent: 'center' },
  continue: { minHeight: 50, borderRadius: 16, backgroundColor: colors.violet, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  continueText: { color: colors.white, fontFamily: fonts.extrabold, fontSize: 14 },
});
