import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { Entrance, MotionPressable } from './Motion';
import { FoodMotion } from './FoodMotion';

export function FeedbackToast({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => { const timer = setTimeout(onDismiss, 5500); return () => clearTimeout(timer); }, [onDismiss]);
  return <Entrance style={styles.position}>
    <View style={styles.card} accessibilityLiveRegion="polite">
      <View style={styles.check}><FoodMotion kind="rain" size={24} height={44} width={44} foods={['pomme', 'brocoli']} /></View>
      <View style={styles.body}><Text style={styles.title}>Repas enregistré</Text><Text style={styles.copy}>Ton baromètre est à jour.</Text></View>
      <MotionPressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Fermer la confirmation" style={styles.close}><Text style={styles.closeText}>×</Text></MotionPressable>
    </View>
  </Entrance>;
}
const styles = StyleSheet.create({
  position: { position: 'absolute', bottom: 105, left: 16, right: 16, zIndex: 20 },
  card: { backgroundColor: colors.navy, borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: colors.navy, shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  check: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.aqua, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 }, title: { color: colors.white, fontSize: 13, fontWeight: '800' },
  copy: { color: '#DFDDF8', fontSize: 12, marginTop: 4 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.white, fontSize: 24 },
});
