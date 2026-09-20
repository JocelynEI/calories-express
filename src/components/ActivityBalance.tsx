import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { dailyEnergyPlan } from '../domain/activity-energy';
import { kcal } from '../domain/energy';
import { colors } from '../theme';
import { Action, form } from './FormControls';

type Plan = ReturnType<typeof dailyEnergyPlan>;
export function ActivityBalance({ plan, profileCompleted, onSettings }: { plan: Plan; profileCompleted: boolean; onSettings: () => void }) {
  const a = plan.activity;
  return <View style={form.card}>
    <Text style={styles.eyebrow}>{a.report ? 'TOTAL ACTIF RENSEIGNÉ' : 'DÉPENSE ACTIVE DE LA JOURNÉE'}</Text>
    <Text accessibilityLiveRegion="polite" style={styles.total}>{!a.hasEnergy && (a.rows.length || a.steps !== null) ? '—' : `${a.report ? '' : '≈ '}${kcal(a.activeKcal)}`} <Text style={form.title}>kcal</Text></Text>
    {a.report ? <><Text style={form.copy}>{a.report.deviceName} · total saisi manuellement</Text><Text style={form.muted}>Ce total couvre les pas et les séances. Leur détail est conservé, sans ajouter leurs kcal à nouveau.</Text></> : <>
      <Row label="Pas · estimation" value={a.stepsEstimate ? `${kcal(a.stepsEstimate.activeKcal)} kcal` : a.steps === null ? 'Non saisis' : 'Poids manquant'} />
      <Row label="Séances · estimation" value={`${kcal(a.estimatedSessionKcal)} kcal`} />
      <Row label="Séances · kcal renseignées" value={`${kcal(a.reportedSessionKcal)} kcal`} />
      {a.deduplicatedKcal > 0 && <Row label="Déjà comptées dans les pas" value={`−${kcal(a.deduplicatedKcal)} kcal`} />}
      <Text style={form.muted}>Pas + séances − doublons = dépense active. Le repos n’est pas ajouté ici.</Text>
    </>}
    {a.partial && <Text style={form.error}>Bilan partiel : {a.unknown > 0 ? `${a.unknown} séance(s) à compléter. ` : ''}{a.steps !== null && !a.stepsEstimate ? 'Indique le poids pour estimer les pas.' : 'Ouvre Modifier pour ajouter le poids ou les kcal connues.'}</Text>}
    {a.report && a.unknown > 0 && <Text style={form.muted}>{a.unknown} ancienne(s) séance(s) sans détail calorique. Le total de la montre est utilisé pour cette journée.</Text>}
    {a.usesDefaults && !a.report && <Text style={form.muted}>Certaines anciennes saisies utilisent le poids actuel ou un effort léger faute de valeur mémorisée.</Text>}
    <View style={styles.impact}><Text style={form.label}>Effet sur mon repère alimentaire</Text><Text style={form.copy}>{!profileCompleted ? 'Complète ton profil pour personnaliser le repère. Les dépenses renseignées restent affichées.' : plan.issue ? plan.issue : plan.dynamic ? `${kcal(plan.baseTarget)} de base + ${kcal(plan.creditedKcal)} d’activité = ${kcal(plan.target)} kcal` : 'Ton repère est fixe. Les kcal sont bien enregistrées, mais ce réglage ne fait pas évoluer l’objectif alimentaire.'}</Text></View>
    <Action label={!profileCompleted ? 'Compléter mon profil' : plan.dynamic ? 'Régler mon objectif' : 'Activer l’ajustement avec mon activité'} secondary onPress={onSettings} />
  </View>;
}
function Row({ label, value }: { label: string; value: string }) { return <View style={styles.row}><Text style={[form.copy, { flex: 1 }]}>{label}</Text><Text style={form.label}>{value}</Text></View>; }
const styles = StyleSheet.create({ total: { color: colors.navy, fontSize: 34, fontWeight: '800' }, eyebrow: { color: colors.sageDark, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 }, row: { flexDirection: 'row', gap: 12, alignItems: 'center' }, impact: { backgroundColor: colors.violetPale, borderRadius: 14, padding: 13, gap: 6 } });
