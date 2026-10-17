import React from 'react';
import { Image } from 'react-native';

/**
 * V4.3 — le personnage de la personne (homme ou femme), en 3D, détouré.
 *
 * Images générées par Jocelyn, sans marque ni logo, allégées à 720 px de haut.
 * Purement décoratif : le lecteur d'écran l'ignore, l'information est dans le texte.
 */
const IMAGES = {
  homme: {
    face: { source: require('../../assets/avatars/homme-face.png'), ratio: 218 / 720 },
    'trois-quarts': { source: require('../../assets/avatars/homme-trois-quarts.png'), ratio: 221 / 720 },
  },
  femme: {
    face: { source: require('../../assets/avatars/femme-face.png'), ratio: 184 / 720 },
    'trois-quarts': { source: require('../../assets/avatars/femme-trois-quarts.png'), ratio: 163 / 720 },
  },
};

type Props = { choice: 'homme' | 'femme'; pose?: 'face' | 'trois-quarts'; height?: number };

export function UserAvatar({ choice, pose = 'trois-quarts', height = 160 }: Props) {
  const image = IMAGES[choice][pose];
  return (
    <Image
      source={image.source}
      resizeMode="contain"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ height, width: Math.round(height * image.ratio) }}
    />
  );
}
