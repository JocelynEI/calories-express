import React from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MealEncouragement } from '../domain/coaching';
import { colors, fonts, MAX_FONT_SCALE } from '../theme';
import { GuideAvatar } from './GuideAvatar';
import { Entrance, MotionPressable } from './Motion';
import { Action } from './FormControls';

type Props = { suggestion: MealEncouragement; onClose: () => void; onSnooze: () => void; onDisable: () => void; onIdea: () => void };

export function MealCoachPopup({ suggestion, onClose, onSnooze, onDisable, onIdea }: Props) {
  const { height } = useWindowDimensions();
  return <Entrance style={styles.position}>
    <View style={styles.card}><ScrollView contentContainerStyle={styles.content} style={{ maxHeight: Math.max(220, height * .6) }}>
      <View style={styles.heading}><Text style={styles.eyebrow}>UN MOT DE JAWS</Text><MotionPressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer le conseil de Jaws" style={styles.close}><Text style={styles.cross}>×</Text></MotionPressable></View>
      <View style={styles.row} accessibilityLiveRegion="polite"><GuideAvatar size={58} animationKey={suggestion.title} pose="wave" /><View style={{ flex: 1 }}><Text style={styles.title}>{suggestion.title}</Text><Text style={styles.copy}>{suggestion.message}</Text></View></View>
      {suggestion.action && <Action label={suggestion.action} onPress={onIdea} />}
      <View style={styles.footer}><MotionPressable accessibilityRole="button" onPress={onSnooze} style={styles.linkButton}><Text style={styles.link}>Pas aujourd’hui</Text></MotionPressable><MotionPressable accessibilityRole="button" onPress={onDisable} style={styles.linkButton}><Text style={styles.link}>Désactiver ces conseils</Text></MotionPressable></View>
    </ScrollView></View>
  </Entrance>;
}

/**
 * V4.0 — le même conseil, posé dans l'accueil au lieu de le recouvrir.
 *
 * La fenêtre flottante de la V2 couvrait la moitié de l'écran juste après
 * l'enregistrement d'un repas : on la fermait sans la lire. Ici, Jaws parle
 * dans une carte du fil, sous l'assiette, et l'écran reste utilisable. Les
 * trois choix sont les mêmes : voir l'idée, plus tard, ne plus en recevoir.
 */
export function MealCoachCard({ suggestion, onClose, onSnooze, onDisable, onIdea }: Props) {
  return <Entrance style={styles.inline}>
    <View style={styles.inlineRow} accessibilityLiveRegion="polite">
      <GuideAvatar size={52} animationKey={suggestion.title} pose="wave" />
      <View style={styles.inlineBody}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.inlineTitle}>{suggestion.title}</Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.inlineCopy}>{suggestion.message}</Text>
      </View>
      <MotionPressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer le conseil de Jaws" style={styles.inlineClose}>
        <Text maxFontSizeMultiplier={1.2} style={styles.inlineCross}>×</Text>
      </MotionPressable>
    </View>
    <View style={styles.inlineActions}>
      {suggestion.action ? (
        <MotionPressable accessibilityRole="button" onPress={onIdea} style={styles.inlinePrimary}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.inlinePrimaryText}>{suggestion.action}</Text>
        </MotionPressable>
      ) : null}
      <MotionPressable accessibilityRole="button" onPress={onSnooze} style={styles.linkButton}><Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.inlineLink}>Plus tard</Text></MotionPressable>
      <MotionPressable accessibilityRole="button" onPress={onDisable} style={styles.linkButton}><Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.inlineLink}>Ne plus proposer</Text></MotionPressable>
    </View>
  </Entrance>;
}

const styles = StyleSheet.create({
  position: { position: 'absolute', left: 12, right: 12, bottom: 94, zIndex: 30 },
  card: { borderRadius: 23, backgroundColor: colors.white, borderColor: colors.violetEdge, borderWidth: 1, shadowColor: colors.navy, shadowOpacity: .18, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 12, overflow: 'hidden' }, content: { padding: 15, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { color: colors.sageDark, fontSize: 12, letterSpacing: 1, fontFamily: fonts.extrabold },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, cross: { color: colors.navy, fontSize: 26, fontFamily: fonts.medium },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 }, title: { fontSize: 17, lineHeight: 23, color: colors.navy, fontFamily: fonts.extrabold }, copy: { fontSize: 13, fontFamily: fonts.medium, lineHeight: 19, color: colors.inkSoft, marginTop: 7 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 7 }, linkButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }, link: { color: colors.sageDark, fontSize: 12, fontFamily: fonts.bold },

  inline: { backgroundColor: colors.violetPale, borderRadius: 24, padding: 14, gap: 8 },
  inlineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  inlineBody: { flex: 1, minWidth: 0, gap: 3 },
  inlineTitle: { color: colors.ink, fontSize: 15, lineHeight: 21, fontFamily: fonts.bold },
  inlineCopy: { color: colors.inkSoft, fontSize: 13, lineHeight: 19, fontFamily: fonts.medium },
  inlineClose: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  inlineCross: { color: colors.muted, fontSize: 24, lineHeight: 28, fontFamily: fonts.medium },
  inlineActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingLeft: 64 },
  inlinePrimary: { minHeight: 44, borderRadius: 14, backgroundColor: colors.violet, paddingHorizontal: 14, justifyContent: 'center' },
  inlinePrimaryText: { color: colors.white, fontSize: 14, fontFamily: fonts.bold },
  inlineLink: { color: colors.sageDark, fontSize: 14, fontFamily: fonts.bold },
});
