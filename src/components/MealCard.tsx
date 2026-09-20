import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { shortTime } from '../domain/date';
import { colors, MAX_FONT_SCALE, radii, shadows } from '../theme';
import { Meal } from '../types';
import { AppIcon } from './AppIcon';
import { MotionPressable } from './Motion';
import { FoodArt } from './FoodArt';
import { drawingFor } from '../domain/food-images';
import { mealPhoto, mealSubject } from '../domain/meals';

/**
 * V2.5 — la carte d'un repas, menée par l'image.
 *
 * Jusqu'ici c'était une ligne de texte avec une pastille de 44 pixels : lisible,
 * mais sans appétit, et cela se voyait. L'image occupe maintenant toute la
 * largeur en tête de carte.
 *
 * Trois sources, de la plus vraie à la plus générique :
 *
 * 1. la photographie du produit servie par Open Food Facts ;
 * 2. l'illustration correspondante, quand le nom de l'aliment est reconnu ;
 * 3. un aplat teinté seul, quand on ne sait pas — jamais une image fausse.
 *
 * Le bandeau prend la teinte du moment de la journée : un petit-déjeuner et un
 * dîner ne se ressemblent pas dans le journal, même sans lire l'heure.
 */

type Props = {
  meal: Meal;
  onRemove?: () => void;
  /** V1.8 — modifier une entrée au lieu de la supprimer puis la ressaisir. */
  onEdit?: () => void;
  /** Ligne resserrée, sans bandeau : pour les listes denses. */
  compact?: boolean;
};

export function MealCard({ meal, onRemove, onEdit, compact = false }: Props) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const tone = toneFor(meal.moment);
  const photo = photoFailed ? undefined : mealPhoto(meal);
  const drawing = drawingFor(mealSubject(meal));

  const cover = (
    <View style={[styles.cover, { backgroundColor: tone.pale }]}>
      {photo
        ? <>
            <Image source={{ uri: photo }} resizeMode="cover" onError={() => setPhotoFailed(true)} style={styles.photo} />
            <View pointerEvents="none" style={styles.photoShade} />
          </>
        : drawing
          ? <FoodArt name={drawing} size={104} />
          : <AppIcon name="journal" size={34} color={tone.ink} strokeWidth={1.6} />}
      <View style={[styles.moment, { backgroundColor: tone.ink }]}>
        <Text maxFontSizeMultiplier={1.2} style={styles.momentText} numberOfLines={1}>{meal.moment}</Text>
      </View>
    </View>
  );

  const body = (
    <View style={styles.body}>
      <View style={styles.bodyText}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.description} numberOfLines={2}>{meal.description}</Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.meta}>
          {shortTime(meal.createdAt)}
          {meal.calories.min !== meal.calories.max ? ` · ${meal.calories.min}–${meal.calories.max} kcal estimées` : ''}
        </Text>
      </View>
      <View style={styles.right}>
        <Text maxFontSizeMultiplier={1.3} style={styles.calories}>{meal.calories.estimated.toLocaleString('fr-FR')}</Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.kcal}>kcal</Text>
      </View>
    </View>
  );

  const thumb = (
    <View style={[styles.thumb, { backgroundColor: tone.pale }]}>
      {photo
        ? <Image source={{ uri: photo }} resizeMode="cover" onError={() => setPhotoFailed(true)} style={styles.thumbPhoto} />
        : drawing
          ? <FoodArt name={drawing} size={56} />
          : <AppIcon name="journal" size={24} color={tone.ink} strokeWidth={1.7} />}
    </View>
  );

  const inside = compact
    ? (
      <View style={styles.compactRow}>
        {thumb}
        <View style={styles.bodyText}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.description} numberOfLines={1}>{meal.description}</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.meta}>{meal.moment} · {shortTime(meal.createdAt)}</Text>
        </View>
        <View style={styles.right}>
          <Text maxFontSizeMultiplier={1.3} style={styles.calories}>{meal.calories.estimated.toLocaleString('fr-FR')}</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.kcal}>kcal</Text>
        </View>
      </View>
    )
    : <>{cover}{body}</>;

  return (
    <View style={styles.wrapper}>
      {onEdit ? (
        <MotionPressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Modifier ${meal.description}, ${meal.calories.estimated} kilocalories`}
          containerStyle={styles.grow}
          style={styles.card}
        >
          {inside}
        </MotionPressable>
      ) : (
        <View style={[styles.card, styles.grow]}>{inside}</View>
      )}
      {onRemove && (
        <MotionPressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Supprimer ${meal.description}`}
          style={styles.remove}
        >
          <AppIcon name="trash" size={17} color={colors.coral} strokeWidth={2} />
        </MotionPressable>
      )}
    </View>
  );
}

/**
 * Une teinte par moment de la journée, et quatre teintes vraiment distinctes.
 * Jusqu'en V2.4 le déjeuner et le dîner partageaient deux violets presque
 * identiques : dans le journal, on ne les distinguait plus.
 */
function toneFor(moment: Meal['moment']) {
  if (moment === 'Petit-déjeuner') return { pale: colors.goldPale, ink: colors.goldText };
  if (moment === 'Goûter' || moment === 'Snack') return { pale: colors.aquaPale, ink: colors.aqua };
  if (moment === 'Dîner') return { pale: colors.violetPale, ink: colors.violet };
  return { pale: colors.leafPale, ink: colors.leaf };
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  grow: { flex: 1 },
  card: { backgroundColor: colors.card, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', ...shadows.card },

  cover: { height: 132, alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: '100%' },
  photoShade: { ...StyleSheet.absoluteFillObject, backgroundColor: '#11152B1A' },
  moment: { position: 'absolute', left: 12, top: 12, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 },
  momentText: { color: colors.white, fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

  body: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, padding: 13 },
  bodyText: { flex: 1, minWidth: 0 },
  description: { color: colors.ink, fontSize: 16, fontWeight: '800', lineHeight: 21, letterSpacing: -0.2 },
  meta: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 3, lineHeight: 17 },
  right: { alignItems: 'flex-end', minWidth: 50 },
  calories: { color: colors.ink, fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  kcal: { color: colors.muted, fontSize: 11, fontWeight: '700' },

  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  thumb: { width: 62, height: 62, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  thumbPhoto: { width: 62, height: 62 },

  remove: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coralPale, marginTop: 4 },
});
