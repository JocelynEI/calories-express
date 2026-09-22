import React from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MealEncouragement } from '../domain/coaching';
import { colors, fonts } from '../theme';
import { GuideAvatar } from './GuideAvatar';
import { Entrance, MotionPressable } from './Motion';
import { Action } from './FormControls';

export function MealCoachPopup({ suggestion, onClose, onSnooze, onDisable, onIdea }: { suggestion: MealEncouragement; onClose: () => void; onSnooze: () => void; onDisable: () => void; onIdea: () => void }) {
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
const styles = StyleSheet.create({
  position: { position: 'absolute', left: 12, right: 12, bottom: 94, zIndex: 30 },
  card: { borderRadius: 23, backgroundColor: colors.white, borderColor: '#CAC3E9', borderWidth: 1, shadowColor: colors.navy, shadowOpacity: .18, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 12, overflow: 'hidden' }, content: { padding: 15, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { color: colors.sageDark, fontSize: 12, letterSpacing: 1, fontFamily: fonts.extrabold },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, cross: { color: colors.navy, fontSize: 26, fontFamily: fonts.medium },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 }, title: { fontSize: 17, lineHeight: 23, color: colors.navy, fontFamily: fonts.extrabold }, copy: { fontSize: 13, fontFamily: fonts.medium, lineHeight: 19, color: colors.inkSoft, marginTop: 7 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 7 }, linkButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }, link: { color: colors.sageDark, fontSize: 12, fontFamily: fonts.bold },
});
