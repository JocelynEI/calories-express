import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { DEFAULT_BASELINE_STEPS, stepEnergy, validActivityWeight } from '../domain/activity-energy';
import { reportedDayIssue } from '../domain/activity';
import { kcal } from '../domain/energy';
import { readNumber } from '../domain/foods';
import { useApp } from '../state/AppContext';
import { ReportedDayEnergy } from '../types';
import { Action, Choice, Field, form } from './FormControls';

export function DayEnergyForm({ day, onSave, onRemove, onCancel, onDirty }: { day: string; onSave: (report: ReportedDayEnergy) => void; onRemove: () => void; onCancel: () => void; onDirty: (dirty: boolean) => void }) {
  const { activity, profile, profileCompleted } = useApp();
  const saved = activity.reportedEnergyByDay?.[day];
  const details = activity.stepDetailsByDay?.[day];
  const weight = details?.weightKg ?? (profileCompleted && validActivityWeight(profile.weightKg) ? profile.weightKg : undefined);
  const proposedBaseline = stepEnergy(details?.baselineSteps ?? DEFAULT_BASELINE_STEPS, weight, 0)?.activeKcal;
  const [value, setValue] = useState(saved ? String(saved.activeKcal) : ''), [baseline, setBaseline] = useState(String(saved?.baselineActiveKcal ?? proposedBaseline ?? ''));
  const [device, setDevice] = useState(saved?.deviceName ?? 'Ma montre'), [confirmed, setConfirmed] = useState(false), [removing, setRemoving] = useState(false), [error, setError] = useState('');
  const values = JSON.stringify([value, baseline, device, confirmed]), initial = useRef(values);
  useEffect(() => { onDirty(values !== initial.current); }, [values, onDirty]);
  useEffect(() => () => onDirty(false), [onDirty]);
  const report: ReportedDayEnergy = { activeKcal: readNumber(value) ?? NaN, baselineActiveKcal: readNumber(baseline) ?? NaN, deviceName: device.trim() || 'Ma montre' };
  const issue = reportedDayIssue(report);
  return <View style={form.card}>
    <Text style={form.title}>Mon total actif de la journée</Text>
    <Text style={form.copy}>Si ta montre fournit déjà les calories actives de toute la journée, recopie ce total ici. Il remplace le cumul des pas et des séances pour cette date.</Text>
    <Field label="Total des calories actives du jour (kcal)" numeric value={value} onChange={v => { setValue(v); setConfirmed(false); }} placeholder="Ex. 620" maxLength={7} />
    <Text style={form.muted}>Sur Apple Watch : les kcal de l’anneau Bouger, hors repos. Ne recopie pas le total qui inclut le métabolisme de repos. La saisie est manuelle et fonctionne avec toute montre.</Text>
    <Field label="Provenance (facultatif)" value={device} onChange={setDevice} placeholder="Apple Watch, Garmin…" maxLength={60} />
    <Field label="Kcal habituelles déjà couvertes par la base" numeric value={baseline} onChange={setBaseline} maxLength={7} />
    <Text style={form.muted}>{proposedBaseline !== undefined ? `${proposedBaseline} kcal proposées d’après tes pas habituels et ton poids. ` : 'Renseigne ce repère ou complète ton poids dans le profil. '}C’est une hypothèse modifiable pour l’objectif ajusté. Elle est déduite du crédit alimentaire, pas de la dépense affichée.</Text>
    {!issue && <><Text style={form.title}>{kcal(report.activeKcal)} kcal actives renseignées</Text><Text style={form.copy}>Au maximum +{kcal(Math.max(0, report.activeKcal - report.baselineActiveKcal))} kcal dans le repère ajusté, avant prise en compte des séances habituelles.</Text></>}
    <Choice label="Je confirme : calories actives de cette journée, pas + séances inclus" selected={confirmed} onPress={() => setConfirmed(!confirmed)} />
    <Text style={form.muted}>Les pas et séances restent dans ton journal. Si tu bouges encore, mets à jour ce total : ils ne s’ajouteront pas automatiquement à une valeur qui peut déjà les inclure.</Text>
    {error ? <Text style={form.error} accessibilityRole="alert">{error}</Text> : null}
    <Action label={saved ? 'Remplacer le total de la journée' : 'Utiliser ce total pour la journée'} disabled={!confirmed} onPress={() => { if (issue) { setError(issue); return; } try { onSave(report); onDirty(false); } catch (e) { setError(e instanceof Error ? e.message : 'Vérifie le total.'); } }} />
    <Action label="Annuler la saisie" secondary onPress={onCancel} />
    {saved && (removing ? <><Text style={form.copy}>Retirer ce total pour retrouver le calcul à partir des pas et des séances ? Le journal reste conservé.</Text><Action label="Confirmer le retour aux estimations" onPress={onRemove} /><Action label="Garder le total de ma montre" secondary onPress={() => setRemoving(false)} /></> : <Action label="Revenir au cumul des pas et séances" secondary onPress={() => setRemoving(true)} />)}
  </View>;
}
