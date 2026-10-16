import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { CIQUAL_SOURCE, FoodSegment, initialQuantity, parseFoodSegment, quickPortion, recentFoods, searchFoods, splitMealText } from '../domain/food-search';
import { portionIssue, ProductCandidate, productToFood, readNumber, scaleReference } from '../domain/foods';
import { countLabel, measuresFor, quantityFor, referenceForDisplay, stepCount } from '../domain/measures';
import { searchProducts } from '../services/products';
import { FoodThumb } from './FoodThumb';
import { track } from '../services/test-journal';
import { useApp } from '../state/AppContext';
import { colors, fonts } from '../theme';
import { RecognizedFood, SavedFood } from '../types';
import { ManualFoodForm, SourceLink } from './FoodEntryForms';
import { Action, Choice, Field, form } from './FormControls';
import { RecipeBuilder } from './RecipeBuilder';
import { LabelFoodForm } from './LabelFoodForm';
import { isBurgerQuery } from '../domain/recipes';
import { MotionPressable } from './Motion';
import { AppIcon } from './AppIcon';

export function UnifiedFoodSearch({ onAdd, onDraftChange, initialSpecial = null, autoFocus = false }: { onAdd: (item: RecognizedFood) => void; onDraftChange: (dirty: boolean) => void; initialSpecial?: 'recipe' | 'label' | null; autoFocus?: boolean }) {
  const { savedFoods, forgetFood, meals } = useApp();
  const [text, setText] = useState(''), [current, setCurrent] = useState(0), [manual, setManual] = useState(false);
  const [special, setSpecial] = useState<'recipe' | 'label' | null>(initialSpecial);
  // V4.0 — ouverte depuis le scan, l'étiquette déclenche l'appareil photo d'elle-même.
  const [autoScan, setAutoScan] = useState(initialSpecial === 'label');
  const [selection, setSelection] = useState<SavedFood | ProductCandidate | null>(null);
  const [results, setResults] = useState<ProductCandidate[]>([]), [busy, setBusy] = useState(false), [searched, setSearched] = useState(false), [error, setError] = useState('');
  const request = useRef<AbortController | null>(null), sequence = useRef(0);
  const segments = useMemo(() => splitMealText(text), [text]);
  const segment = segments[current] ?? parseFoodSegment('');
  const local = useMemo(() => searchFoods(segment.query, savedFoods), [segment.query, savedFoods]);
  const recents = useMemo(() => recentFoods(meals, savedFoods, 6), [meals, savedFoods]);
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
  if (special === 'label') return <LabelFoodForm initialName={segment.query} autoStart={autoScan} onCancel={() => { setAutoScan(false); setSpecial(null); }} onAdd={item => { setAutoScan(false); complete(item); }} />;
  if (selection) return <Quantity key={`${selection.id}-${segment.text}`} selection={selection} segment={segment} onCancel={() => setSelection(null)} onAdd={complete} onForget={'reference' in selection && savedFoods.some(f => f.id === selection.id) ? () => { forgetFood(selection.id); setSelection(null); } : undefined} />;
  // V4.1 — un appui sur le + ajoute une portion courante, sans étape de quantité.
  const quick = (food: SavedFood) => { track('aliment-cherche'); complete(quickPortion(food).item); };
  const row = (food: SavedFood) => {
    const portion = quickPortion(food);
    return <Result key={food.id} name={food.name} imageUrl={food.reference.imageUrl} detail={`${portion.label} · ${portion.item.calories.estimated} kcal`} onPress={() => { track('aliment-cherche'); setSelection(food); }} onQuickAdd={() => quick(food)} />;
  };
  const typed = segment.query.length > 0;
  return <View style={{ gap: 14 }}>
    {/* V4.1 — écrire, c'est tout : les propositions suivent la frappe dès la 2e lettre,
        chacune avec son + pour l'ajouter d'un appui. Le reste (scan, plat maison,
        aliment perso) attend sous le champ tant qu'on n'a rien écrit. */}
    <View style={form.card}>
      <Text style={styles.heading1}>Qu’as-tu mangé ?</Text>
      <TextInput accessibilityLabel="Aliment, quantité ou description du repas" value={text} onChangeText={change} multiline maxLength={400} autoFocus={autoFocus} placeholder="Tape un aliment : riz, pomme, 2 œufs…" placeholderTextColor={colors.muted} style={[form.input, styles.search]} />
      {segments.length > 1 && <View style={form.row}>{segments.map((s, index) => <Choice key={`${index}-${s.text}`} label={s.text} selected={current === index} onPress={() => { cancelRequest(); setCurrent(index); setManual(false); }} />)}</View>}
      {text.trim() ? <MotionPressable accessibilityRole="button" onPress={() => change('')} style={styles.linkButton}><Text style={styles.link}>Effacer la saisie restante</Text></MotionPressable> : null}
      {!text.trim() && <View style={styles.shortcuts}>
        <MotionPressable accessibilityRole="button" accessibilityLabel="Scanner une étiquette" onPress={() => setSpecial('label')} containerStyle={styles.shortcutOuter} style={[styles.shortcut, styles.shortcutScan]}>
          <AppIcon name="camera" size={22} color={colors.white} strokeWidth={2} />
          <Text style={styles.shortcutScanText}>Scanner</Text>
        </MotionPressable>
        <MotionPressable accessibilityRole="button" accessibilityLabel="Composer un plat maison" onPress={() => setSpecial('recipe')} containerStyle={styles.shortcutOuter} style={styles.shortcut}>
          <AppIcon name="list" size={22} color={colors.violet} strokeWidth={2} />
          <Text style={styles.shortcutText}>Plat maison</Text>
        </MotionPressable>
        <MotionPressable accessibilityRole="button" accessibilityLabel="Ajouter mon propre aliment" onPress={() => setManual(true)} containerStyle={styles.shortcutOuter} style={styles.shortcut}>
          <AppIcon name="edit" size={22} color={colors.violet} strokeWidth={2} />
          <Text style={styles.shortcutText}>Mon aliment</Text>
        </MotionPressable>
      </View>}
    </View>
    {!manual && <>
      {isBurgerQuery(segment.query) && <View style={[form.card, { backgroundColor: colors.violetPale }]}><Text style={form.title}>Burger maison au bœuf</Text><Text style={form.copy}>Pain, steak, fromage, sauce… ajuste ta recette et calcule les kcal de ton burger.</Text><Action label="Personnaliser mon burger" onPress={() => setSpecial('recipe')} /></View>}

      {!typed && recents.length > 0 && <View style={form.card}>
        <Text style={form.title}>Tes aliments récents</Text>
        {recents.map(row)}
      </View>}
      {!typed && recents.length === 0 && <View style={form.card}>
        <Text style={form.title}>Un essai ?</Text>
        <View style={form.row}>{['Riz cuit', 'Œuf dur', 'Banane', 'Yaourt nature'].map(example => <Choice key={example} label={example} selected={false} onPress={() => change(example)} />)}</View>
      </View>}

      {typed ? <View style={form.card}>
        {local.map(row)}
        {!local.length && <Text style={form.copy}>Rien trouvé pour « {segment.query} ». Essaie un nom plus simple, ou ajoute-le toi-même.</Text>}
        <MotionPressable accessibilityRole="button" accessibilityLabel={`Ajouter ${segment.query} moi-même, avec mes calories`} onPress={() => setManual(true)} style={styles.own}>
          <View style={styles.ownPlus}><AppIcon name="plus" size={18} color={colors.violet} strokeWidth={2.4} /></View>
          <Text style={styles.ownText} numberOfLines={2}>Ajouter « {segment.query} » moi-même</Text>
        </MotionPressable>
      </View> : null}

      {/* La recherche de marque n'a de sens qu'avec un nom : elle reste cachée
          tant que le champ est vide. */}
      {segment.query.length >= 3 && <View style={form.card}>
        <Action label={busy ? 'Recherche de la marque…' : `Chercher « ${segment.query} » parmi les marques`} secondary disabled={busy} onPress={() => void search()} />
        {busy && <ActivityIndicator color={colors.violet} />}
        {error ? <Text accessibilityRole="alert" style={form.error}>{error}</Text> : null}
        {searched && !results.length && <Text style={form.copy}>Aucun produit avec des calories renseignées. Essaie un nom plus précis.</Text>}
        {results.map(product => <Result key={product.id} name={product.name} imageUrl={product.imageUrl} detail={`${product.brand} · ≈ ${Math.round(product.kcal100)} kcal / 100 g ou ml`} onPress={() => { track('aliment-cherche'); setSelection(product); }} />)}
        {(busy || searched || results.length > 0) && <Text style={form.muted}>Cette recherche envoie seulement les mots recherchés à Open Food Facts. Le profil et le journal restent sur ton appareil.</Text>}
        {results.length > 0 && <SourceLink />}
      </View>}
      {typed && <SourceLink url={CIQUAL_SOURCE} label="Valeurs moyennes : Anses, Ciqual 2025, licence ouverte" />}
    </>}
    {manual && <><Action label="Retour à la recherche" secondary onPress={() => setManual(false)} /><ManualFoodForm initialName={segment.query} onAdd={complete} /></>}
  </View>;
}

/**
 * V3.3 — « combien en as-tu pris ? », en mesures de cuisine.
 *
 * Cette étape demandait une quantité en grammes, champ vide. Pour un lait,
 * cela revenait à demander de convertir un bol en grammes de tête : en
 * pratique on laissait 100, et le chiffre était faux.
 *
 * Les mesures viennent du domaine (`measures.ts`), qui déduit la famille de
 * l'aliment de son nom. Le champ libre n'a pas disparu — il est derrière un
 * lien, pour qui pèse vraiment ses aliments.
 */
function Quantity({ selection, segment, onAdd, onCancel, onForget }: { selection: SavedFood | ProductCandidate; segment: FoodSegment; onAdd: (item: RecognizedFood) => void; onCancel: () => void; onForget?: () => void }) {
  const { rememberFood } = useApp();
  const product = 'kcal100' in selection ? selection : null;
  const [unit, setUnit] = useState<'g' | 'ml' | null>(null), [remember, setRemember] = useState(true);
  const base = product ? (unit ? productToFood(product, unit) : null) : selection as SavedFood;
  // Un liquide se présente en millilitres, même si Ciqual le mesure en grammes.
  const food = base ? { ...base, reference: product ? base.reference : referenceForDisplay(base) } : null;

  const initial = product ? null : initialQuantity(selection as SavedFood, segment);
  // Une quantité écrite dans la description l'emporte : la personne a déjà
  // répondu, on ne va pas lui reposer la question.
  const saisie = Boolean(initial?.quantity && segment.quantity !== null);
  const [mode, setMode] = useState<'mesures' | 'pesee'>(saisie ? 'pesee' : 'mesures');
  const [quantity, setQuantity] = useState(saisie ? initial!.quantity : '');
  const [error, setError] = useState('');
  const [forgetting, setForgetting] = useState(false);

  // Un aliment compté en portions (le tien, un plat maison) n'a pas de mesure en grammes.
  const mesures = useMemo(() => ('reference' in selection && selection.reference.unit === 'portion' ? [] : measuresFor(selection.name)), [selection]);
  const [measureId, setMeasureId] = useState(mesures[0]?.id ?? '');
  const [count, setCount] = useState(1);
  const mesure = mesures.find(item => item.id === measureId) ?? mesures[0];

  const uniteAffichee = food ? food.reference.unit : 'g';
  const qty = mode === 'mesures' ? (mesure ? quantityFor(mesure, count) : null) : readNumber(quantity);
  const issue = food && qty !== null ? portionIssue(qty, food.reference) : null;
  const preview = food && qty !== null && !issue ? scaleReference(food, qty) : null;

  return <View style={form.card}>
    <Action label="Retour à la recherche" secondary onPress={onCancel} />
    <Text style={styles.heading1}>Combien en as-tu pris ?</Text>
    <Text style={form.title}>{selection.name}</Text>
    {product && <><Text style={form.copy}>{product.brand} {product.package}</Text><Text style={form.label}>Sur l’étiquette : pour 100 g ou 100 ml ?</Text><Text style={form.muted}>Le service fournit une référence normalisée : vérifie son unité. Le poids et le volume ne sont pas convertis.</Text><View style={form.row}>{(['g', 'ml'] as const).map(u => <Choice key={u} label={`Pour 100 ${u}`} selected={unit === u} onPress={() => { setUnit(u); setMode('mesures'); setCount(1); }} />)}</View></>}

    {food && <>
      <Text style={form.copy}>{Math.round(food.reference.calories.estimated)} kcal pour {food.reference.amount} {uniteAffichee}</Text>
      {food.reference.description ? <Text style={form.muted}>{food.reference.description}</Text> : null}

      {mode === 'mesures' && mesure ? <>
        <View style={form.row}>
          {mesures.map(item => (
            <MotionPressable
              key={item.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: item.id === mesure.id }}
              accessibilityLabel={`${item.label}, ${item.amount} ${uniteAffichee}`}
              onPress={() => { setMeasureId(item.id); setCount(1); setError(''); }}
              style={[styles.mesure, item.id === mesure.id && styles.mesureOn]}
            >
              <Text style={[styles.mesureNom, item.id === mesure.id && styles.mesureNomOn]}>{item.label}</Text>
              <Text style={styles.mesureEquiv}>{item.amount.toLocaleString('fr-FR')} {uniteAffichee}</Text>
            </MotionPressable>
          ))}
        </View>
        <View style={styles.compteur}>
          <MotionPressable accessibilityRole="button" accessibilityLabel="Enlever une demi-mesure" onPress={() => setCount(value => stepCount(value, -1))} style={styles.compteurBouton}>
            <Text style={styles.compteurSigne}>−</Text>
          </MotionPressable>
          <View style={styles.compteurCentre} accessibilityLiveRegion="polite">
            <Text style={styles.compteurTexte}>{countLabel(mesure, count)}</Text>
            <Text style={styles.compteurEquiv}>{qty?.toLocaleString('fr-FR')} {uniteAffichee}</Text>
          </View>
          <MotionPressable accessibilityRole="button" accessibilityLabel="Ajouter une demi-mesure" onPress={() => setCount(value => stepCount(value, 1))} style={styles.compteurBouton}>
            <Text style={styles.compteurSigne}>+</Text>
          </MotionPressable>
        </View>
      </> : <>
        <Field label={`Quantité consommée (${food.reference.portionName ?? uniteAffichee})`} numeric value={quantity} onChange={setQuantity} placeholder={`Ex. : ${food.reference.amount}`} />
        {initial?.note ? <Text style={form.muted}>{initial.note}</Text> : null}
      </>}

      {preview && <View style={styles.estimate}><Text style={styles.total}>≈ {preview.calories.estimated.toLocaleString('fr-FR')} kcal</Text><Text style={form.muted}>pour cette quantité · estimation à confirmer</Text></View>}

      <MotionPressable accessibilityRole="button" onPress={() => { setMode(mode === 'mesures' ? 'pesee' : 'mesures'); setError(''); }} style={styles.linkButton}>
        <Text style={styles.link}>{mode === 'mesures' ? `Je préfère ${uniteAffichee === 'ml' ? 'saisir en ml' : 'peser en grammes'}` : 'Revenir aux mesures courantes'}</Text>
      </MotionPressable>

      {!food.reference.macrosComplete && <Text style={form.muted}>Les macronutriments manquants seront signalés dans le bilan.</Text>}
    </>}

    {product && <><SourceLink url={product.url} /><View style={styles.heading}><Text style={[form.copy, { flex: 1 }]}>Mémoriser ce produit</Text><Switch accessibilityLabel="Mémoriser ce produit" value={remember} onValueChange={setRemember} trackColor={{ true: colors.violet }} /></View></>}
    {error || issue ? <Text style={form.error} accessibilityRole="alert">{error || issue}</Text> : null}
    <Action label="Ajouter au repas" disabled={!food} onPress={() => { if (!food || !preview) { setError(issue ?? 'Indique la quantité consommée.'); return; } if (product && remember) rememberFood(food); onAdd(preview); }} />
    {onForget && (forgetting ? <><Text style={form.muted}>Retirer de tes aliments mémorisés ? Les repas déjà saisis restent dans le journal.</Text><Action label="Retirer cet aliment mémorisé" secondary onPress={onForget} /><Action label="Le garder" secondary onPress={() => setForgetting(false)} /></> : <MotionPressable onPress={() => setForgetting(true)} accessibilityRole="button" style={styles.linkButton}><Text style={styles.link}>Oublier cet aliment mémorisé</Text></MotionPressable>)}
  </View>;
}
function Result({ name, detail, imageUrl, onPress, onQuickAdd }: { name: string; detail: string; imageUrl?: string; onPress: () => void; onQuickAdd?: () => void }) {
  return <View style={styles.result}>
    <MotionPressable accessibilityRole="button" accessibilityLabel={`${name}, ${detail}. Choisir la quantité`} onPress={onPress} containerStyle={{ flex: 1, minWidth: 0 }} style={styles.resultMain}>
      <FoodThumb label={name} imageUrl={imageUrl} size={46} />
      <View style={{ flex: 1, gap: 3 }}><Text style={form.label} numberOfLines={2}>{name}</Text><Text style={form.muted}>{detail}</Text></View>
      {!onQuickAdd && <Text style={styles.arrow}>›</Text>}
    </MotionPressable>
    {onQuickAdd && <MotionPressable accessibilityRole="button" accessibilityLabel={`Ajouter ${name} au repas`} onPress={onQuickAdd} style={styles.quick}>
      <AppIcon name="plus" size={22} color={colors.white} strokeWidth={2.4} />
    </MotionPressable>}
  </View>;
}
const styles = StyleSheet.create({
  mesure: { minWidth: 96, borderWidth: 1.5, borderColor: colors.line, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.background },
  mesureOn: { borderColor: colors.violet, backgroundColor: colors.violetPale },
  mesureNom: { color: colors.ink, fontSize: 14, lineHeight: 19, fontFamily: fonts.bold },
  mesureNomOn: { color: colors.violet },
  mesureEquiv: { color: colors.muted, fontSize: 11, lineHeight: 15, fontFamily: fonts.semibold, marginTop: 1 },
  compteur: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.violetPale, borderRadius: 20, padding: 8 },
  compteurBouton: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  compteurSigne: { color: colors.violet, fontSize: 22, lineHeight: 26, fontFamily: fonts.extrabold },
  compteurCentre: { flex: 1, alignItems: 'center' },
  compteurTexte: { color: colors.navy, fontSize: 17, lineHeight: 22, fontFamily: fonts.extrabold },
  compteurEquiv: { color: colors.violet, fontSize: 12, lineHeight: 16, fontFamily: fonts.semibold },
  heading1: { color: colors.navy, fontSize: 22, lineHeight: 28, fontFamily: fonts.display, letterSpacing: -0.3 },
  search: { minHeight: 52, fontSize: 17, textAlignVertical: 'top' },
  shortcuts: { flexDirection: 'row', gap: 8 },
  shortcutOuter: { flex: 1 },
  shortcut: { alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 76, borderRadius: 16, paddingHorizontal: 6, backgroundColor: colors.violetPale },
  shortcutScan: { backgroundColor: colors.navy },
  shortcutScanText: { flexShrink: 1, color: colors.white, fontSize: 13, fontFamily: fonts.bold, textAlign: 'center' },
  shortcutText: { flexShrink: 1, color: colors.navy, fontSize: 13, fontFamily: fonts.bold, textAlign: 'center' },
  heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, justifyContent: 'space-between' },
  badge: { color: colors.sageDark, backgroundColor: colors.aquaPale, padding: 6, borderRadius: 8, fontFamily: fonts.extrabold, fontSize: 12 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 62 },
  resultMain: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 62, paddingVertical: 6 },
  quick: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  own: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: 8 },
  ownPlus: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.violetPale, alignItems: 'center', justifyContent: 'center' },
  ownText: { flex: 1, color: colors.sageDark, fontSize: 14, lineHeight: 19, fontFamily: fonts.bold },
  arrow: { color: colors.sageDark, fontSize: 26, fontFamily: fonts.medium },
  linkButton: { minHeight: 44, justifyContent: 'center' }, link: { color: colors.sageDark, fontSize: 12, fontFamily: fonts.bold },
  estimate: { backgroundColor: colors.violetPale, borderRadius: 16, padding: 16, gap: 4 }, total: { color: colors.navy, fontSize: 27, fontFamily: fonts.extrabold },
});
