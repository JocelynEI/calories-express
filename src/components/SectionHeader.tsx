import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcon, IconName } from './AppIcon';
import { FoodArt } from './FoodArt';
import { FoodName } from '../data/illustrations';
import { colors, fonts, MAX_FONT_SCALE, radii, typeScale } from '../theme';

/**
 * V2.5 — l'en-tête d'un bloc thématique.
 *
 * Un aplat teinté, une pastille d'icône, un titre, un chiffre-clé, et une
 * illustration qui déborde du bord droit.
 *
 * Le débordement est volontaire : une vignette posée bien au milieu d'un coin
 * ressemble à un autocollant. Une illustration coupée par le bord donne au
 * bandeau l'air d'une image plutôt que d'un ornement — c'est ce qui sépare une
 * mise en page composée d'une suite de blocs décorés.
 *
 * L'illustration reste en retrait (opacité réduite) : c'est un fond, et le
 * chiffre-clé doit rester la chose la plus lisible de la ligne.
 */

type Props = {
  icon: IconName;
  /** Couleur du texte et de l'icône. Doit contraster avec `pale`. */
  tone: string;
  pale: string;
  title: string;
  meta?: string;
  /** Illustration de fond. Omise, le bandeau reste uni. */
  art?: FoodName;
};

export function SectionHeader({ icon, tone, pale, title, meta, art }: Props) {
  return (
    <View style={[styles.band, { backgroundColor: pale }]}>
      {art ? (
        <View pointerEvents="none" style={styles.artWrap}>
          <View style={styles.artInner}><FoodArt name={art} size={84} /></View>
        </View>
      ) : null}
      <View style={[styles.icon, { backgroundColor: tone }]}>
        <AppIcon name={icon} size={17} color={colors.white} strokeWidth={2.1} />
      </View>
      {/* V2.7 : le chiffre-clé passe sous le titre. À 20 px (taille du brief),
          titre et chiffre ne tenaient plus côte à côte sur un téléphone :
          l'un ou l'autre finissait coupé par des points de suspension. */}
      <View style={styles.texts}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.title, { color: tone }]} numberOfLines={1}>{title}</Text>
        {meta ? (
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.meta, { color: tone }]} numberOfLines={1}>{meta}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: radii.large, paddingLeft: 12, paddingVertical: 11,
    // La place de l'illustration est réservée : sans cette marge, le
    // chiffre-clé passait par-dessus le dessin. Une valeur qu'on ne lit pas
    // ne sert à rien, et c'est le genre de collision qui fait bâclé.
    paddingRight: 46,
    // L'illustration est coupée net par le bord arrondi du bandeau.
    overflow: 'hidden',
  },
  artWrap: { position: 'absolute', right: -26, top: -10, opacity: 0.45 },
  artInner: { transform: [{ rotate: '-12deg' }] },
  icon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  // Brief : « Section Header » 20 px, gras.
  texts: { flex: 1, minWidth: 0 },
  title: { ...typeScale.section },
  meta: { fontSize: 12, lineHeight: 16, fontFamily: fonts.semibold, opacity: 0.9 },
});
