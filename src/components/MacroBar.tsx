import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { useExperience } from '../state/ExperienceContext';

export function MacroBar({ label, value, target, color, partial = false }: { label: string; value: number; target: number; color: string; partial?: boolean }) {
  const ratio = Math.min(1, target > 0 ? value / target : 0);
  const { reducedMotion } = useExperience();
  const progress = useRef(new Animated.Value(ratio)).current;
  useEffect(() => {
    if (reducedMotion) { progress.setValue(ratio); return; }
    const animation = Animated.timing(progress, { toValue: ratio, duration: 650, useNativeDriver: false, isInteraction: false });
    animation.start(); return () => animation.stop();
  }, [progress, ratio, reducedMotion]);
  return (
    <View style={styles.row}>
      <View style={styles.heading}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}><Text style={styles.strong}>{partial && value === 0 ? '—' : `${partial ? '≥ ' : ''}${Math.round(value * 10) / 10} g`}</Text> / {target} g</Text>
      </View>
      <View style={styles.track}><Animated.View style={[styles.fill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: color }]} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 7 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { color: colors.inkSoft, fontSize: 13, fontFamily: fonts.semibold },
  value: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium },
  strong: { color: colors.inkSoft, fontFamily: fonts.bold },
  track: { height: 6, backgroundColor: colors.line, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 4 },
});
