import React, { useMemo, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { searchFoods } from '../domain/food-search';
import { portionIssue, readNumber, scaleReference } from '../domain/foods';
import { burgerIngredients, isBurgerQuery, makeRecipe, RecipeIngredient } from '../domain/recipes';
import { useApp } from '../state/AppContext';
import { colors } from '../theme';
import { RecognizedFood } from '../types';
import { Action, Choice, Field, form } from './FormControls';
import { MotionPressable } from './Motion';

type Draft = Omit<RecipeIngredient, 'quantity'> & { quantity: string };
export function RecipeBuilder({ initialName, onAdd, onCancel }: { initialName: string; onAdd: (food: RecognizedFood) => void; onCancel: () => void }) {
  const { savedFoods, rememberFood } = useApp();
  const burger = isBurgerQuery(initialName);
  const [name, setName] = useState(burger ? 'Burger maison au bœuf' : initialName);
  const [items, setItems] = useState<Draft[]>(() => burger ? burgerIngredients().map(i => ({ ...i, quantity: String(i.quantity) })) : []);
  const [search, setSearch] = useState(''), [servings, setServings] = useState('1'), [eaten, setEaten] = useState('1'), [remember, setRemember] = useState(true);
  const matches = useMemo(() => search.trim().length >= 2 ? searchFoods(search, savedFoods.filter(f => f.reference.source !== 'recipe'), 6) : [], [search, savedFoods]);
  const [confirmed, setConfirmed] = useState(false), [error, setError] = useState('');
  let food = null, preview = null, issue = '';
  try {
    food = makeRecipe(name, items.map(i => ({ ...i, quantity: readNumber(i.quantity) ?? NaN })), readNumber(servings) ?? NaN);
    const qty = readNumber(eaten) ?? NaN;
    issue = portionIssue(qty, food.reference) ?? '';
    if (!issue) preview = scaleReference(food, qty);
  } catch (e) { issue = e instanceof Error ? e.message : 'Vérifie ta recette.'; }
  const editItems = (next: Draft[]) => { setItems(next); setConfirmed(false); };
  return <View style={{ gap: 14 }}>
    <Action label="Retour à la recherche" secondary onPress={onCancel} />
    <View style={form.card}><Text style={form.title}>{burger ? 'Ton burger, ta recette' : 'Composer mon plat maison'}</Text><Text style={form.copy}>Choisis les ingrédients et leurs quantités : les kcal du plat se calculent ensemble.</Text><Field label="Nom du plat" value={name} onChange={setName} />
      {burger && <Text style={form.muted}>Exemple prérempli pour un burger : pain 75 g, steak cuit à 15 % de matière grasse 100 g, cheddar 20 g, tomate 40 g, salade 15 g, ketchup 15 g. Modifie les quantités, retire ou remplace les ingrédients. Ajoute l’huile si tu en utilises.</Text>}
    </View>
    {items.map((item, index) => <View key={item.key} style={form.card}><Text style={form.label}>{item.food.name}</Text><Text style={form.muted}>{Math.round(item.food.reference.calories.estimated)} kcal / {item.food.reference.amount} {item.food.reference.unit} · {item.food.reference.source === 'ciqual' ? 'Ciqual 2025' : 'Mes aliments'}</Text><Field label={`Quantité dans toute la recette (${item.food.reference.unit})`} numeric value={item.quantity} onChange={q => editItems(items.map((v, i) => i === index ? { ...v, quantity: q } : v))} /><Action secondary label="Retirer / remplacer cet ingrédient" onPress={() => editItems(items.filter((_, i) => i !== index))} /></View>)}
    <View style={form.card}><Field label="Ajouter un ingrédient" value={search} onChange={setSearch} placeholder="Ex. steak haché 5 %, huile, pain…" />
      {matches.map(match => <MotionPressable key={match.id} accessibilityRole="button" style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line }} onPress={() => { editItems([...items, { key: `${match.id}-${Date.now()}`, food: match, quantity: String(match.reference.amount) }]); setSearch(''); }}><Text style={form.label}>+ {match.name}</Text></MotionPressable>)}
      {search.trim().length >= 2 && !matches.length && <Text style={form.muted}>Essaie un ingrédient simple. Tu peux aussi mémoriser un produit ou une étiquette dans Ajouter un repas, puis l’utiliser ici.</Text>}
      {!items.length && <Choice label="Partir du burger maison au bœuf" selected={false} onPress={() => { setName('Burger maison au bœuf'); editItems(burgerIngredients().map(i => ({ ...i, quantity: String(i.quantity) }))); }} />}
    </View>
    <View style={form.card}><Field label="Toute la recette donne combien de portions ?" numeric value={servings} onChange={v => { setServings(v); setConfirmed(false); }} /><Field label="Combien de ces portions as-tu mangées ?" numeric value={eaten} onChange={setEaten} />
      {preview && <><Text style={{ fontSize: 28, color: colors.navy, fontWeight: '800' }}>≈ {preview.calories.estimated} kcal</Text><Text style={form.muted}>pour {eaten} portion(s) · les valeurs dépendent de la cuisson et des ingrédients</Text></>}
      <Choice label="J’ai vérifié les ingrédients, la cuisson et les quantités" selected={confirmed} onPress={() => setConfirmed(!confirmed)} />
      <View style={form.row}><Text style={[form.copy, { flex: 1 }]}>Mémoriser ma recette</Text><Switch accessibilityLabel="Mémoriser ma recette" value={remember} onValueChange={setRemember} /></View>
      {error ? <Text accessibilityRole="alert" style={form.error}>{error}</Text> : null}
      <Action label="Ajouter mon plat au repas" disabled={!confirmed} onPress={() => { if (!preview || !food || search.trim()) { setError(search.trim() ? 'Ajoute l’ingrédient recherché ou efface sa recherche avant de valider.' : issue); return; } if (remember) rememberFood(food); onAdd(preview); }} />
    </View>
  </View>;
}
