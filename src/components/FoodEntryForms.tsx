import React, { useState } from 'react';
import { Linking, StyleSheet, Switch, Text, View } from 'react-native';
import { normalizeText } from '../domain/calories';
import { portionIssue, readNumber, scaleReference } from '../domain/foods';
import { useApp } from '../state/AppContext';
import { colors } from '../theme';
import { FoodReference, RecognizedFood, SavedFood } from '../types';
import { Action, Choice, Field, form } from './FormControls';
import { MotionPressable } from './Motion';

type Add = (item: RecognizedFood) => void;

export function ManualFoodForm({ onAdd, initialName = '' }: { onAdd: Add; initialName?: string }) {
  const { rememberFood } = useApp();
  const [name, setName] = useState(initialName);
  const [unit, setUnit] = useState<FoodReference['unit']>('g');
  const [calories, setCalories] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [remember, setRemember] = useState(true);
  const [showMacros, setShowMacros] = useState(false);
  const [protein, setProtein] = useState(''), [carbs, setCarbs] = useState(''), [fat, setFat] = useState('');
  const [error, setError] = useState('');
  const amount = unit === 'portion' ? 1 : 100;
  const refKcal = readNumber(calories), qty = readNumber(quantity);
  const preview = refKcal !== null && qty !== null ? Math.round(refKcal * qty / amount) : null;
  const add = () => {
    setError('');
    if (!name.trim() || refKcal === null || qty === null) { setError('Renseigne le nom, les kilocalories et la quantité consommée.'); return; }
    if (unit !== 'portion' && refKcal > 1000) { setError('Vérifie la valeur pour 100 g/ml : saisis des kcal, pas des kJ.'); return; }
    const texts = showMacros ? [protein, carbs, fat] : ['', '', ''];
    const values = texts.map(readNumber);
    if (texts.some((v, i) => v.trim() && (values[i] === null || values[i]! > (unit === 'portion' ? 1000 : 100)))) { setError('Vérifie les macronutriments : grammes pour la même quantité de référence.'); return; }
    const food: SavedFood = { id: `custom-${normalizeText(name)}-${unit}`, name: name.trim(), reference: { unit, amount, calories: { min: refKcal, estimated: refKcal, max: refKcal }, macros: { protein: values[0] ?? 0, carbs: values[1] ?? 0, fat: values[2] ?? 0 }, macrosComplete: values.every(v => v !== null), source: 'manual' } };
    const issue = portionIssue(qty, food.reference); if (issue) { setError(issue); return; }
    onAdd(scaleReference(food, qty));
    if (remember) rememberFood(food);
    setName(''); setCalories(''); setProtein(''); setCarbs(''); setFat('');
  };
  return <View style={form.card}>
    <Text style={form.title}>Ton aliment, tes valeurs</Text>
    <Text style={form.copy}>Recopie l’étiquette ou indique directement les calories de ta portion.</Text>
    <Field label="Nom de l’aliment ou du plat" value={name} onChange={setName} placeholder="Ex. : pâtes cuites, recette maison…" />
    <Text style={form.label}>La valeur correspond à</Text>
    <View style={form.row}>{(['g', 'ml', 'portion'] as const).map(u => <Choice key={u} label={u === 'portion' ? 'Ma portion' : `100 ${u}`} selected={unit === u} onPress={() => { setUnit(u); setQuantity(u === 'portion' ? '1' : '100'); setError(''); }} />)}</View>
    <Field label={`Calories pour ${unit === 'portion' ? 'ma portion' : `100 ${unit}`} (kcal)`} value={calories} onChange={setCalories} numeric placeholder="Ex. : 150" />
    <Field label={unit === 'portion' ? 'Nombre de portions mangées' : `Quantité consommée (${unit})`} value={quantity} onChange={setQuantity} numeric />
    <Text style={form.muted}>Garde la même référence : produit cru ou cuit, tel que vendu ou préparé.</Text>
    <MotionPressable accessibilityRole="button" onPress={() => setShowMacros(!showMacros)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={styles.link}>{showMacros ? 'Masquer les macronutriments' : 'Ajouter les macronutriments (facultatif)'}</Text></MotionPressable>
    {showMacros && <><Text style={form.muted}>En grammes, pour {amount} {unit}. Laisse vide si tu ne sais pas.</Text><Field label="Protéines" value={protein} onChange={setProtein} numeric /><Field label="Glucides" value={carbs} onChange={setCarbs} numeric /><Field label="Lipides" value={fat} onChange={setFat} numeric /></>}
    <View style={styles.switchRow}><Text style={[form.copy, { flex: 1 }]}>Mémoriser dans mes aliments</Text><Switch accessibilityLabel="Mémoriser cet aliment" value={remember} onValueChange={setRemember} trackColor={{ true: colors.violet }} /></View>
    {preview !== null && <Text style={styles.total}>{preview.toLocaleString('fr-FR')} kcal pour ce que tu as mangé</Text>}
    {error ? <Text accessibilityRole="alert" style={form.error}>{error}</Text> : null}
    <Action label="Ajouter cet aliment au repas" onPress={add} />
  </View>;
}

export function SourceLink({ url = 'https://world.openfoodfacts.org', label = 'Source : Open Food Facts · ODbL' }: { url?: string; label?: string }) {
  const [error, setError] = useState(false);
  return <View><MotionPressable accessibilityRole="link" onPress={() => { void Linking.openURL(url).catch(() => setError(true)); }} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={styles.link}>{label} ↗</Text></MotionPressable>{error && <Text style={form.muted}>Le lien n’a pas pu s’ouvrir.</Text>}</View>;
}
const styles = StyleSheet.create({
  link: { color: colors.sageDark, fontSize: 12, fontWeight: '700', lineHeight: 18 },
  total: { color: colors.navy, fontSize: 20, fontWeight: '800' },
  switchRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  result: { borderTopColor: colors.line, borderTopWidth: 1, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56 },
  resultName: { color: colors.ink, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  arrow: { color: colors.sageDark, fontSize: 26 },
});
