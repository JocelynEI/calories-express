import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ACTIVITY_IDEAS, ACTIVITY_LABELS, saveSession, setDaySteps, setDayEnergy } from '../domain/activity';
import { dailyEnergyPlan, sessionEnergy, sessionEnergyIssue, stepEnergy, DEFAULT_BASELINE_STEPS, validActivityWeight } from '../domain/activity-energy';
import { dayKey } from '../domain/date';
import { kcal } from '../domain/energy';
import { readNumber } from '../domain/foods';
import { useApp } from '../state/AppContext';
import { useExperience } from '../state/ExperienceContext';
import { colors, fonts } from '../theme';
import { ActivityKind, ActivitySession, ReportedDayEnergy } from '../types';
import { Action, Choice, Field, form } from './FormControls';
import { GuideCard } from './GuideCard';
import { MotionPressable } from './Motion';
import { ActivityCelebration, ActivityFeedback } from './ActivityCelebration';
import { ActivityBalance } from './ActivityBalance';
import { SessionEntryForm } from './SessionEntryForm';
import { DayEnergyForm } from './DayEnergyForm';
import { GoalPicker } from './GoalPicker';

type Panel = 'session' | 'steps' | 'watch';
type Props = { onClose: () => void; onSettings: () => void; initialTab?: 'journal' | 'ideas'; initialIdea?: 'walk' | 'mobility' | null; initialDay?: string };
// V1.8 — `initialDay` ouvre l'activite sur la journee consultee ailleurs dans
// l'application, au lieu de revenir systematiquement a aujourd'hui.
export function ActivityModal({ onClose, onSettings, initialTab = 'journal', initialIdea, initialDay }: Props) {
  const { activity, profile, profileCompleted, today, recordActivity, removeActivity, recordSteps, recordDayEnergy } = useApp();
  const { reducedMotion } = useExperience();
  const [tab, setTab] = useState(initialTab), [day, setDay] = useState(initialDay && initialDay <= today ? initialDay : today), [panel, setPanel] = useState<Panel>('session');
  const [goalOpen, setGoalOpen] = useState(false), [entryKey, setEntryKey] = useState(0), [watchKey, setWatchKey] = useState(0);
  const [editing, setEditing] = useState<string | null>(null), [deleting, setDeleting] = useState<string | null>(null), [idea, setIdea] = useState<ActivityKind | null>(null);
  const [sessionDirty, setSessionDirty] = useState(false), [watchDirty, setWatchDirty] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [discard, setDiscard] = useState(false), [feedback, setFeedback] = useState<ActivityFeedback | null>(null);
  const plan = dailyEnergyPlan(profile, activity, day, profileCompleted), summary = plan.activity;
  const savedSteps = summary.steps === null ? '' : String(summary.steps);
  const savedBaseline = String(activity.stepDetailsByDay?.[day]?.baselineSteps ?? DEFAULT_BASELINE_STEPS);
  const savedWeight = activity.stepDetailsByDay?.[day]?.weightKg ?? (profileCompleted && validActivityWeight(profile.weightKg) ? profile.weightKg : undefined);
  const savedWeightText = savedWeight === undefined ? '' : String(savedWeight);
  const [steps, setSteps] = useState(savedSteps), [baseline, setBaseline] = useState(savedBaseline), [stepWeight, setStepWeight] = useState(savedWeightText);
  useEffect(() => { setSteps(savedSteps); setBaseline(savedBaseline); setStepWeight(savedWeightText); }, [day, savedSteps, savedBaseline, savedWeightText]);
  const stepsDirty = steps !== savedSteps || baseline !== savedBaseline || stepWeight !== savedWeightText;
  const dirty = sessionDirty || watchDirty || stepsDirty;
  const stepPreview = stepEnergy(readNumber(steps), readNumber(stepWeight) ?? undefined, readNumber(baseline) ?? NaN);
  const scroll = useRef<ScrollView>(null);
  const top = () => scroll.current?.scrollTo({ y: 0, animated: !reducedMotion });
  useEffect(() => { if (error) scroll.current?.scrollTo({ y: 0, animated: !reducedMotion }); }, [error, reducedMotion]);
  const dates = Array.from({ length: 7 }, (_, i) => { const d = new Date(`${today}T12:00:00`); d.setDate(d.getDate() - i); return { key: dayKey(d), label: i === 0 ? 'Aujourd’hui' : new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' }).format(d) }; });
  const resetSession = () => { setEditing(null); setIdea(null); setSessionDirty(false); setEntryKey(n => n + 1); };
  const resetSteps = () => { setSteps(savedSteps); setBaseline(savedBaseline); setStepWeight(savedWeightText); setError(''); };
  const resetWatch = () => { setWatchDirty(false); setWatchKey(n => n + 1); };
  const close = () => { if (goalOpen) setGoalOpen(false); else if (dirty) { setDiscard(true); top(); } else onClose(); };
  const settings = () => { if (dirty) { setError('Enregistre ou annule la saisie en cours avant de régler ton objectif.'); return; } if (!profileCompleted || plan.issue) onSettings(); else setGoalOpen(true); };
  const changePanel = (next: Panel) => { if (next === panel) return; if (dirty) { setError('Enregistre ou annule la saisie en cours avant de changer de formulaire.'); return; } setPanel(next); setError(''); setFeedback(null); };
  const showFeedback = (value: ActivityFeedback) => { setFeedback(value); setNotice(''); top(); };
  const impact = (next: typeof plan) => next.activity.report ? `Le bilan utilise le total de ${kcal(next.activity.activeKcal)} kcal de ta montre. Mets ce total à jour après une nouvelle activité.` : next.dynamic && profileCompleted && !next.issue ? `Repère du jour : ${kcal(plan.target)} → ${kcal(next.target)} kcal. Les mouvements déjà comptés dans les pas sont retirés du cumul.` : 'Les kcal sont ajoutées au bilan d’activité. Active « Ajusté à ma journée » pour faire évoluer aussi ton repère alimentaire.';
  const save = (entry: ActivitySession) => {
    const next = dailyEnergyPlan(profile, saveSession(activity, entry), day, profileCompleted), e = sessionEnergy(entry);
    if (!e) throw new Error(sessionEnergyIssue(entry) ?? 'Complète ta séance.');
    recordActivity(entry); resetSession();
    showFeedback({ key: `${entry.id}-${Date.now()}`, title: editing ? 'Séance mise à jour' : 'Bravo pour ta séance !', message: `${entry.minutes} min · ${ACTIVITY_LABELS[entry.kind]} · ${e.source === 'estimated' ? '≈ ' : ''}${kcal(e.activeKcal)} kcal actives${e.source === 'reported' ? ' renseignées' : ' estimées'}.`, detail: impact(next) });
  };
  const saveSteps = () => {
    const value = readNumber(steps), weightKg = readNumber(stepWeight);
    if (value === null || !Number.isInteger(value) || value > 100000) { setError('Indique un total entier entre 0 et 100 000 pas.'); return; }
    if (!validActivityWeight(weightKg)) { setError('Indique ton poids dans la saisie des pas pour calculer les kcal.'); return; }
    try {
      const details = { weightKg, baselineSteps: readNumber(baseline) ?? NaN };
      const next = dailyEnergyPlan(profile, setDaySteps(activity, day, value, details), day, profileCompleted);
      recordSteps(day, value, details); setError('');
      showFeedback({ key: `steps-${Date.now()}`, title: value > (summary.steps ?? 0) ? 'Bravo, tu as bougé !' : 'Pas mis à jour', message: `${value.toLocaleString('fr-FR')} pas · ≈ ${kcal(next.activity.stepsEstimate!.activeKcal)} kcal actives estimées.`, detail: impact(next) });
    } catch (e) { setError(e instanceof Error ? e.message : 'Vérifie les pas.'); }
  };
  const saveWatch = (report: ReportedDayEnergy) => {
    const next = dailyEnergyPlan(profile, setDayEnergy(activity, day, report), day, profileCompleted);
    recordDayEnergy(day, report); resetWatch();
    showFeedback({ key: `watch-${Date.now()}`, title: 'Ton total est enregistré', message: `${kcal(report.activeKcal)} kcal actives renseignées pour cette journée.`, detail: next.dynamic && profileCompleted && !next.issue ? `Le repère devient ${kcal(next.target)} kcal. Pas et séances restent visibles, sans être ajoutés une deuxième fois.` : 'Ce chiffre remplace les estimations du bilan d’activité. Ton repère alimentaire reste fixe tant que tu n’actives pas l’ajustement.' });
  };
  return <Modal visible animationType={reducedMotion ? 'none' : 'slide'} presentationStyle="pageSheet" onRequestClose={close}>
    {goalOpen ? <GoalPicker embedded onClose={() => setGoalOpen(false)} /> : <SafeAreaProvider><SafeAreaView style={styles.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}><View><Text style={styles.eyebrow}>BOUGER À TON RYTHME</Text><Text style={styles.title}>Mon activité</Text></View><MotionPressable onPress={close} accessibilityRole="button" accessibilityLabel="Fermer l’activité" style={styles.close}><Text style={styles.cross}>×</Text></MotionPressable></View>
      <View style={styles.tabs}><Choice label="Mon journal" selected={tab === 'journal'} onPress={() => setTab('journal')} /><Choice label="Idées du jour" selected={tab === 'ideas'} onPress={() => { if (dirty) { setError('Enregistre ou annule ta saisie avant de consulter les idées.'); return; } setTab('ideas'); }} /></View>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {discard && <View style={form.card}><Text style={form.title}>Une saisie est en cours</Text><Action label="Continuer la saisie" onPress={() => setDiscard(false)} /><Action label="Quitter sans cette saisie" secondary onPress={onClose} /></View>}
        {feedback && <ActivityCelebration feedback={feedback} onClose={() => setFeedback(null)} />}
        {notice ? <Text style={form.success} accessibilityLiveRegion="polite">{notice}</Text> : null}
        {error ? <Text style={form.error} accessibilityRole="alert">{error}</Text> : null}
        {tab === 'journal' ? <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={form.row}>{dates.map(d => <Choice key={d.key} label={d.label} selected={day === d.key} onPress={() => { if (dirty) { setError('Enregistre ou annule ta saisie avant de changer de journée.'); return; } setDay(d.key); resetSession(); resetWatch(); setError(''); setNotice(''); setFeedback(null); setDeleting(null); }} />)}</ScrollView>
          <ActivityBalance plan={plan} profileCompleted={profileCompleted} onSettings={settings} />
          <Text style={form.title}>Que veux-tu renseigner ?</Text>
          <View style={form.row}><Choice label="Ma séance" selected={panel === 'session'} onPress={() => changePanel('session')} /><Choice label="Mes pas" selected={panel === 'steps'} onPress={() => changePanel('steps')} /><Choice label="Total montre" selected={panel === 'watch'} onPress={() => changePanel('watch')} /></View>
          {panel === 'session' && <SessionEntryForm key={`session-${day}-${entryKey}-${editing ?? 'new'}`} day={day} entry={activity.sessions.find(s => s.id === editing)} idea={idea} onSave={save} onCancel={resetSession} onDirty={setSessionDirty} />}
          {panel === 'steps' && <View style={form.card}><Text style={form.title}>Pas de la journée</Text><Text style={form.copy}>Recopie le total du téléphone ou de la montre. Il remplace le précédent total, sans s’y ajouter.</Text><Field label="Total de pas" numeric value={steps} onChange={setSteps} placeholder="Ex. 6500" maxLength={6} /><Field label="Poids pour estimer les pas (kg)" numeric value={stepWeight} onChange={setStepWeight} maxLength={6} />
            {stepPreview && <View style={styles.note}><Text style={styles.energy}>≈ {kcal(stepPreview.activeKcal)} kcal</Text><Text style={form.copy}>actives estimées avec ces pas</Text></View>}
            <Field label="Pas habituels déjà inclus dans la base" numeric value={baseline} onChange={setBaseline} maxLength={6} /><Text style={form.muted}>2 000 par défaut : hypothèse modifiable pour tes mouvements habituels, pas un objectif de santé. Seuls les pas au-delà relèvent le repère ajusté. Calcul indicatif à 100 pas/min et 3 MET, hors repos ; le terrain et l’allure font varier la dépense.</Text>
            <Action label="Enregistrer les pas et leurs kcal" onPress={saveSteps} /><Action secondary label="Annuler la saisie des pas" onPress={resetSteps} />
          </View>}
          {panel === 'watch' && <DayEnergyForm key={`watch-${day}-${watchKey}`} day={day} onSave={saveWatch} onRemove={() => { recordDayEnergy(day, null); resetWatch(); setFeedback(null); setNotice('Total de la montre retiré. Le bilan reprend les pas et les séances enregistrés.'); top(); }} onCancel={resetWatch} onDirty={setWatchDirty} />}
          <Text style={form.title}>{summary.minutes.toLocaleString('fr-FR')} min · {summary.sessions.length} séance{summary.sessions.length > 1 ? 's' : ''}</Text>
          {!summary.sessions.length && <Text style={form.copy}>Aucune séance renseignée pour ce jour.</Text>}
          {summary.rows.map(({ session: s, estimate: e }) => <View key={s.id} style={form.card}><Text style={form.title}>{ACTIVITY_LABELS[s.kind]} · {s.minutes} min</Text><Text style={e ? form.copy : form.error}>{e ? `${e.source === 'estimated' ? '≈ ' : ''}${kcal(e.activeKcal)} kcal actives · ${e.source === 'reported' ? `saisie : ${e.label}` : e.label}` : sessionEnergyIssue(s, profileCompleted ? profile.weightKg : undefined)}</Text>{s.note ? <Text style={form.copy}>{s.note}</Text> : null}
            <Action label={e ? 'Modifier' : 'Compléter les kcal de cette séance'} secondary onPress={() => { if (dirty) { setError('Enregistre ou annule la saisie en cours avant de modifier une séance.'); return; } setEditing(s.id); setEntryKey(n => n + 1); setPanel('session'); setError(''); setNotice(''); setFeedback(null); top(); }} />
            {deleting === s.id ? <><Text style={form.copy}>Supprimer cette séance ? {summary.report ? 'Le total saisi de la montre sera conservé.' : 'Le bilan sera recalculé.'}</Text><Action label="Confirmer la suppression" onPress={() => { if (dirty) { setError('Enregistre ou annule la saisie avant de supprimer une séance.'); return; } removeActivity(s.id); if (editing === s.id) resetSession(); setDeleting(null); setNotice('Séance supprimée.'); }} /><Action label="Garder la séance" secondary onPress={() => setDeleting(null)} /></> : <Action label="Supprimer" secondary onPress={() => setDeleting(s.id)} />}
          </View>)}
        </> : <><GuideCard compact message="Choisis une idée selon ton envie. Tu pourras ensuite enregistrer sa durée et voir ses kcal, ou recopier celles de ta montre." />
          {[...ACTIVITY_IDEAS].sort((a, b) => Number(b.kind === initialIdea) - Number(a.kind === initialIdea)).map(i => <View key={i.kind} style={form.card}><Text style={styles.duration}>{i.minutes} MIN</Text><Text style={form.title}>{i.title}</Text><Text style={form.copy}>{i.description}</Text>{i.steps.map((s, n) => <Text key={s} style={form.copy}>{n + 1}. {s}</Text>)}<Action label="J’ai terminé : renseigner ma séance" secondary onPress={() => { setDay(today); resetSession(); setIdea(i.kind); setPanel('session'); setTab('journal'); setError(''); top(); }} /></View>)}
        </>}
        <View style={styles.note}><Text style={form.copy}>Les estimations de l’app et les valeurs d’une montre restent indicatives. Le bilan affiche la dépense active, au-delà du repos.</Text><Text style={form.muted}>Une séance commune aux pas n’est pas additionnée intégralement une deuxième fois. Un total actif journalier saisi remplace l’ensemble des estimations du jour.</Text></View>
        <Action secondary label="Source des estimations : Compendium ↗" onPress={() => { void Linking.openURL('https://pacompendium.com/').catch(() => setError('Le lien ne peut pas s’ouvrir pour le moment.')); }} />
      </ScrollView>
    </KeyboardAvoidingView></SafeAreaView></SafeAreaProvider>}
  </Modal>;
}
const styles = StyleSheet.create({ safe: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.background }, header: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { color: colors.sageDark, fontSize: 12, fontFamily: fonts.extrabold, letterSpacing: 1.2 }, title: { color: colors.navy, fontSize: 26, fontFamily: fonts.extrabold, marginTop: 4 }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.white }, cross: { color: colors.ink, fontSize: 27, fontFamily: fonts.medium }, tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 10 }, content: { padding: 18, paddingBottom: 36, gap: 16 }, duration: { color: colors.sageDark, fontSize: 12, fontFamily: fonts.extrabold, letterSpacing: 1.4 }, note: { backgroundColor: colors.aquaPale, padding: 16, borderRadius: 18, gap: 8 }, energy: { fontSize: 32, color: colors.navy, fontFamily: fonts.extrabold } });
