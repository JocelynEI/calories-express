import React from 'react';
import { SvgXml } from 'react-native-svg';
import { FOOD_NAMES, FoodName, ILLUSTRATIONS, foodLabel } from '../data/illustrations';

/**
 * V2.5 — un aliment dessiné.
 *
 * Le rendu passe par `SvgXml`, qui lit un vrai document SVG : dégradés,
 * ombres et reflets compris. Les versions précédentes assemblaient des
 * primitives de couleur unie, ce qui donnait des formes plates.
 *
 * L'aperçu de développement lit exactement la même chaîne de caractères que
 * le téléphone : ce qu'on voit à l'écran de contrôle est ce qui s'affichera.
 */

export type { FoodName };
export { FOOD_NAMES, foodLabel };

export function FoodArt({ name, size = 48 }: { name: FoodName; size?: number }) {
  const art = ILLUSTRATIONS[name];
  if (!art) return null;
  return <SvgXml xml={art.svg} width={size} height={size} />;
}
