import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Praise } from '../domain/praise';
import { colors, fonts, MAX_FONT_SCALE, radii, shadows, typeScale } from '../theme';
import { AppIcon } from './AppIcon';
import { GuideAvatar } from './GuideAvatar';
import { Entrance, MotionPressable } from './Motion';

/**
 * V2.8 — une carte de félicitations.
 *
 * Elle ne s'affiche que lorsqu'il y a quelque chose à saluer : le domaine
 * (`praise.ts`) renvoie `null` le reste du temps, et rien ne vient alors
 * occuper l'écran. Il n'existe volontairement aucune version « négative » de
 * cette carte — pas de rappel, pas de reproche, pas de série interrompue.
 */
export function PraiseCard({ praise, onClose, tone = 'violet' }: {
  praise: Praise;
  onClose?: () => void;
  tone?: 'violet' | 'mint';
}) {
  const palette = tone === 'mint'
    ? { pale: colors.mintPale, ink: colors.mintInk, edge: '#BEE8E8' }
    : { pale: colors.purplePale, ink: colors.violet, edge: colors.violetEdge };

  return (
    <Entrance key={praise.key} style={[styles.card, { backgroundColor: palette.pale, borderColor: palette.edge }]}>
      <View style={styles.header}>
        <AppIcon name="sparkle" size={15} color={palette.ink} strokeWidth={2} />
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.eyebrow, { color: palette.ink }]}>JAWS T’ACCOMPAGNE</Text>
        {onClose ? (
          <MotionPressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer les félicitations"
            style={styles.close}
          >
            <AppIcon name="close" size={17} color={colors.muted} strokeWidth={2.2} />
          </MotionPressable>
        ) : null}
      </View>

      <View style={styles.row} accessibilityLiveRegion="polite">
        <GuideAvatar size={64} animationKey={praise.key} pose="nod" />
        <View style={styles.body}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>{praise.title}</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.message}>{praise.message}</Text>
        </View>
      </View>

      {praise.detail ? (
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.detail, { color: palette.ink, borderTopColor: palette.edge }]}>
          {praise.detail}
        </Text>
      ) : null}
    </Entrance>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.large, borderWidth: 1, padding: 14, gap: 10, ...shadows.card },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: { flex: 1, fontSize: 12, lineHeight: 16, fontFamily: fonts.bold, letterSpacing: 1 },
  close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginVertical: -8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  body: { flex: 1, minWidth: 0, gap: 4 },
  title: { color: colors.ink, fontSize: 18, lineHeight: 24, fontFamily: fonts.bold, letterSpacing: -0.3 },
  message: { color: colors.inkSoft, ...typeScale.body },
  detail: { ...typeScale.caption, borderTopWidth: 1, paddingTop: 10 },
});
