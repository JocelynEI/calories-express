import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { goalMismatch, kcal } from '../domain/energy';
import { readNumber } from '../domain/foods';
import { useApp } from '../state/AppContext';
import { useExperience } from '../state/ExperienceContext';
import { colors } from '../theme';
import { Goal } from '../types';
import { Action, Choice, Field, form } from './FormControls';
import { GuideCard } from './GuideCard';
import { ActivityBudgetControls } from './ActivityBudgetControls';
import { dailyEnergyPlan } from '../domain/activity-energy';

export const GOAL_LABELS: Record<Goal, string> = { maintain: 'Maintien', lose: 'Perte de poids', gain: 'Prise de poids' };
export function GoalPicker({ onClose, embedded = false }: { onClose: () => void; embedded?: boolean }) {
  const { profile, activity, today, updateProfile } = useApp(), { reducedMotion } = useExperience();
  const [goal, setGoal] = useState(profile.goal), [mode, setMode] = useState(profile.targetMode), [manual, setManual] = useState(String(profile.manualTarget));
  const [activityMode, setActivityMode] = useState(profile.activityBudgetMode ?? 'fixed');
  const [error, setError] = useState('');
  const draft = { ...profile, goal, targetMode: mode, activityBudgetMode: activityMode, manualTarget: readNumber(manual) ?? NaN };
  const plan = dailyEnergyPlan(draft, activity, today);
  const issue = mode === 'manual' && readNumber(manual) === null ? 'Indique ton objectif alimentaire en kcal.' : plan.issue;
  const mismatch = issue ? null : goalMismatch(draft);
  const save = () => { if (issue) { setError(issue); return; } updateProfile(draft); onClose(); };
  const body = <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, maxWidth: 520, width: '100%', alignSelf: 'center' }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 36 }}>
        <Text style={{ fontSize: 26, color: colors.navy, fontWeight: '800' }}>Changer mon objectif</Text>
        <GuideCard compact message="Choisis la direction qui te convient aujourd’hui. Ton nouveau repère s’appliquera au baromètre, en conservant ton journal." />
        <View style={form.card}><Text style={form.title}>Mon objectif</Text>{(Object.keys(GOAL_LABELS) as Goal[]).map(g => <Choice key={g} label={GOAL_LABELS[g]} selected={goal === g} onPress={() => { setGoal(g); setError(''); }} />)}</View>
        <View style={form.card}><Text style={form.title}>Mon repère alimentaire</Text><Choice label="Calculer avec mon profil" selected={mode === 'automatic'} onPress={() => setMode('automatic')} /><Choice label="Choisir une valeur en kcal" selected={mode === 'manual'} onPress={() => setMode('manual')} />
          {mode === 'manual' ? <><Field label="Objectif alimentaire quotidien (kcal)" value={manual} onChange={setManual} numeric maxLength={6} /><Text style={form.muted}>Changer de direction ne modifie pas cette valeur automatiquement. Vérifie-la ou choisis le calcul avec ton profil.</Text></> : <Text style={form.muted}>Le profil définit une base. Choisis ci-dessous comment ton activité intervient dans le calcul.</Text>}
        </View>
        <View style={form.card}><ActivityBudgetControls profile={draft} onChange={setActivityMode} /></View>
        {!issue && <View style={form.card}><Text style={form.copy}>Maintien estimé : {kcal(plan.maintenance)} kcal</Text><Text style={form.title}>Nouveau repère : {kcal(plan.target)} kcal</Text><Text style={form.copy}>{plan.direction === 'deficit' ? `Déficit prévu de ${kcal(plan.plannedDifference)} kcal, déjà inclus dans ce repère.` : plan.direction === 'surplus' ? `Apport prévu de ${kcal(-plan.plannedDifference)} kcal au-dessus du maintien estimé.` : 'Ce repère correspond au maintien estimé.'}</Text>{mismatch && <Text style={form.error}>{mismatch}</Text>}<Text style={form.muted}>Un repère estimé à adapter à ta situation. Le graphique utilisera cet objectif actuel, y compris pour comparer les jours passés.</Text></View>}
        {(error || issue) ? <Text style={form.error} accessibilityRole="alert">{error || issue}</Text> : null}
        <Action label="Enregistrer mon objectif" onPress={save} /><Action label="Annuler" secondary onPress={onClose} />
      </ScrollView>
    </KeyboardAvoidingView></SafeAreaView>;
  return embedded ? body : <Modal visible animationType={reducedMotion ? 'none' : 'slide'} presentationStyle="pageSheet" onRequestClose={onClose}><SafeAreaProvider>{body}</SafeAreaProvider></Modal>;
}
