import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { GuideAvatar } from './GuideAvatar';
import { Entrance, MotionPressable } from './Motion';

export type ActivityFeedback = { key: string; title: string; message: string; detail?: string };
export function ActivityCelebration({ feedback, onClose }: { feedback: ActivityFeedback; onClose: () => void }) {
  return <Entrance key={feedback.key} style={styles.card}>
    <View style={styles.header}><Text style={styles.eyebrow}>JAWS T’ACCOMPAGNE</Text><MotionPressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer les félicitations" style={styles.close}><Text style={{ fontSize: 25, fontFamily: fonts.medium, color: colors.navy }}>×</Text></MotionPressable></View>
    <View style={styles.row} accessibilityLiveRegion="polite"><GuideAvatar size={64} animationKey={feedback.key} pose="nod" /><View style={{ flex: 1, gap: 6 }}><Text style={styles.title}>{feedback.title}</Text><Text style={styles.copy}>{feedback.message}</Text></View></View>
    {feedback.detail && <Text style={styles.detail}>{feedback.detail}</Text>}
  </Entrance>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#F1EDFF', borderColor: '#C9BCF7', borderWidth: 1, borderRadius: 23, padding: 14, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }, eyebrow: { fontSize: 12, fontFamily: fonts.extrabold, color: colors.sageDark, letterSpacing: 1 }, close: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' }, title: { color: colors.navy, fontSize: 18, lineHeight: 24, fontFamily: fonts.extrabold }, copy: { color: colors.inkSoft, fontSize: 13, fontFamily: fonts.medium, lineHeight: 20 },
  detail: { fontSize: 12, fontFamily: fonts.medium, lineHeight: 18, color: colors.sageDark, borderTopWidth: 1, borderTopColor: '#D6CCF6', paddingTop: 12 },
});
