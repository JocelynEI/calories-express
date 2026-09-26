import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { ACTIVITY_LABELS, activityIssue } from '../domain/activity';
import { ACTIVITY_EFFORTS, ASSUMED_WEIGHT_KG, DEFAULT_EFFORT, normallyIncludedInSteps, sessionEnergy, sessionEnergyIssue, validActivityWeight } from '../domain/activity-energy';
import { kcal } from '../domain/energy';
import { readNumber } from '../domain/foods';
import { useApp } from '../state/AppContext';
import { colors, fonts } from '../theme';
import { ActivityEffort, ActivityKind, ActivitySession } from '../types';
import { Action, Choice, Field, form } from './FormControls';

type Props = { day: string; entry?: ActivitySession; idea?: ActivityKind | null; onSave: (entry: ActivitySession) => void; onCancel: () => void; onDirty: (dirty: boolean) => void };
export function SessionEntryForm({ day, entry, idea, onSave, onCancel, onDirty }: Props) {
  const { profile, profileCompleted, activity } = useApp();
  const initialKind = entry?.kind ?? idea ?? 'walk';
  const initialWeight = entry?.weightKg ?? (profileCompleted && validActivityWeight(profile.weightKg) ? profile.weightKg : undefined);
  const [kind, setKind] = useState<ActivityKind>(initialKind), [minutes, setMinutes] = useState(entry ? String(entry.minutes) : '');
  const [effort, setEffort] = useState<ActivityEffort>(entry?.effort ?? DEFAULT_EFFORT), [weight, setWeight] = useState(initialWeight === undefined ? '' : String(initialWeight));
  const [source, setSource] = useState<'estimated' | 'reported'>(entry?.energySource ?? 'estimated');
  const [manualKcal, setManualKcal] = useState(entry?.energySource === 'reported' ? String(entry.reportedActiveKcal ?? '') : '');
  const [device, setDevice] = useState(entry?.deviceName ?? 'Ma montre'), [note, setNote] = useState(entry?.note ?? '');
  const [includeInGoal, setIncludeInGoal] = useState(entry?.includeInGoal !== false), [includedInSteps, setIncludedInSteps] = useState(entry?.includedInSteps ?? normallyIncludedInSteps(initialKind));
  const [error, setError] = useState(''), [details, setDetails] = useState(false);
  const values = JSON.stringify([kind, minutes, effort, weight, source, manualKcal, device, note, includeInGoal, includedInSteps]);
  const initial = useRef(values);
  useEffect(() => { onDirty(values !== initial.current); }, [values, onDirty]);
  useEffect(() => () => onDirty(false), [onDirty]);
  const draft: ActivitySession = { id: entry?.id ?? 'preview', day, kind, minutes: readNumber(minutes) ?? NaN, effort, note: note.trim(), includeInGoal, includedInSteps,
    energySource: source, ...(source === 'reported' ? { reportedActiveKcal: readNumber(manualKcal) ?? NaN, deviceName: device.trim() || 'Kcal saisies' } : { weightKg: weight.trim() ? (readNumber(weight) ?? NaN) : undefined, weightAssumed: !weight.trim() }) };
  const result = sessionEnergy(draft), missing = sessionEnergyIssue(draft);
  const save = () => {
    const issue = activityIssue(draft, activity) ?? missing;
    if (issue || !result) { setError(issue ?? 'Vérifie ta saisie pour calculer les kcal.'); return; }
    const record = { ...draft, id: entry?.id ?? `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    try { onSave(record); onDirty(false); } catch (e) { setError(e instanceof Error ? e.message : 'La séance n’a pas pu être enregistrée.'); }
  };
  return <View style={form.card}>
    <Text style={form.title}>{entry ? 'Modifier ma séance' : 'Ajouter ma séance'}</Text>
    <Text style={form.copy}>Choisis ton activité et sa durée. La dépense apparaît ci-dessous avant l’enregistrement.</Text>
    <View style={form.row}>{(Object.keys(ACTIVITY_LABELS) as ActivityKind[]).map(k => <Choice key={k} label={ACTIVITY_LABELS[k]} selected={kind === k} onPress={() => { setKind(k); setEffort(DEFAULT_EFFORT); setIncludedInSteps(normallyIncludedInSteps(k)); if (k === 'other') setSource('reported'); setError(''); }} />)}</View>
    <View style={form.row}><Choice label="Estimer automatiquement" selected={source === 'estimated'} onPress={() => { setSource('estimated'); setError(''); }} /><Choice label="Saisir mes kcal" selected={source === 'reported'} onPress={() => { setSource('reported'); setError(''); }} /></View>
    {/* V2.8 — quatre durées courantes en un geste. Le champ reste là pour
        toutes les autres. */}
    <View style={form.row}>{[15, 30, 45, 60].map(value => <Choice key={value} label={`${value} min`} selected={readNumber(minutes) === value} onPress={() => { setMinutes(String(value)); setError(''); }} />)}</View>
    <Field label="Durée de la séance (minutes)" value={minutes} onChange={setMinutes} numeric placeholder="Ex. 30" maxLength={6} />
    {source === 'estimated' ? <>
      {!weight.trim() && <Text style={form.muted}>{`Sans poids indiqué, l’estimation utilise une moyenne de ${ASSUMED_WEIGHT_KG} kg. Ouvre les précisions pour la tienne.`}</Text>}
    </> : <>
      <Field label="Calories actives de cette séance (kcal)" value={manualKcal} onChange={setManualKcal} numeric placeholder="Ex. 280" maxLength={7} />
      <Text style={form.muted}>Recopie les kcal actives de CETTE séance, hors calories de repos. Sur Apple Watch, utilise la valeur d’activité de l’exercice. Pour le total de la journée, ouvre « Total montre ».</Text>
      <Field label="Provenance (facultatif)" value={device} onChange={setDevice} placeholder="Apple Watch, Garmin, appareil de sport…" maxLength={60} />
    </>}
    <View style={styles.result} accessibilityLiveRegion="polite">
      <Text style={styles.eyebrow}>{source === 'reported' ? 'DÉPENSE QUE TU RENSEIGNES' : 'DÉPENSE ESTIMÉE'}</Text>
      <Text style={styles.number}>{result ? `${source === 'estimated' ? '≈ ' : ''}${kcal(result.activeKcal)}` : '—'} <Text style={form.title}>kcal actives</Text></Text>
      <Text style={form.copy}>{result ? source === 'reported' ? 'Cette valeur remplace l’estimation de la séance.' : 'Calcul à partir du poids, de la durée et de l’activité. Le repos est déjà retranché.' : missing}</Text>
    </View>
    <Action secondary label={details ? 'Masquer les réglages fins' : 'Ajuster l’intensité, le poids et la prise en compte'} onPress={() => setDetails(!details)} />
    {details && <>{source === 'estimated' && <>
      <Field label="Poids utilisé pour cette séance (kg)" value={weight} onChange={setWeight} numeric placeholder={String(ASSUMED_WEIGHT_KG)} maxLength={6} />
      <Text style={form.muted}>{entry?.weightKg ? 'Poids mémorisé avec cette séance, modifiable ici.' : profileCompleted ? 'Repris de ton profil. Une modification ici concerne seulement cette séance.' : 'Tu peux renseigner ton poids ici sans compléter tout ton profil.'}</Text>
      {kind !== 'other' && <><Text style={form.label}>Intensité réellement effectuée</Text>{(kind === 'mobility' ? ['easy'] as const : ['easy', 'moderate', 'brisk'] as const).map(e => <Choice key={e} label={ACTIVITY_EFFORTS[kind][e].label} selected={effort === e} onPress={() => setEffort(e)} />)}</>}
    </>}
    <View style={styles.toggle}><View style={{ flex: 1 }}><Text style={form.label}>Cette séance est comprise dans mes pas</Text><Text style={form.muted}>Marche et course : activé par défaut. Le bilan évite d’ajouter deux fois les mêmes mouvements.</Text></View><Switch accessibilityLabel="Séance comprise dans les pas" value={includedInSteps} onValueChange={setIncludedInSteps} trackColor={{ true: colors.violet }} /></View>
    <Field label="Note facultative" value={note} onChange={setNote} maxLength={100} placeholder="Ex. natation après le travail" /><View style={styles.toggle}><View style={{ flex: 1 }}><Text style={form.label}>Activité supplémentaire</Text><Text style={form.muted}>Activé pour une séance en plus du quotidien. Désactive pour les mouvements habituels déjà couverts par ta base alimentaire.</Text></View><Switch accessibilityLabel="Activité supplémentaire" value={includeInGoal} onValueChange={setIncludeInGoal} trackColor={{ true: colors.violet }} /></View></>}
    {error ? <Text style={form.error} accessibilityRole="alert">{error}</Text> : null}
    <Action label={entry ? 'Enregistrer la modification' : 'Enregistrer la séance et ses kcal'} onPress={save} />
    <Action secondary label={entry ? 'Annuler la modification' : 'Effacer cette saisie'} onPress={onCancel} />
  </View>;
}
const styles = StyleSheet.create({ result: { borderRadius: 18, padding: 16, backgroundColor: colors.aquaPale, gap: 7 }, number: { color: colors.navy, fontSize: 30, fontFamily: fonts.extrabold }, eyebrow: { color: colors.inkSoft, fontSize: 12, letterSpacing: 1, fontFamily: fonts.extrabold }, toggle: { flexDirection: 'row', alignItems: 'center', gap: 12 } });
