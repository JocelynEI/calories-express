import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import { MotionPressable } from './Motion';

export function Action({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <MotionPressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[form.button, secondary && form.secondary, disabled && { opacity: 0.5 }]}><Text style={[form.buttonText, secondary && form.secondaryText]}>{label}</Text></MotionPressable>;
}
export function Field({ label, value, onChange, numeric = false, placeholder, maxLength = 80 }: { label: string; value: string; onChange: (text: string) => void; numeric?: boolean; placeholder?: string; maxLength?: number }) {
  return <View style={{ gap: 6 }}><Text style={form.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={numeric ? 'decimal-pad' : 'default'} maxLength={maxLength} style={form.input} /></View>;
}
export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <MotionPressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[form.choice, selected && form.choiceActive]}><Text style={[form.choiceText, selected && form.choiceTextActive]}>{label}</Text></MotionPressable>;
}
export const form = StyleSheet.create({
  card: { backgroundColor: colors.card, padding: 16, borderRadius: 22, borderWidth: 1, borderColor: colors.line, gap: 13 },
  title: { fontSize: 17, fontWeight: '800', color: colors.navy },
  copy: { color: colors.inkSoft, fontSize: 13, lineHeight: 19 },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  label: { fontSize: 12, fontWeight: '700', color: colors.inkSoft },
  input: { borderWidth: 1, borderColor: '#C9CEDC', borderRadius: 12, backgroundColor: colors.white, minHeight: 46, paddingHorizontal: 12, paddingVertical: 10, color: colors.ink, fontSize: 15 },
  button: { minHeight: 46, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.violet, justifyContent: 'center', alignItems: 'center' },
  buttonText: { fontSize: 13, fontWeight: '800', color: colors.white, textAlign: 'center' },
  secondary: { backgroundColor: colors.violetPale },
  secondaryText: { color: colors.sageDark },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  choice: { borderColor: '#C9CEDC', borderWidth: 1, backgroundColor: colors.white, borderRadius: 12, minHeight: 44, paddingHorizontal: 12, paddingVertical: 11, justifyContent: 'center' },
  choiceActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  choiceText: { color: colors.inkSoft, fontSize: 12, fontWeight: '600' },
  choiceTextActive: { color: colors.white },
  error: { backgroundColor: '#FFF1D9', color: '#75510D', padding: 12, borderRadius: 12, fontSize: 13, lineHeight: 18 },
  success: { color: '#096B5B', backgroundColor: colors.aquaPale, borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 18 },
});
