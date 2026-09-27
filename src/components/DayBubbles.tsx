import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FoodArt } from './FoodArt';
import { FoodName } from '../data/illustrations';
import { colors, fonts, MAX_FONT_SCALE, radii, shadows, typeScale } from '../theme';
import { AppIcon } from './AppIcon';
import { MotionPressable } from './Motion';

/**
 * V3.2 — les deux côtés de la journée, côte à côte.
 *
 * L'accueil répétait trois fois la même information : la jauge, une ligne de
 * chiffres sous elle, puis deux bandeaux qui les redonnaient en petit. Ces
 * deux bulles remplacent tout cela par ce qui compte vraiment : ce qui est
 * entré, ce qui est sorti.
 *
 * Chaque bulle porte son propre bouton, dans sa couleur. C'est le choix de
 * Jocelyn contre le mien — je voulais deux boutons violets sous les bulles,
 * pour que le violet reste la couleur unique des actions. Son argument est
 * meilleur : ici le geste appartient visiblement à son sujet, et les deux
 * sont lisibles d'un coup d'œil sans qu'aucun ne domine l'autre.
 *
 * Le corps de la bulle et son bouton sont deux cibles distinctes : toucher la
 * bulle ouvre le détail, toucher le bouton ajoute directement.
 */

export type BubbleTone = 'mint' | 'warm';

const TONES: Record<BubbleTone, { pale: string; ink: string; edge: string }> = {
  mint: { pale: colors.mintPale, ink: colors.mintInk, edge: '#CFEDED' },
  warm: { pale: colors.warmPale, ink: colors.warmInk, edge: '#F0E2BC' },
};

type BubbleProps = {
  tone: BubbleTone;
  label: string;
  value: string;
  detail: string;
  art: FoodName;
  /** Texte court du bouton. Le libellé complet est donné aux lecteurs d'écran. */
  action: string;
  actionLabel: string;
  onAction: () => void;
  onOpen?: () => void;
  openLabel?: string;
};

export function DayBubble({ tone, label, value, detail, art, action, actionLabel, onAction, onOpen, openLabel }: BubbleProps) {
  const palette = TONES[tone];
  return (
    <View style={[styles.bubble, { backgroundColor: palette.pale, borderColor: palette.edge }]}>
      <View pointerEvents="none" style={styles.art}>
        <FoodArt name={art} size={56} />
      </View>
      <MotionPressable
        onPress={onOpen}
        disabled={!onOpen}
        accessibilityRole={onOpen ? 'button' : undefined}
        accessibilityLabel={openLabel}
        style={styles.head}
      >
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.label, { color: palette.ink }]} numberOfLines={1}>{label}</Text>
        <Text maxFontSizeMultiplier={1.3} style={styles.value} numberOfLines={1}>
          {value}
          <Text maxFontSizeMultiplier={1.3} style={styles.unit}> kcal</Text>
        </Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.detail} numberOfLines={2}>{detail}</Text>
      </MotionPressable>
      <MotionPressable
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        style={[styles.action, { backgroundColor: palette.ink }]}
      >
        <AppIcon name="plus" size={15} color={colors.white} strokeWidth={2.8} />
        <Text maxFontSizeMultiplier={1.2} style={styles.actionText} numberOfLines={1}>{action}</Text>
      </MotionPressable>
    </View>
  );
}

export function DayBubbles({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  // `minWidth: 0` est indispensable : sans lui, un chiffre long pousse la
  // bulle hors de l'écran au lieu de se couper proprement.
  bubble: { flex: 1, minWidth: 0, borderRadius: radii.large, borderWidth: 1, padding: 12, overflow: 'hidden', ...shadows.card },
  art: { position: 'absolute', right: -14, bottom: -12, opacity: 0.35, transform: [{ rotate: '-10deg' }] },
  head: { gap: 1 },
  label: { fontSize: 12, lineHeight: 16, fontFamily: fonts.extrabold, letterSpacing: 0.6 },
  value: { color: colors.ink, fontSize: 28, lineHeight: 34, fontFamily: fonts.extrabold, letterSpacing: -1 },
  unit: { color: colors.muted, fontSize: 11, lineHeight: 15, fontFamily: fonts.bold },
  detail: { color: colors.muted, ...typeScale.caption, minHeight: 34 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 42, marginTop: 10, borderRadius: radii.input },
  actionText: { color: colors.white, fontSize: 13, lineHeight: 18, fontFamily: fonts.bold },
});
