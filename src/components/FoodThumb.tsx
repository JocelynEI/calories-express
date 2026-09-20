import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { FoodArt } from './FoodArt';
import { drawingFor } from '../domain/food-images';
import { AppIcon } from './AppIcon';
import { colors } from '../theme';

/**
 * V2.4 — la vignette d'un aliment.
 *
 * Trois niveaux, du plus vrai au plus générique :
 *
 * 1. **La photographie du produit**, servie par Open Food Facts. Ce sont de
 *    vraies photos versées par des contributeurs — c'est ce qui donne à
 *    l'application l'air d'exister dans le monde plutôt que d'avoir été
 *    fabriquée d'un bloc.
 * 2. **Le dessin correspondant**, quand le nom de l'aliment évoque un produit
 *    frais qu'on sait dessiner — une pomme, un œuf, du pain.
 * 3. **Une pastille neutre**, sinon.
 *
 * Le repli descend aussi quand le chargement échoue : réseau coupé, photo
 * retirée de la base. Une vignette vide ne casse jamais une ligne de journal.
 */

type Props = { label: string; imageUrl?: string; size?: number };

export function FoodThumb({ label, imageUrl, size = 46 }: Props) {
  const [failed, setFailed] = useState(false);
  const drawing = drawingFor(label);
  const box = { width: size, height: size, borderRadius: Math.round(size * 0.28) };

  if (imageUrl && !failed) {
    return (
      <View style={[styles.frame, box]} accessible={false} importantForAccessibility="no-hide-descendants">
        <Image
          source={{ uri: imageUrl }}
          resizeMode="cover"
          onError={() => setFailed(true)}
          style={{ width: size, height: size }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.frame, styles.drawn, box]} accessible={false} importantForAccessibility="no-hide-descendants">
      {drawing
        ? <FoodArt name={drawing} size={Math.round(size * 0.74)} />
        : <AppIcon name="journal" size={Math.round(size * 0.44)} color={colors.muted} strokeWidth={1.7} />}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, flexShrink: 0 },
  drawn: { backgroundColor: colors.background },
});
