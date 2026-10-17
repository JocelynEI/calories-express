import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PremiumFeature } from '../domain/premium';
import { usePaywall } from '../state/PaywallContext';
import { colors, fonts, MAX_FONT_SCALE, radii } from '../theme';
import { AppIcon, IconName } from './AppIcon';
import { MotionPressable } from './Motion';

type Props = {
  feature: PremiumFeature;
  icon: IconName;
  title: string;
  copy: string;
  /** Un aperçu gris, sans aucun chiffre : une forme, jamais de fausses données. */
  preview?: ReactNode;
};

/**
 * V5.0 — une fonction premium vue d'un compte gratuit.
 *
 * Elle reste visible, avec un cadenas et ce qu'elle apporte, mais ne bloque
 * rien d'autre. L'aperçu est volontairement une silhouette grise : montrer de
 * faux chiffres se lirait comme les siens.
 */
export function PremiumLock({ feature, icon, title, copy, preview }: Props) {
  const { openPaywall } = usePaywall();
  return (
    <MotionPressable
      onPress={() => openPaywall(feature)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. Fonction premium. Voir ce que contient le premium.`}
      style={styles.card}
    >
      <View style={styles.head}>
        <View style={styles.icon}><AppIcon name={icon} size={22} color={colors.violet} strokeWidth={2.1} /></View>
        <View style={{ flex: 1 }}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>{title}</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.copy}>{copy}</Text>
        </View>
        <View style={styles.pill}>
          <AppIcon name="lock" size={13} color={colors.warmInk} strokeWidth={2.3} />
          <Text maxFontSizeMultiplier={1.2} style={styles.pillText}>Premium</Text>
        </View>
      </View>
      {preview ? <View style={styles.preview} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{preview}</View> : null}
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.cta}>Voir ce que contient le premium</Text>
    </MotionPressable>
  );
}

/** Des barres grises de hauteurs variées : la silhouette d'un graphique. */
export function GhostBars({ heights }: { heights: number[] }) {
  return (
    <View style={styles.ghost}>
      {heights.map((h, index) => <View key={index} style={[styles.ghostBar, { height: h }]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.sagePale, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.ink, fontSize: 17, fontFamily: fonts.extrabold, letterSpacing: -0.2 },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 19, fontFamily: fonts.medium, marginTop: 3 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.goldPale, borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 5 },
  pillText: { color: colors.warmInk, fontSize: 11, fontFamily: fonts.extrabold },
  preview: { opacity: 0.9 },
  cta: { color: colors.violet, fontSize: 14, fontFamily: fonts.extrabold },
  ghost: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 70 },
  ghostBar: { flex: 1, borderRadius: 4, backgroundColor: colors.track },
});
