import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { foodFromLabel, LabelBasis, LabelDetection, parseLabelText, pieceWeightFromPack } from '../domain/labels';
import { readNumber, scaleReference } from '../domain/foods';
import { track } from '../services/test-journal';
import { useApp } from '../state/AppContext';
import { colors, fonts, MAX_FONT_SCALE } from '../theme';
import { RecognizedFood } from '../types';
import { Action, Choice, Field, form } from './FormControls';
import { MotionPressable } from './Motion';
import { OcrReader } from './OcrReader';

/** Les références possibles, dites comme on les lit sur un paquet. */
const BASES: { id: LabelBasis; label: string; hint: string }[] = [
  { id: '100g', label: 'Pour 100 g', hint: 'Le plus courant' },
  { id: '100ml', label: 'Pour 100 ml', hint: 'Une boisson' },
  { id: 'piece', label: 'Pour 1 pièce', hint: '1 biscuit, 1 barre…' },
  { id: 'serving', label: 'Pour 1 portion', hint: 'Plusieurs pièces' },
];
const PIECE_NAMES = ['biscuit', 'barre', 'gâteau', 'carré', 'tranche', 'pièce'];
const GRAM_SHORTCUTS = [30, 50, 100, 150];
const ML_SHORTCUTS = [150, 250, 330, 500];
const FALLBACK_NAME = 'Produit scanné';

type Props = { initialName: string; onAdd: (food: RecognizedFood) => void; onCancel: () => void; autoStart?: boolean };

/**
 * V4.0.1 — l'étiquette en trois questions.
 *
 * Après la photo, l'écran était un formulaire complet : nom, valeurs lues,
 * champ kcal, quatre références, poids, quantité, texte brut, case à cocher.
 * On ne savait pas par où commencer, et une valeur mal lue (« 0 kcal ») était
 * déjà sélectionnée.
 *
 * Maintenant, l'application pose trois questions, l'une après l'autre :
 *   1. Combien de kcal sur l'étiquette ? (ce qu'elle a lu, en gros, à confirmer)
 *   2. Pour quelle quantité ? (100 g, 100 ml, 1 pièce, 1 portion)
 *   3. Combien en as-tu mangé ? (en grammes ou en pièces, avec des raccourcis)
 * Le résultat s'affiche en grand, et le bouton dit exactement ce qu'il ajoute.
 * Le reste (nom, mémorisation, texte lu) vient après, sans bloquer.
 *
 * Le calcul ne change pas : il reste dans `foodFromLabel`.
 */
export function LabelFoodForm({ initialName, onAdd, onCancel, autoStart = false }: Props) {
  const { rememberFood } = useApp();
  const [name, setName] = useState(initialName), [uri, setUri] = useState(''), [base64, setBase64] = useState(''), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0);
  const [detected, setDetected] = useState<LabelDetection | null>(null), [raw, setRaw] = useState(''), [showRaw, setShowRaw] = useState(false), [permissionDenied, setPermissionDenied] = useState(false);
  const [energy, setEnergy] = useState(''), [typing, setTyping] = useState(false), [basis, setBasis] = useState<LabelBasis | null>(null);
  const [byPiece, setByPiece] = useState(false), [pieceName, setPieceName] = useState('biscuit');
  const [grams, setGrams] = useState(''), [piecesRef, setPiecesRef] = useState(''), [quantity, setQuantity] = useState(''), [packMode, setPackMode] = useState(false), [packGrams, setPackGrams] = useState(''), [packCount, setPackCount] = useState('');
  const [remember, setRemember] = useState(true), [error, setError] = useState('');
  const alive = useRef(true), sequence = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; sequence.current++; }; }, []);
  const fail = (message: string) => { setBusy(false); setBase64(''); setError(message); };

  const scan = async (camera: boolean) => {
    const token = ++sequence.current; setError(''); setPermissionDenied(false); setBusy(true); setBase64(''); setProgress(0);
    try {
      if (camera && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) { if (alive.current && token === sequence.current) { setPermissionDenied(true); fail('Autorise l’appareil photo dans les réglages, ou choisis une photo existante.'); } return; }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: false, quality: 1, exif: false };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (!alive.current || token !== sequence.current) return;
      if (result.canceled || !result.assets?.[0]) { setBusy(false); return; }
      const asset = result.assets[0];
      const context = ImageManipulator.manipulate(asset.uri);
      if (Math.max(asset.width, asset.height) > 2000) context.resize(asset.width >= asset.height ? { width: 2000 } : { height: 2000 });
      const rendered = await context.renderAsync();
      const image = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.9, base64: true });
      if (!alive.current || token !== sequence.current) return;
      if (!image.base64 || image.base64.length > 12000000) throw new Error('La photo est trop grande. Rapproche-toi du tableau nutritionnel.');
      setUri(image.uri); setRaw(''); setDetected(null); setEnergy(''); setTyping(false); setBasis(null); setGrams(''); setPiecesRef(''); setPackGrams(''); setPackCount(''); setPackMode(false); setQuantity(''); setBase64(image.base64);
    } catch (e) { if (alive.current && token === sequence.current) fail(e instanceof Error ? e.message : 'La photo n’a pas pu être ouverte.'); }
  };

  // V4.0 — ouverte depuis « Scanner une étiquette », la lecture démarre sans
  // second appui : l'appareil photo s'ouvre tout de suite. Une seule fois.
  const started = useRef(false);
  useEffect(() => {
    if (!autoStart || started.current) return;
    started.current = true;
    void scan(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const acceptText = (text: string) => {
    setBusy(false); setBase64(''); setRaw(text); const result = parseLabelText(text); setDetected(result);
    // V3.1 — le journal de test retient qu'une étiquette a été lue, jamais ce
    // qu'elle contenait.
    track('etiquette-scannee');
    // La valeur la plus probable (la ligne « Énergie ») est proposée, en grand,
    // à confirmer d'un coup d'œil ; les autres restent à un appui.
    if (result.energies.length) setEnergy(String(result.energies[0].value)); else setTyping(true);
    if (result.only100g || /\b100\s*g\b/i.test(text)) setBasis('100g');
    if (result.gramsPerPiece) { setGrams(String(Math.round(result.gramsPerPiece * 100) / 100)); setByPiece(true); setQuantity('1'); }
    if (result.piecesPerServing) setPiecesRef(String(result.piecesPerServing));
    setError(result.energies.length ? '' : 'Je n’ai pas trouvé les kcal sur la photo. Recopie le chiffre écrit à côté de « Énergie ».');
  };

  const chooseBasis = (next: LabelBasis) => {
    setBasis(next); setError('');
    if (next === '100g') setQuantity(byPiece ? '1' : '');
    else if (next === '100ml') setQuantity('');
    else setQuantity('1');
  };

  const unitCount = basis === 'piece' || basis === 'serving' || (basis === '100g' && byPiece);
  const weight = packMode ? pieceWeightFromPack(readNumber(packGrams), readNumber(packCount)) : readNumber(grams);
  const kcal = readNumber(energy);
  const label = unitCount ? pieceName : basis === '100ml' ? 'ml' : 'g';
  let food = null, preview = null, issue = '';
  try {
    if (kcal === null) throw new Error('Indique les kcal de l’étiquette.');
    if (!basis) throw new Error('Choisis pour quelle quantité sont ces kcal.');
    food = foodFromLabel({ name: name.trim() || FALLBACK_NAME, kcal, basis, byPiece: unitCount, gramsPerPiece: weight, piecesPerServing: readNumber(piecesRef), portionName: pieceName });
    const qty = readNumber(quantity);
    if (qty === null) throw new Error('Indique combien tu en as mangé.');
    preview = scaleReference(food, qty);
  } catch (e) { issue = e instanceof Error ? e.message : 'Vérifie les valeurs.'; }

  const hasPhoto = Boolean(uri);
  const askEnergy = (hasPhoto && !busy && detected !== null) || typing;
  const count = readNumber(quantity) ?? 0;

  return <View style={{ gap: 14 }}>
    <Action label="Retour à la recherche" secondary onPress={onCancel} />

    {/* La photo : prendre, lire, montrer. */}
    <View style={form.card}>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>Scanner une étiquette</Text>
      {!hasPhoto && !busy && <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.copy}>Photographie le tableau nutritionnel du paquet, bien à plat. Je lis les kcal pour toi.</Text>}
      {uri ? (
        <View style={styles.photoRow}>
          <Image accessibilityLabel="Ta photo de l’étiquette" source={{ uri }} resizeMode="cover" style={styles.photo} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.copy}>{busy ? 'Je lis l’étiquette…' : detected?.energies.length ? 'Étiquette lue.' : 'Étiquette difficile à lire.'}</Text>
            {!busy && <MotionPressable accessibilityRole="button" onPress={() => void scan(true)} style={styles.link}><Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.linkText}>Reprendre la photo</Text></MotionPressable>}
          </View>
        </View>
      ) : null}
      {busy && <View style={styles.reading} accessibilityLiveRegion="polite">
        <ActivityIndicator color={colors.violet} />
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.copy}>Lecture en cours… {progress > 0 ? `${progress} %` : ''}</Text>
        <MotionPressable accessibilityRole="button" onPress={() => { sequence.current++; setBusy(false); setBase64(''); setTyping(true); }} style={styles.link}><Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.linkText}>Arrêter et recopier moi-même</Text></MotionPressable>
      </View>}
      {!hasPhoto && !busy && <>
        <Action label="Prendre la photo" onPress={() => void scan(true)} />
        <Action secondary label="Choisir une photo" onPress={() => void scan(false)} />
        {!typing && <MotionPressable accessibilityRole="button" onPress={() => setTyping(true)} style={styles.link}><Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.linkText}>Pas de photo ? Recopier les valeurs</Text></MotionPressable>}
      </>}
      {permissionDenied && Platform.OS !== 'web' && <Action secondary label="Ouvrir les réglages de l’appareil photo" onPress={() => { void Linking.openSettings().catch(() => setError('Ouvre les réglages du téléphone pour autoriser la caméra.')); }} />}
      {base64 && <OcrReader key={base64.slice(-32)} base64={base64} onText={acceptText} onError={message => { fail(message); setTyping(true); }} onProgress={setProgress} />}
    </View>

    {error ? <Text accessibilityRole="alert" maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.error}>{error}</Text> : null}

    {askEnergy && <View style={form.card}>
      {/* 1 — les kcal */}
      <Step number={1} title="Les kcal de l’étiquette" />
      {detected && detected.energies.length > 0 && !typing ? <>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.copy}>
          {detected.energies.length === 1 ? 'J’ai lu ce chiffre. C’est bien celui écrit à côté de « Énergie » ?' : 'J’ai lu plusieurs chiffres. Touche celui écrit à côté de « Énergie », dans la colonne « pour 100 g » de préférence.'}
        </Text>
        <View style={form.row}>
          {detected.energies.map(e => (
            <MotionPressable
              key={`${e.value}-${e.line}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: energy === String(e.value) }}
              accessibilityLabel={`${e.value} kilocalories`}
              onPress={() => { setEnergy(String(e.value)); setError(''); }}
              style={[styles.value, energy === String(e.value) && styles.valueOn]}
            >
              <Text maxFontSizeMultiplier={1.4} style={[styles.valueText, energy === String(e.value) && styles.valueTextOn]}>{e.value.toLocaleString('fr-FR')} kcal</Text>
            </MotionPressable>
          ))}
        </View>
        <MotionPressable accessibilityRole="button" onPress={() => { setTyping(true); setEnergy(''); }} style={styles.link}><Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.linkText}>Ce n’est pas le bon chiffre</Text></MotionPressable>
      </> : <>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.copy}>Recopie le chiffre en kcal écrit à côté de « Énergie » (pas celui en kJ).</Text>
        {/* La photo en grand juste au-dessus du champ : on recopie sans la quitter des yeux. */}
        {uri ? <Image accessibilityLabel="Ta photo de l’étiquette, en grand" source={{ uri }} resizeMode="contain" style={styles.photoLarge} /> : null}
        <TextInput accessibilityLabel="Kilocalories de l’étiquette" value={energy} onChangeText={value => { setEnergy(value); setError(''); }} keyboardType="decimal-pad" maxLength={6} placeholder="Ex. 468" placeholderTextColor={colors.muted} style={[form.input, styles.bigInput]} />
        {detected && detected.energies.length > 0 && <MotionPressable accessibilityRole="button" onPress={() => { setTyping(false); setEnergy(String(detected.energies[0].value)); }} style={styles.link}><Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.linkText}>Revenir aux chiffres lus</Text></MotionPressable>}
      </>}

      {/* 2 — la référence */}
      {kcal !== null && <>
        <Step number={2} title="Ces kcal sont…" />
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.muted}>Regarde le haut de la colonne : c’est presque toujours « pour 100 g ».</Text>
        <View style={styles.bases}>
          {BASES.map(b => (
            <MotionPressable
              key={b.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: basis === b.id }}
              accessibilityLabel={`${b.label}, ${b.hint}`}
              onPress={() => chooseBasis(b.id)}
              containerStyle={styles.baseOuter}
              style={[styles.base, basis === b.id && styles.baseOn]}
            >
              <Text maxFontSizeMultiplier={1.4} style={[styles.baseLabel, basis === b.id && styles.baseLabelOn]}>{b.label}</Text>
              <Text maxFontSizeMultiplier={1.4} style={[styles.baseHint, basis === b.id && styles.baseHintOn]}>{b.hint}</Text>
            </MotionPressable>
          ))}
        </View>
      </>}

      {/* 3 — ce qui a été mangé */}
      {kcal !== null && basis && <>
        <Step number={3} title="Combien en as-tu mangé ?" />

        {basis === '100g' && <View style={styles.segment}>
          <Choice label="En grammes" selected={!byPiece} onPress={() => { setByPiece(false); setQuantity(''); }} />
          <Choice label="En pièces" selected={byPiece} onPress={() => { setByPiece(true); setQuantity('1'); }} />
        </View>}

        {unitCount ? <>
          <View style={form.row}>
            {PIECE_NAMES.map(n => <Choice key={n} label={n} selected={pieceName === n} onPress={() => setPieceName(n)} />)}
          </View>
          <Counter value={count} unit={pieceName} onChange={value => setQuantity(String(value))} />
          {basis === '100g' && <>
            {detected?.gramsPerPiece && !packMode && grams === String(Math.round(detected.gramsPerPiece * 100) / 100)
              ? <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.muted}>1 {pieceName} pèse {grams.replace('.', ',')} g, d’après l’étiquette.</Text>
              : <>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.copy}>Pour compter en pièces, il faut le poids d’une pièce. Il est souvent écrit près du tableau.</Text>
                {packMode
                  ? <><Field label="Poids net du paquet (g)" numeric value={packGrams} onChange={setPackGrams} /><Field label={`Nombre de ${pieceName}s dans le paquet`} numeric value={packCount} onChange={setPackCount} />{weight !== null && <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.copy}>Soit environ {Number(weight.toFixed(1)).toLocaleString('fr-FR')} g par {pieceName}.</Text>}</>
                  : <Field label="Poids d’une pièce (g)" numeric value={grams} onChange={setGrams} />}
                <MotionPressable accessibilityRole="button" onPress={() => setPackMode(!packMode)} style={styles.link}><Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.linkText}>{packMode ? 'Je connais le poids d’une pièce' : 'Le calculer avec le paquet'}</Text></MotionPressable>
              </>}
          </>}
          {basis === 'serving' && <Field label={`Combien de ${pieceName}s dans la portion de l’étiquette ?`} numeric value={piecesRef} onChange={setPiecesRef} placeholder="Ex. 2" />}
        </> : <>
          <View style={form.row}>
            {(basis === '100ml' ? ML_SHORTCUTS : GRAM_SHORTCUTS).map(v => <Choice key={v} label={`${v} ${label}`} selected={quantity === String(v)} onPress={() => setQuantity(String(v))} />)}
          </View>
          <Field label={basis === '100ml' ? 'Ou la quantité exacte (ml)' : 'Ou la quantité exacte (g)'} numeric value={quantity} onChange={setQuantity} />
        </>}
      </>}

      {/* Le résultat, en grand, avant d'ajouter. */}
      {preview && <View style={styles.result} accessibilityLiveRegion="polite">
        <Text maxFontSizeMultiplier={1.4} style={styles.resultValue}>≈ {preview.calories.estimated.toLocaleString('fr-FR')} kcal</Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.copy}>
          {unitCount
            ? `${quantity} ${pieceName}${count > 1 ? 's' : ''}, à ${Number(food!.reference.calories.estimated.toFixed(1)).toLocaleString('fr-FR')} kcal l’un${pieceName === 'barre' || pieceName === 'tranche' || pieceName === 'pièce' ? 'e' : ''}`
            : `${quantity} ${label} à ${kcal?.toLocaleString('fr-FR')} kcal pour 100 ${label}`}
        </Text>
      </View>}

      {preview && <>
        <Field label="Nom du produit (facultatif)" value={name} onChange={setName} placeholder="Ex. biscuits sablés" />
        <View style={form.row}><Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[form.copy, { flex: 1 }]}>Le retrouver la prochaine fois</Text><Switch accessibilityLabel="Mémoriser ce produit" value={remember} onValueChange={setRemember} /></View>
      </>}

      <Action
        label={preview ? `Ajouter ${preview.calories.estimated.toLocaleString('fr-FR')} kcal au repas` : 'Ajouter au repas'}
        disabled={!preview}
        onPress={() => { if (!preview || !food) { setError(issue); return; } if (remember) rememberFood(food); onAdd(preview); }}
      />
      {!preview && kcal !== null && basis ? <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.muted}>{issue}</Text> : null}

      {raw ? <>
        <MotionPressable accessibilityRole="button" onPress={() => setShowRaw(!showRaw)} style={styles.link}><Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.linkText}>{showRaw ? 'Masquer le texte lu' : 'Voir le texte lu sur la photo'}</Text></MotionPressable>
        {showRaw && <><TextInput accessibilityLabel="Texte lu sur l’étiquette" value={raw} onChangeText={setRaw} multiline maxLength={30000} style={[form.input, { minHeight: 150 }]} /><Action secondary label="Relire ce texte corrigé" onPress={() => { setEnergy(''); setBasis(null); setGrams(''); setPiecesRef(''); setTyping(false); acceptText(raw); }} /></>}
      </> : null}
    </View>}

    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={form.muted}>La photo est lue sur ton téléphone et n’est pas gardée. Il faut internet la première fois pour charger le lecteur.</Text>
  </View>;
}

function Step({ number, title }: { number: number; title: string }) {
  return <View style={styles.step}>
    <View style={styles.stepNumber}><Text maxFontSizeMultiplier={1.2} style={styles.stepNumberText}>{number}</Text></View>
    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.stepTitle} accessibilityRole="header">{title}</Text>
  </View>;
}

function Counter({ value, unit, onChange }: { value: number; unit: string; onChange: (value: number) => void }) {
  const shown = value > 0 ? value : 0;
  return <View style={styles.counter}>
    <MotionPressable accessibilityRole="button" accessibilityLabel={`${unit} : un de moins`} disabled={shown <= 1} onPress={() => onChange(Math.max(1, shown - 1))} style={styles.counterButton}>
      <Text maxFontSizeMultiplier={1.2} style={styles.counterSign}>−</Text>
    </MotionPressable>
    <Text maxFontSizeMultiplier={1.4} style={styles.counterValue} accessibilityLiveRegion="polite">{shown} {unit}{shown > 1 ? 's' : ''}</Text>
    <MotionPressable accessibilityRole="button" accessibilityLabel={`${unit} : un de plus`} onPress={() => onChange(Math.min(100, shown + 1))} style={styles.counterButton}>
      <Text maxFontSizeMultiplier={1.2} style={styles.counterSign}>+</Text>
    </MotionPressable>
  </View>;
}

const styles = StyleSheet.create({
  title: { color: colors.navy, fontSize: 22, lineHeight: 28, fontFamily: fonts.display },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photo: { width: 72, height: 72, borderRadius: 14, backgroundColor: colors.background },
  photoLarge: { width: '100%', height: 280, borderRadius: 16, backgroundColor: colors.background },
  reading: { gap: 8, alignItems: 'flex-start' },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { color: colors.sageDark, fontSize: 14, fontFamily: fonts.bold },

  step: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: colors.white, fontSize: 14, fontFamily: fonts.bold },
  stepTitle: { flex: 1, color: colors.navy, fontSize: 18, lineHeight: 24, fontFamily: fonts.extrabold },

  value: { minHeight: 56, minWidth: 120, borderRadius: 18, borderWidth: 2, borderColor: colors.fieldEdge, backgroundColor: colors.white, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' },
  valueOn: { borderColor: colors.navy, backgroundColor: colors.navy },
  valueText: { color: colors.ink, fontSize: 22, fontFamily: fonts.display },
  valueTextOn: { color: colors.white },
  bigInput: { fontSize: 22, minHeight: 56, fontFamily: fonts.bold },

  bases: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  baseOuter: { flexBasis: '46%', flexGrow: 1 },
  base: { minHeight: 64, borderRadius: 16, borderWidth: 1.5, borderColor: colors.fieldEdge, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center' },
  baseOn: { borderColor: colors.navy, backgroundColor: colors.navy },
  baseLabel: { color: colors.ink, fontSize: 16, fontFamily: fonts.bold },
  baseLabelOn: { color: colors.white },
  baseHint: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },
  baseHintOn: { color: colors.onDarkMuted },

  segment: { flexDirection: 'row', gap: 8 },
  counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.warmPale, borderRadius: 20, padding: 8 },
  counterButton: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  counterSign: { color: colors.warmInk, fontSize: 26, lineHeight: 30, fontFamily: fonts.extrabold },
  counterValue: { color: colors.warmInk, fontSize: 22, fontFamily: fonts.display },

  result: { backgroundColor: colors.violetPale, borderRadius: 18, padding: 16, gap: 4 },
  resultValue: { color: colors.navy, fontSize: 32, lineHeight: 38, fontFamily: fonts.displayHeavy },
});
