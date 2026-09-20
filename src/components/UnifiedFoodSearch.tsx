import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { CIQUAL_COUNT, CIQUAL_SOURCE, FoodSegment, initialQuantity, parseFoodSegment, searchFoods, splitMealText } from '../domain/food-search';
import { portionIssue, ProductCandidate, productToFood, readNumber, scaleReference } from '../domain/foods';
import { searchProducts } from '../services/products';
import { FoodThumb } from './FoodThumb';
import { useApp } from '../state/AppContext';
import { colors } from '../theme';
import { RecognizedFood, SavedFood } from '../types';
import { ManualFoodForm, SourceLink } from './FoodEntryForms';
import { Action, Choice, Field, form } from './FormControls';
import { RecipeBuilder } from './RecipeBuilder';
import { LabelFoodForm } from './LabelFoodForm';
import { isBurgerQuery } from '../domain/recipes';
import { MotionPressable } from './Motion';

export function UnifiedFoodSearch({ onAdd, onDraftChange }: { onAdd: (item: RecognizedFood) => void; onDraftChange: (dirty: boolean) => void }) {
  const { savedFoods, forgetFood } = useApp();
  const [text, setText] = useState(''), [current, setCurrent] = useState(0), [manual, setManual] = useState(false);
  const [special, setSpecial] = useState<'recipe' | 'label' | null>(null);
  const [selection, setSelection] = useState<SavedFood | ProductCandidate | null>(null);
  const [results, setResults] = useState<ProductCandidate[]>([]), [busy, setBusy] = useState(false), [searched, setSearched] = useState(false), [error, setError] = useState('');
  const request = useRef<AbortController | null>(null), sequence = useRef(0);
  const segments = useMemo(() => splitMealText(text), [text]);
  const segment = segments[current] ?? parseFoodSegment('');
  const local = useMemo(() => searchFoods(segment.query, savedFoods), [segment.query, savedFoods]);
  useEffect(() => { onDraftChange(Boolean(text.trim() || selection || manual || special)); }, [text, selection, manual, special, onDraftChange]);
  useEffect(() => () => { sequence.current++; request.current?.abort(); }, []);
  const cancelRequest = () => { sequence.current++; request.current?.abort(); setBusy(false); setSearched(false); setResults([]); setError(''); };
  const change = (value: string) => { cancelRequest(); setCurrent(0); setText(value); setSelection(null); setManual(false); setSpecial(null); };
  const complete = (item: RecognizedFood) => { onAdd(item); change(segments.filter((_, index) => index !== current).map(s => s.text).join(' et ')); };
  const search = async () => {
    cancelRequest(); const controller = new AbortController(); request.current = controller;
    const token = ++sequence.current; setBusy(true);
    try { const found = await searchProducts(segment.query, controller.signal); if (token === sequence.current) { setResults(found); setSearched(true); } }
    catch (e) { if (token === sequence.current && !controller.signal.aborted) setError(e instanceof Error ? e.message : 'La recherche de marques est indisponible.'); }
    finally { if (token === sequence.current) setBusy(false); }
  };
  if (special === 'recipe') return <RecipeBuilder initialName={segment.query} onCancel={() => setSpecial(null)} onAdd={complete} />;
  if (special === 'label') return <LabelFoodForm initialName={segment.query} onCancel={() => setSpecial(null)} onAdd={complete} />;
  if (selection) return <Quantity key={`${selection.id}-${segment.text}`} selection={selection} segment={segment} onCancel={() => setSelection(null)} onAdd={complete} onForget={'reference' in selection && savedFoods.some(f => f.id === selection.id) ? () => { forgetFood(selection.id); setSelection(null); } : undefined} />;
  return <View style={{ gap: 14 }}>
    <View style={form.card}>
      <Text style={styles.eyebrow}>1 · CE QUE TU AS MANGÉ</Text>
      <Text style={form.title}>Un aliment ou ton repas en une phrase</Text>
      <TextInput accessibilityLabel="Aliment, quantité ou description du repas" value={text} onChangeText={change} multiline maxLength={400} placeholder="150 g de riz cuit et 2 œufs" placeholderTextColor={colors.muted} style={[form.input, { minHeight: 82, textAlignVertical: 'top' }]} />
      <Text style={form.muted}>Choisis chaque aliment proposé, puis vérifie la quantité. Les calories se calculent automatiquement.</Text>
      {segments.length > 1 && <View style={form.row}>{segments.map((s, index) => <Choice key={`${index}-${s.text}`} label={s.text} selected={current === index} onPress={() => { cancelRequest(); setCurrent(index); setManual(false); }} />)}</View>}
      {text.trim() ? <MotionPressable accessibilityRole="button" onPress={() => change('')} style={styles.linkButton}><Text style={styles.link}>Effacer la saisie restante</Text></MotionPressable> : <View style={form.row}>{['Burger maison au bœuf', 'Riz cuit', 'Œuf dur'].map(example => <Choice key={example} label={example} selected={false} onPress={() => change(example)} />)}</View>}
    </View>
    {!manual && <>
      {isBurgerQuery(segment.query) && <View style={[form.card, { backgroundColor: colors.violetPale }]}><Text style={form.title}>Burger maison au bœuf</Text><Text style={form.copy}>Pain, steak, fromage, sauce… ajuste ta recette et calcule les kcal de ton burger.</Text><Action label="Personnaliser mon burger" onPress={() => setSpecial('recipe')} /></View>}

      <View style={form.card}>
        <View style={styles.heading}><Text style={form.title}>Estimations disponibles</Text><Text style={styles.badge}>HORS LIGNE</Text></View>
        <Text style={form.muted}>{CIQUAL_COUNT.toLocaleString('fr-FR')} aliments Ciqual et tes aliments mémorisés. Les recettes, les marques et la cuisson peuvent changer les valeurs.</Text>
        {local.map(food => <Result key={food.id} name={food.name} imageUrl={food.reference.imageUrl} detail={`≈ ${Math.round(food.reference.calories.estimated)} kcal / ${food.reference.amount} ${food.reference.unit} · ${food.reference.source === 'ciqual' ? 'Ciqual 2025' : 'Mes aliments'}`} onPress={() => setSelection(food)} />)}
        {segment.query && !local.length && <Text style={form.copy}>Aucune correspondance exacte. Compose ton plat maison avec ses ingrédients, essaie un nom simple ou photographie son étiquette.</Text>}
        <SourceLink url={CIQUAL_SOURCE} label="Source : Anses · Ciqual 2025 · Licence ouverte" />
      </View>
      <View style={form.card}><Text style={form.title}>Un paquet ou un plat maison ?</Text><Action label="Photographier une étiquette" secondary onPress={() => setSpecial('label')} /><Text style={form.muted}>Lis les valeurs du paquet, puis indique ton nombre de biscuits ou la quantité mangée.</Text><Action label="Composer un plat maison" secondary onPress={() => setSpecial('recipe')} /></View>
      <View style={form.card}>
        <Text style={form.title}>Tu cherches une marque précise ?</Text>
        <Text style={form.copy}>Écris son nom ou les chiffres du code-barres dans le même champ.</Text>
        <Action label={busy ? 'Recherche de la marque…' : 'Chercher une marque en ligne'} disabled={busy || segment.query.length < 3} onPress={() => void search()} />
        {busy && <ActivityIndicator color={colors.violet} />}
        {error ? <Text accessibilityRole="alert" style={form.error}>{error}</Text> : null}
        {searched && !results.length && <Text style={form.copy}>Aucun produit avec des calories renseignées. Essaie un nom plus précis ou une estimation Ciqual.</Text>}
        {results.map(product => <Result key={product.id} name={product.name} imageUrl={product.imageUrl} detail={`${product.brand} · ≈ ${Math.round(product.kcal100)} kcal / 100 g ou ml`} onPress={() => setSelection(product)} />)}
        <Text style={form.muted}>Cette recherche envoie seulement les mots recherchés à Open Food Facts. Le profil et le journal restent sur ton appareil.</Text>
        {results.length > 0 && <SourceLink />}
      </View>
      <Action label="Je connais les kcal : saisir une étiquette" secondary onPress={() => setManual(true)} />
    </>}
    {manual && <><Action label="Revenir aux estimations automatiques" secondary onPress={() => setManual(false)} /><ManualFoodForm initialName={segment.query} onAdd={complete} /></>}
  </View>;
}

function Quantity({ selection, segment, onAdd, onCancel, onForget }: { selection: SavedFood | ProductCandidate; segment: FoodSegment; onAdd: (item: RecognizedFood) => void; onCancel: () => void; onForget?: () => void }) {
  const { rememberFood } = useApp();
  const product = 'kcal100' in selection ? selection : null;
  const [unit, setUnit] = useState<'g' | 'ml' | null>(null), [remember, setRemember] = useState(true);
  const initial = product ? null : initialQuantity(selection as SavedFood, segment);
  const [quantity, setQuantity] = useState(initial?.quantity ?? ''), [note, setNote] = useState(initial?.note ?? ''), [error, setError] = useState('');
  const [forgetting, setForgetting] = useState(false);
  const food = product ? unit ? productToFood(product, unit) : null : selection as SavedFood;
  const qty = readNumber(quantity), issue = food && qty !== null ? portionIssue(qty, food.reference) : null;
  const preview = food && qty !== null && !issue ? scaleReference(food, qty) : null;
  return <View style={form.card}>
    <Action label="Retour à la recherche" secondary onPress={onCancel} />
    <Text style={styles.eyebrow}>2 · VÉRIFIE LA QUANTITÉ</Text><Text style={form.title}>{selection.name}</Text>
    {product && <><Text style={form.copy}>{product.brand} {product.package}</Text><Text style={form.label}>Sur l’étiquette : pour 100 g ou 100 ml ?</Text><Text style={form.muted}>Le service fournit une référence normalisée : vérifie son unité. Le poids et le volume ne sont pas convertis.</Text><View style={form.row}>{(['g', 'ml'] as const).map(u => <Choice key={u} label={`Pour 100 ${u}`} selected={unit === u} onPress={() => { setUnit(u); const next = initialQuantity(productToFood(product, u), segment); setQuantity(next.quantity); setNote(next.note); }} />)}</View></>}
    {food && <><Text style={form.copy}>{Math.round(food.reference.calories.estimated)} kcal pour {food.reference.amount} {food.reference.unit}</Text><Text style={form.muted}>{food.reference.description}</Text><Field label={`Quantité consommée (${food.reference.portionName ?? food.reference.unit})`} numeric value={quantity} onChange={setQuantity} /><Text style={form.muted}>{note}</Text>{preview && <View style={styles.estimate}><Text style={styles.total}>≈ {preview.calories.estimated.toLocaleString('fr-FR')} kcal</Text><Text style={form.muted}>pour cette quantité · estimation à confirmer</Text></View>}{!food.reference.macrosComplete && <Text style={form.muted}>Les macronutriments manquants seront signalés dans le bilan.</Text>}</>}
    {product && <><SourceLink url={product.url} /><View style={styles.heading}><Text style={[form.copy, { flex: 1 }]}>Mémoriser ce produit</Text><Switch accessibilityLabel="Mémoriser ce produit" value={remember} onValueChange={setRemember} trackColor={{ true: colors.violet }} /></View></>}
    {error || issue ? <Text style={form.error} accessibilityRole="alert">{error || issue}</Text> : null}
    <Action label="Ajouter au repas" disabled={!food} onPress={() => { if (!food || !preview) { setError(issue ?? 'Indique la quantité consommée.'); return; } if (product && remember) rememberFood(food); onAdd(preview); }} />
    {onForget && (forgetting ? <><Text style={form.muted}>Retirer de tes aliments mémorisés ? Les repas déjà saisis restent dans le journal.</Text><Action label="Retirer cet aliment mémorisé" secondary onPress={onForget} /><Action label="Le garder" secondary onPress={() => setForgetting(false)} /></> : <MotionPressable onPress={() => setForgetting(true)} accessibilityRole="button" style={styles.linkButton}><Text style={styles.link}>Oublier cet aliment mémorisé</Text></MotionPressable>)}
  </View>;
}
function Result({ name, detail, imageUrl, onPress }: { name: string; detail: string; imageUrl?: string; onPress: () => void }) {
  return <MotionPressable accessibilityRole="button" onPress={onPress} style={styles.result}>
    <FoodThumb label={name} imageUrl={imageUrl} size={46} />
    <View style={{ flex: 1, gap: 4 }}><Text style={form.label}>{name}</Text><Text style={form.muted}>{detail}</Text></View>
    <Text style={styles.arrow}>›</Text>
  </MotionPressable>;
}
const styles = StyleSheet.create({
  eyebrow: { color: colors.sageDark, fontSize: 12, letterSpacing: 1.2, fontWeight: '800' },
  heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, justifyContent: 'space-between' },
  badge: { color: colors.sageDark, backgroundColor: colors.aquaPale, padding: 6, borderRadius: 8, fontWeight: '800', fontSize: 12 },
  result: { borderTopColor: colors.line, borderTopWidth: 1, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 58 },
  arrow: { color: colors.sageDark, fontSize: 26 },
  linkButton: { minHeight: 44, justifyContent: 'center' }, link: { color: colors.sageDark, fontSize: 12, fontWeight: '700' },
  estimate: { backgroundColor: colors.violetPale, borderRadius: 16, padding: 16, gap: 4 }, total: { color: colors.navy, fontSize: 27, fontWeight: '800' },
});
