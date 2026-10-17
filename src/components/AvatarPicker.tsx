import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AVATAR_CHOICES } from '../domain/activity-hero';
import { colors, fonts, MAX_FONT_SCALE } from '../theme';
import { AvatarChoice } from '../types';
import { AppIcon } from './AppIcon';
import { UserAvatar } from './UserAvatar';

/**
 * V4.3 — Elle, Lui ou Aucun : le choix du personnage, à l'inscription et dans
 * le profil. `value` à null : rien n'est encore choisi, aucune carte n'est cochée.
 */
export function AvatarPicker({ value, onChange, imageHeight = 104 }: { value: AvatarChoice | null; onChange: (choice: AvatarChoice) => void; imageHeight?: number }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {AVATAR_CHOICES.map(choice => {
        const active = value === choice.id;
        return (
          <Pressable key={choice.id} onPress={() => onChange(choice.id)} accessibilityRole="radio" accessibilityState={{ selected: active }} accessibilityLabel={`Personnage : ${choice.label}`} style={[styles.card, active && styles.cardOn]}>
            <View style={[styles.image, { height: imageHeight }]}>
              {choice.id === 'aucun' ? <AppIcon name="close" size={28} color={colors.muted} strokeWidth={2} /> : <UserAvatar choice={choice.id} pose="face" height={imageHeight} />}
            </View>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.label, active && styles.labelOn]}>{choice.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: 18, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white },
  cardOn: { borderColor: colors.violet, backgroundColor: colors.violetPale },
  image: { justifyContent: 'center', alignItems: 'center' },
  label: { color: colors.inkSoft, fontSize: 14, fontFamily: fonts.bold },
  labelOn: { color: colors.violet },
});
