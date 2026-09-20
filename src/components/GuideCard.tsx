import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme';
import { AppIcon } from './AppIcon';
import { GuideAvatar } from './GuideAvatar';
import { Entrance, MotionPressable } from './Motion';

type Props = { message: string; tips?: string[]; title?: string; actionLabel?: string; onAction?: () => void; compact?: boolean };

export function GuideCard({ message, tips = [], title = 'Jaws, ton guide', actionLabel, onAction, compact = false }: Props) {
  const [step, setStep] = useState(0);
  const messages = [message, ...tips];
  const current = messages[Math.min(step, messages.length - 1)];
  useEffect(() => { setStep(0); }, [message]);

  return <View style={[styles.card, compact && styles.compact]}>
    <GuideAvatar size={compact ? 78 : 96} animationKey={current} pose="present" />
    <View style={styles.body}>
      <View style={styles.heading}><AppIcon name="sparkle" size={14} color={colors.violet} /><Text style={styles.title}>{title}</Text></View>
      <Entrance key={current} style={styles.bubble}>
        <View style={styles.tail} />
        <Text style={styles.message} accessibilityLiveRegion="polite">{current}</Text>
      </Entrance>
      {messages.length > 1 && <MotionPressable accessibilityRole="button" accessibilityLabel={`Conseil suivant, ${Math.min(step + 1, messages.length)} sur ${messages.length}`} onPress={() => setStep((step + 1) % messages.length)} style={styles.next}>
        <View style={styles.dots}>{messages.map((_, index) => <View key={index} style={[styles.dot, index === step && styles.dotActive]} />)}</View>
        <Text style={styles.nextText}>Conseil suivant</Text><AppIcon name="chevron" size={13} color={colors.inkSoft} />
      </MotionPressable>}
      {actionLabel && onAction && <MotionPressable onPress={onAction} accessibilityRole="button" style={styles.action}>
        <Text style={styles.actionText}>{actionLabel}</Text><AppIcon name="chevron" size={14} color={colors.white} />
      </MotionPressable>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.violetPale, borderRadius: radii.large, borderWidth: 1, borderColor: '#DED8FF', padding: 12, paddingLeft: 4 },
  compact: { padding: 10, paddingLeft: 2 },
  body: { flex: 1, minWidth: 0 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  title: { color: colors.navy, fontSize: 12, fontWeight: '800', flexShrink: 1 },
  bubble: { backgroundColor: colors.white, borderRadius: 17, borderBottomLeftRadius: 5, padding: 12 },
  tail: { position: 'absolute', left: -5, bottom: 12, width: 12, height: 12, backgroundColor: colors.white, transform: [{ rotate: '45deg' }] },
  message: { color: colors.inkSoft, fontSize: 13, lineHeight: 19 },
  next: { minHeight: 44, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' },
  nextText: { color: colors.inkSoft, fontSize: 12, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 4, marginRight: 'auto' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CEC5ED' },
  dotActive: { width: 13, backgroundColor: colors.violet },
  action: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, backgroundColor: colors.violet, borderRadius: 12, minHeight: 44, paddingHorizontal: 10, paddingVertical: 8, marginTop: 4 },
  actionText: { color: colors.white, fontSize: 12, fontWeight: '800', flexShrink: 1 },
});
