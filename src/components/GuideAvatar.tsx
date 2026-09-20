import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

/**
 * V2.4 — Jaws ne bouge plus.
 *
 * Trois versions de suite ont essayé de l'animer : découpé en calques, puis
 * d'une seule pièce. La première se décousait, la seconde bougeait bizarrement.
 * Un personnage qui respire en permanence attire l'œil en continu, et dans une
 * application qu'on ouvre dix fois par jour, cela fatigue plus que cela ne
 * charme.
 *
 * Il est donc redevenu ce qu'il était au départ : une illustration. Le
 * composant garde ses propriétés — `pose`, `animationKey`, `repeat` — pour ne
 * rien casser chez les écrans qui l'utilisent, mais elles ne servent plus à
 * rien. Aucune valeur animée n'est créée ici : rien à démarrer, rien à
 * arrêter, rien à synchroniser.
 */

export type JawsPose = 'idle' | 'nod' | 'wave' | 'present';

type Props = {
  size?: number;
  /** Conservé pour compatibilité. Sans effet depuis la V2.4. */
  animationKey?: string;
  /** Conservé pour compatibilité. Sans effet depuis la V2.4. */
  pose?: JawsPose;
  /** Conservé pour compatibilité. Sans effet depuis la V2.4. */
  repeat?: boolean;
};

export function GuideAvatar({ size = 96 }: Props) {
  return (
    <View
      style={[styles.frame, { width: size, height: size }]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.halo, { width: size * 0.74, height: size * 0.74, borderRadius: size, top: size * 0.14 }]} />
      <Image
        source={require('../../assets/jaws-avatar.png')}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { justifyContent: 'flex-start', alignItems: 'center', flexShrink: 0 },
  halo: { position: 'absolute', backgroundColor: '#E2DCFF' },
});
