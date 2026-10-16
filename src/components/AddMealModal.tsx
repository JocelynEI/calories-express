import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { totalRecognized } from '../domain/calories';
import { dayLabel, timestampForDay } from '../domain/date';
import { itemQuantityLabel, portionIssue, readNumber, scaleReference, sourceLabel } from '../domain/foods';
import { momentForHour, newMealId } from '../domain/meals';
import { useApp } from '../state/AppContext';
import { useExperience } from '../state/ExperienceContext';
import { colors, MAX_FONT_SCALE, fonts } from '../theme';
import { Meal, MealMoment, RecognizedFood } from '../types';
import { Action, Choice, form } from './FormControls';
import { UnifiedFoodSearch } from './UnifiedFoodSearch';
import { MotionPressable } from './Motion';

type EditableFood = RecognizedFood & { entryId: string };

const moments: MealMoment[] = ['Petit-déjeuner', 'Déjeuner', 'Goûter', 'Dîner', 'Snack'];

/** V4.0 — par où l'ajout commence : la recherche, l'étiquette ou le plat maison. */
export type AddStart = 'search' | 'label' | 'recipe';

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdded: (meal: Meal) => void;
  /** V1.8 — repas existant à modifier. Absent : nouvelle entrée. */
  meal?: Meal | null;
  /** V4.0 — le moment choisi d'avance (le + d'une ligne de l'accueil). */
  initialMoment?: MealMoment;
  /** V4.0 — ouvrir directement l'étiquette ou le plat maison. */
  startWith?: AddStart;
};

export function AddMealModal({ visible, onClose, onAdded, meal = null, initialMoment, startWith = 'search' }: Props) {
  const { addMeal, updateMeal, selectedDay, today } = useApp();
  const { reducedMotion } = useExperience();
  const editing = meal !== null;
  const entrySequence = useRef(0);
  const editable = useCallback((item: RecognizedFood): EditableFood => ({ ...item, entryId: String(++entrySequence.current) }), []);

  const [draftFood, setDraftFood] = useState(false);
  const [moment, setMoment] = useState<MealMoment>(meal ? meal.moment : initialMoment ?? momentForHour(new Date().getHours()));
  const [items, setItems] = useState<EditableFood[]>(() => (meal ? meal.items.map(item => ({ ...item, entryId: String(++entrySequence.current) })) : []));
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [discard, setDiscard] = useState(false);
  const submitted = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const [pending, setPending] = useState<string[]>([]);

  const onPending = useCallback((id: string, dirty: boolean) => setPending(current => (dirty
    ? current.includes(id) ? current : [...current, id]
    : current.includes(id) ? current.filter(key => key !== id) : current)), []);

  const total = useMemo(() => totalRecognized(items), [items]);
  const dirty = editing
    ? items.length !== meal.items.length || moment !== meal.moment || draftFood
    : items.length > 0 || draftFood;

  const onItem = (item: RecognizedFood) => {
    setItems(current => [...current, editable(item)]);
    setError('');
    setNotice(`Ajouté : ${item.name}`);
  };

  const close = () => {
    if (dirty) { setDiscard(true); scroll.current?.scrollTo({ y: 0, animated: !reducedMotion }); }
    else onClose();
  };

  const confirm = () => {
    if (submitted.current) return;
    if (!items.length) { setError('Ajoute au moins un aliment au repas.'); return; }
    if (draftFood) { setError('Il reste une saisie à traiter. Ajoute cet aliment ou efface la saisie restante avant de valider.'); return; }
    if (pending.length) { setError('Applique les quantités modifiées avant d’enregistrer le repas.'); return; }
    submitted.current = true;
    const description = items.map(item => `${item.name} · ${itemQuantityLabel(item)}`).join(' + ');
    const next: Meal = editing
      ? { ...meal, moment, description, items: items.map(({ entryId, ...item }) => item), ...total }
      : {
        id: newMealId(),
        createdAt: timestampForDay(selectedDay),
        moment,
        method: 'phrase',
        description,
        items: items.map(({ entryId, ...item }) => item),
        ...total,
      };
    if (editing) updateMeal(next); else addMeal(next);
    onAdded(next);
  };

  return (
    <Modal visible={visible} animationType={reducedMotion ? 'none' : 'slide'} presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>{editing ? 'Modifier ce repas' : 'Ajouter un repas'}</Text>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.day}>
                {editing ? 'Le moment et les aliments restent modifiables.' : dayLabel(selectedDay, today)}
              </Text>
            </View>
            <MotionPressable accessibilityRole="button" accessibilityLabel="Fermer le repas" onPress={close} style={styles.close}>
              <Text maxFontSizeMultiplier={1.2} style={styles.closeText}>×</Text>
            </MotionPressable>
          </View>

          <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {discard && (
              <View style={form.card}>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.title}>{editing ? 'Abandonner les modifications ?' : 'Quitter ce repas ?'}</Text>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.copy}>
                  {editing
                    ? 'Le repas enregistré restera tel qu’il était avant tes changements.'
                    : 'Les aliments de ce repas ne seront pas enregistrés dans le journal.'}
                </Text>
                <Action label={editing ? 'Continuer la modification' : 'Continuer mon repas'} onPress={() => setDiscard(false)} />
                <Action label="Quitter sans enregistrer" secondary onPress={onClose} />
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moments}>
              {moments.map(value => <Choice key={value} label={value} selected={moment === value} onPress={() => setMoment(value)} />)}
            </ScrollView>

            <UnifiedFoodSearch onAdd={onItem} onDraftChange={setDraftFood} initialSpecial={editing || startWith === 'search' ? null : startWith} autoFocus={!editing && startWith === 'search'} />

            <View style={form.card}>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.title}>Ton repas{items.length ? ` · ${items.length} aliment${items.length > 1 ? 's' : ''}` : ''}</Text>
              {!items.length && <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.muted}>Les aliments ajoutés apparaîtront ici.</Text>}
              {items.map((item, index) => (
                <SelectedItem
                  key={item.entryId}
                  item={item}
                  onPending={onPending}
                  onRemove={() => setItems(current => current.filter((_, position) => position !== index))}
                  onChange={next => setItems(current => current.map((value, position) => (position === index ? { ...next, entryId: value.entryId } : value)))}
                />
              ))}
              {items.some(item => item.macrosComplete === false) && (
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.muted}>
                  Macronutriments partiels : les valeurs manquantes ne sont pas assimilées à zéro dans le bilan.
                </Text>
              )}
            </View>
          </ScrollView>

          {/* V4.1 — le total et l'enregistrement restent sous le pouce : on ajoute
              d'un appui sur un +, et on voit tout de suite le repas grossir. */}
          {(items.length > 0 || editing) && (
            <View style={styles.footer}>
              {notice ? <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.notice} numberOfLines={1}>✓ {notice}</Text> : null}
              {error ? <Text accessibilityRole="alert" maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.error}>{error}</Text> : null}
              {pending.length > 0 && <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.error}>Applique les quantités modifiées pour actualiser ce total.</Text>}
              <View style={styles.footerRow}>
                <MotionPressable accessibilityRole="button" accessibilityLabel="Voir les aliments de ce repas" onPress={() => scroll.current?.scrollToEnd({ animated: !reducedMotion })} containerStyle={{ flexShrink: 1 }} style={styles.summary}>
                  <Text maxFontSizeMultiplier={1.3} style={styles.summaryKcal}>{total.calories.estimated.toLocaleString('fr-FR')} kcal</Text>
                  <Text maxFontSizeMultiplier={1.3} style={styles.summaryCount}>{items.length} aliment{items.length > 1 ? 's' : ''}</Text>
                </MotionPressable>
                <View style={{ flex: 1 }}>
                  <Action label={editing ? 'Enregistrer' : 'Enregistrer le repas'} disabled={!items.length || pending.length > 0} onPress={confirm} />
                </View>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

function SelectedItem({ item, onRemove, onChange, onPending }: { item: EditableFood; onRemove: () => void; onChange: (item: RecognizedFood) => void; onPending: (id: string, dirty: boolean) => void }) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [error, setError] = useState('');
  useEffect(() => { onPending(item.entryId, quantity !== String(item.quantity)); return () => onPending(item.entryId, false); }, [item.entryId, item.quantity, quantity, onPending]);
  useEffect(() => { setQuantity(String(item.quantity)); }, [item.quantity]);

  const update = () => {
    const number = readNumber(quantity);
    const reference = item.reference;
    if (!reference) {
      // Les repas saisis avant la V1.6 n'ont pas de référence : sans elle, la
      // quantité ne peut pas être recalculée sans inventer des valeurs.
      setError('Cet aliment a été enregistré par une version plus ancienne, sans sa référence de calcul. Retire-le puis ajoute-le à nouveau pour changer la quantité.');
      return;
    }
    if (number === null) { setError('Vérifie la quantité.'); return; }
    const issue = portionIssue(number, reference);
    if (issue) { setError(issue); return; }
    onChange(scaleReference({ id: item.foodId, name: item.name, reference }, number));
    setQuantity(String(number));
    setError('');
  };

  return (
    <View style={styles.selected}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[form.label, { flex: 1 }]}>{item.name}</Text>
        <MotionPressable accessibilityRole="button" accessibilityLabel={`Retirer ${item.name}`} onPress={onRemove} style={styles.remove}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.link}>Retirer</Text>
        </MotionPressable>
      </View>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.copy}>{itemQuantityLabel(item)} · {item.calories.estimated} kcal</Text>
      {sourceLabel(item.reference?.source) ? (
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.origin, item.reference?.source === 'label' && styles.originRead]}>{sourceLabel(item.reference?.source)}</Text>
      ) : null}
      <View style={styles.quantity}>
        <TextInput accessibilityLabel={`Quantité de ${item.name}`} keyboardType="decimal-pad" value={quantity} maxLength={12} onChangeText={setQuantity} style={[form.input, { flex: 1, minWidth: 0 }]} />
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.muted}>{item.reference?.portionName ?? item.reference?.unit ?? ''}</Text>
        <Action label="Appliquer" secondary onPress={update} />
      </View>
      {error ? <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.error}>{error}</Text> : null}
    </View>
  );
}


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, width: '100%', maxWidth: 520, alignSelf: 'center' },
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 23, fontFamily: fonts.extrabold, color: colors.navy, letterSpacing: -0.4 },
  day: { fontSize: 13, fontFamily: fonts.semibold, color: colors.muted, marginTop: 3 },
  close: { width: 44, height: 44, backgroundColor: colors.white, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.ink, fontSize: 28, fontFamily: fonts.medium },
  content: { padding: 18, paddingBottom: 35, gap: 16 },
  moments: { gap: 8 },
  selected: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, gap: 7 },
  quantity: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  remove: { minHeight: 44, justifyContent: 'center' },
  link: { fontSize: 13, fontFamily: fonts.extrabold, color: colors.sageDark },
  footer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, gap: 8, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  summary: { minHeight: 44, justifyContent: 'center' },
  summaryKcal: { fontSize: 20, lineHeight: 24, color: colors.navy, fontFamily: fonts.extrabold },
  summaryCount: { fontSize: 12, lineHeight: 16, color: colors.muted, fontFamily: fonts.semibold },
  origin: { alignSelf: 'flex-start', color: colors.muted, backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, fontSize: 12, lineHeight: 16, fontFamily: fonts.semibold, overflow: 'hidden' },
  originRead: { color: colors.violet, backgroundColor: colors.violetPale },
  notice: { color: '#096B5B', fontSize: 13, lineHeight: 18, fontFamily: fonts.bold },
});
