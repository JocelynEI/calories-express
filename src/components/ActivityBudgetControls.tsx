import React from 'react';
import { Text, View } from 'react-native';
import { dailyEnergyPlan } from '../domain/activity-energy';
import { kcal } from '../domain/energy';
import { useApp } from '../state/AppContext';
import { Profile } from '../types';
import { Choice, form } from './FormControls';

export function ActivityBudgetControls({ profile, onChange }: { profile: Profile; onChange: (mode: 'fixed' | 'daily') => void }) {
  const { activity, today } = useApp();
  if (profile.targetMode === 'manual') return <Text style={form.muted}>Une valeur manuelle reste fixe. Pour un repère qui évolue avec tes pas et séances, choisis le calcul automatique.</Text>;
  const mode = profile.activityBudgetMode ?? 'fixed';
  const plan = dailyEnergyPlan(profile, activity, today);
  return <View style={{ gap: 12 }}>
    <Text style={form.title}>L’activité et mon objectif</Text>
    <Choice label="Fixe · avec mon activité habituelle" selected={mode === 'fixed'} onPress={() => onChange('fixed')} />
    <Choice label="Ajusté à ma journée" selected={mode === 'daily'} onPress={() => onChange('daily')} />
    <Text style={form.copy}>{mode === 'daily'
      ? 'La base devient celle d’une journée calme. Les pas et les séances supplémentaires utilisent les kcal estimées ou saisies. Si tu saisis un total actif journalier, il remplace ces estimations. Les mouvements habituels restent déduits du crédit. Ton déficit prévu reste le même.'
      : 'Ton niveau d’activité habituel est déjà dans le calcul. Les kcal des pas et des séances sont visibles, mais ne s’ajoutent pas au repère.'}</Text>
    {mode === 'daily' && <>
      <Text style={form.muted}>Ce choix remplace le coefficient d’activité habituel. La base peut donc être plus basse qu’avant. Enregistre uniquement les séances faites, sans ajouter deux fois la même marche.</Text>
      {!plan.issue && <View style={form.card}><Text style={form.copy}>Base sans activité supplémentaire : {kcal(plan.baseTarget)} kcal</Text><Text style={form.copy}>Activité prise en compte aujourd’hui : +{kcal(plan.creditedKcal)} kcal</Text><Text style={form.title}>Repère aujourd’hui : {kcal(plan.target)} kcal</Text></View>}
    </>}
  </View>;
}
