import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, Switch, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { foodFromLabel, LabelBasis, LabelDetection, parseLabelText, pieceWeightFromPack } from '../domain/labels';
import { readNumber, scaleReference } from '../domain/foods';
import { useApp } from '../state/AppContext';
import { colors } from '../theme';
import { RecognizedFood } from '../types';
import { Action, Choice, Field, form } from './FormControls';
import { OcrReader } from './OcrReader';

const BASES: Record<LabelBasis, string> = { '100g': '100 g', '100ml': '100 ml', piece: '1 pièce', serving: 'Une portion de plusieurs pièces' };
export function LabelFoodForm({ initialName, onAdd, onCancel }: { initialName: string; onAdd: (food: RecognizedFood) => void; onCancel: () => void }) {
  const { rememberFood } = useApp();
  const [name, setName] = useState(initialName), [uri, setUri] = useState(''), [base64, setBase64] = useState(''), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0);
  const [detected, setDetected] = useState<LabelDetection | null>(null), [raw, setRaw] = useState(''), [showRaw, setShowRaw] = useState(false), [permissionDenied, setPermissionDenied] = useState(false);
  const [energy, setEnergy] = useState(''), [basis, setBasis] = useState<LabelBasis | null>(null), [byPiece, setByPiece] = useState(true), [pieceName, setPieceName] = useState('biscuit');
  const [grams, setGrams] = useState(''), [piecesRef, setPiecesRef] = useState(''), [quantity, setQuantity] = useState('1'), [packMode, setPackMode] = useState(false), [packGrams, setPackGrams] = useState(''), [packCount, setPackCount] = useState('');
  const [confirmed, setConfirmed] = useState(false), [remember, setRemember] = useState(true), [error, setError] = useState('');
  const alive = useRef(true), sequence = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; sequence.current++; }; }, []);
  const invalidate = () => { setConfirmed(false); setError(''); };
  const fail = (message: string) => { setBusy(false); setBase64(''); setError(message); };
  const scan = async (camera: boolean) => {
    const token = ++sequence.current; setError(''); setPermissionDenied(false); setBusy(true); setBase64(''); setProgress(0); setConfirmed(false);
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
      setUri(image.uri); setRaw(''); setDetected(null); setEnergy(''); setBasis(null); setGrams(''); setPiecesRef(''); setPackGrams(''); setPackCount(''); setPackMode(false); setBase64(image.base64);
    } catch (e) { if (alive.current && token === sequence.current) fail(e instanceof Error ? e.message : 'La photo n’a pas pu être ouverte.'); }
  };
  const acceptText = (text: string) => {
    setBusy(false); setBase64(''); setRaw(text); const result = parseLabelText(text); setDetected(result);
    if (result.energies.length === 1) setEnergy(String(result.energies[0].value));
    if (result.only100g) setBasis('100g');
    if (result.gramsPerPiece) setGrams(String(Math.round(result.gramsPerPiece * 100) / 100));
    if (result.piecesPerServing) setPiecesRef(String(result.piecesPerServing));
    if (!result.energies.length) setError('Aucune valeur d’énergie lisible. Photographie le tableau nutritionnel, ou recopie les kcal ci-dessous.');
  };
  const unitCount = basis === 'piece' || basis === 'serving' || (basis === '100g' && byPiece);
  const weight = packMode ? pieceWeightFromPack(readNumber(packGrams), readNumber(packCount)) : readNumber(grams);
  let food = null, preview = null, issue = '';
  try {
    if (!basis) throw new Error('Choisis la référence des calories sur l’étiquette.');
    food = foodFromLabel({ name, kcal: readNumber(energy) ?? NaN, basis, byPiece: unitCount, gramsPerPiece: weight, piecesPerServing: readNumber(piecesRef), portionName: pieceName });
    preview = scaleReference(food, readNumber(quantity) ?? NaN);
  } catch (e) { issue = e instanceof Error ? e.message : 'Vérifie les valeurs.'; }
  return <View style={{ gap: 14 }}>
    <Action label="Retour à la recherche" secondary onPress={onCancel} />
    <View style={form.card}><Text style={form.title}>Du paquet à ton assiette</Text><Text style={form.copy}>Cadre le tableau nutritionnel, avec les kcal et la taille de portion si elle est indiquée. La liste d’ingrédients seule ne suffit pas.</Text>
      <Action label="Prendre une photo de l’étiquette" disabled={busy} onPress={() => void scan(true)} /><Action secondary label="Choisir une photo" disabled={busy} onPress={() => void scan(false)} />
      {permissionDenied && Platform.OS !== 'web' && <Action secondary label="Ouvrir les réglages de l’appareil photo" onPress={() => { void Linking.openSettings().catch(() => setError('Ouvre les réglages du téléphone pour autoriser la caméra.')); }} />}
      <Text style={form.muted}>La photo est lue sur ton appareil, sans envoi à un service d’analyse. Internet est nécessaire pour charger le lecteur. La photo n’est pas enregistrée dans ton journal.</Text>
      {uri ? <Image accessibilityLabel="Étiquette à vérifier" source={{ uri }} resizeMode="contain" style={{ width: '100%', height: 250, borderRadius: 14, backgroundColor: colors.background }} /> : null}
      {busy && <><ActivityIndicator color={colors.violet} /><Text accessibilityLiveRegion="polite" style={form.copy}>Lecture de l’étiquette… {progress > 0 ? `${progress} %` : 'chargement'}</Text><Action secondary label="Arrêter la lecture et saisir les valeurs" onPress={() => { sequence.current++; setBusy(false); setBase64(''); }} /></>}
      {base64 && <OcrReader key={base64.slice(-32)} base64={base64} onText={acceptText} onError={fail} onProgress={setProgress} />}
    </View>
    {error ? <Text accessibilityRole="alert" style={form.error}>{error}</Text> : null}
    {!busy && <View style={form.card}><Text style={form.title}>Vérifier les valeurs</Text><Field label="Nom du produit" value={name} onChange={v => { setName(v); invalidate(); }} placeholder="Ex. biscuits Prince au chocolat" />
      {detected && detected.energies.length > 0 && <><Text style={form.label}>Valeurs lues sur la photo</Text><Text style={form.muted}>Choisis celle de la colonne que tu veux utiliser. Une portion peut contenir plusieurs biscuits.</Text>{detected.energies.map((e, i) => <View key={i}><Choice label={`${e.value} kcal${e.fromKj ? ' (conversion des kJ)' : ''}`} selected={energy === String(e.value)} onPress={() => { setEnergy(String(e.value)); invalidate(); }} /><Text style={form.muted}>{e.line}</Text></View>)}</>}
      <Field label="Énergie indiquée (kcal, pas kJ)" numeric value={energy} onChange={v => { setEnergy(v); invalidate(); }} placeholder="Recopie la valeur si nécessaire" />
      <Text style={form.label}>Ces kcal correspondent à :</Text><View style={form.row}>{(Object.keys(BASES) as LabelBasis[]).map(b => <Choice key={b} label={BASES[b]} selected={basis === b} onPress={() => { setBasis(b); setQuantity(b === '100ml' ? '100' : '1'); invalidate(); }} />)}</View>
      {basis === '100g' && <View style={form.row}><Choice label="Compter les biscuits / pièces" selected={byPiece} onPress={() => { setByPiece(true); setQuantity('1'); invalidate(); }} /><Choice label="Peser en grammes" selected={!byPiece} onPress={() => { setByPiece(false); setQuantity('100'); invalidate(); }} /></View>}
      {unitCount && <Field label="Nom d’une pièce (au singulier)" value={pieceName} onChange={v => { setPieceName(v); invalidate(); }} placeholder="biscuit, gâteau, barre…" maxLength={30} />}
      {basis === 'serving' && <Field label="Combien de pièces dans la portion de l’étiquette ?" numeric value={piecesRef} onChange={v => { setPiecesRef(v); invalidate(); }} placeholder="Ex. 2 si la colonne indique 2 biscuits" />}
      {basis === '100g' && byPiece && <><Text style={form.label}>Poids d’un biscuit / d’une pièce</Text><View style={form.row}><Choice label="Poids indiqué" selected={!packMode} onPress={() => { setPackMode(false); invalidate(); }} /><Choice label="Calculer depuis le paquet" selected={packMode} onPress={() => { setPackMode(true); invalidate(); }} /></View>{packMode ? <><Field label="Poids net de tous les biscuits du paquet (g)" numeric value={packGrams} onChange={v => { setPackGrams(v); invalidate(); }} /><Field label="Nombre total de biscuits dans ce paquet" numeric value={packCount} onChange={v => { setPackCount(v); invalidate(); }} />{weight !== null && <Text style={form.copy}>≈ {Number(weight.toFixed(2))} g par biscuit, en supposant des pièces de même poids.</Text>}</> : <Field label="Poids d’une pièce (g)" numeric value={grams} onChange={v => { setGrams(v); invalidate(); }} />}<Text style={form.muted}>Vérifie l’emballage ou pèse une pièce. Le nom du produit seul ne donne pas son poids.</Text></>}
      <Field label={unitCount ? `Combien de ${pieceName || 'pièce'}s as-tu mangé ?` : `Quantité mangée (${basis === '100ml' ? 'ml' : 'g'})`} numeric value={quantity} onChange={setQuantity} />
      {preview && <View style={{ padding: 16, backgroundColor: colors.violetPale, borderRadius: 14, gap: 5 }}><Text style={{ fontSize: 29, fontWeight: '800', color: colors.navy }}>≈ {preview.calories.estimated} kcal</Text><Text style={form.copy}>{unitCount ? `${quantity} × ${Number(food!.reference.calories.estimated.toFixed(1))} kcal par ${pieceName}` : `${quantity} ${basis === '100ml' ? 'ml' : 'g'} pour cette prise`}</Text></View>}
      {raw ? <><Action secondary label={showRaw ? 'Masquer le texte lu' : 'Voir / corriger le texte lu'} onPress={() => setShowRaw(!showRaw)} />{showRaw && <><TextInput accessibilityLabel="Texte lu sur l’étiquette" value={raw} onChangeText={setRaw} multiline maxLength={30000} style={[form.input, { minHeight: 150 }]} /><Action secondary label="Relire ce texte corrigé" onPress={() => { setEnergy(''); setBasis(null); setGrams(''); setPiecesRef(''); setConfirmed(false); acceptText(raw); }} /></>}</> : null}
      <Choice label="J’ai vérifié les kcal, la colonne et la taille de portion sur l’étiquette" selected={confirmed} onPress={() => setConfirmed(!confirmed)} />
      <View style={form.row}><Text style={[form.copy, { flex: 1 }]}>Mémoriser pour la prochaine fois</Text><Switch accessibilityLabel="Mémoriser cette étiquette" value={remember} onValueChange={setRemember} /></View>
      <Text style={form.muted}>La prochaine fois, recherche ce produit et indique seulement le nombre de pièces. Les macronutriments ne sont pas repris automatiquement.</Text>
      <Action label="Ajouter au repas" disabled={!confirmed} onPress={() => { if (!preview || !food) { setError(issue); return; } if (remember) rememberFood(food); onAdd(preview); }} />
    </View>}
  </View>;
}
