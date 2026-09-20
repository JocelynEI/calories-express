import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useExperience } from '../state/ExperienceContext';
import { colors, MAX_FONT_SCALE } from '../theme';
import { AppIcon, IconName } from './AppIcon';

export type TabName = 'today' | 'journal' | 'progress' | 'profile';

type Props = { active: TabName; onChange: (tab: TabName) => void; onAdd: () => void };

const items: { id: TabName; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Aujourd’hui', icon: 'home' },
  { id: 'journal', label: 'Journal', icon: 'journal' },
  { id: 'progress', label: 'Progression', icon: 'chart' },
  { id: 'profile', label: 'Profil', icon: 'profile' },
];

export function BottomNav({ active, onChange, onAdd }: Props) {
  const { reducedMotion } = useExperience();
  // L'indicateur glisse d'un onglet à l'autre au lieu de sauter : c'est ce qui
  // relie visuellement l'onglet quitté à celui qu'on ouvre.
  const position = useRef(new Animated.Value(items.findIndex(item => item.id === active))).current;
  useEffect(() => {
    const target = items.findIndex(item => item.id === active);
    if (reducedMotion) { position.setValue(target); return; }
    const animation = Animated.timing(position, {
      toValue: target, duration: 320, easing: Easing.out(Easing.cubic),
      useNativeDriver: true, isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [active, position, reducedMotion]);

  // Cinq emplacements de largeur égale : deux onglets, le bouton Ajouter au
  // centre, puis deux onglets. Les positions 2 et 3 sautent donc par-dessus lui.
  // Le décalage est calculé en pixels : React Native n'accepte pas de
  // pourcentage dans une translation.
  const [barWidth, setBarWidth] = useState(0);
  const slot = barWidth / 5;
  const slide = position.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, slot, slot * 3, slot * 4],
  });

  return (
    <View style={styles.safe} onLayout={event => setBarWidth(event.nativeEvent.layout.width)}>
      {barWidth > 0 && (
        <Animated.View pointerEvents="none" style={[styles.indicator, { width: slot * 0.5, left: slot * 0.25, transform: [{ translateX: slide }] }]} />
      )}
      <View style={styles.bar}>
        {items.slice(0, 2).map((item) => <NavItem key={item.id} item={item} active={active === item.id} onPress={() => onChange(item.id)} />)}
        <View style={styles.centerSlot}>
          <Pressable onPress={onAdd} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Ajouter un repas">
            <AppIcon name="plus" size={29} color={colors.white} strokeWidth={2.2} />
          </Pressable>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} numberOfLines={1} style={styles.addLabel}>Ajouter</Text>
        </View>
        {items.slice(2).map((item) => <NavItem key={item.id} item={item} active={active === item.id} onPress={() => onChange(item.id)} />)}
      </View>
    </View>
  );
}

function NavItem({ item, active, onPress }: { item: typeof items[number]; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && styles.pressed]} accessibilityRole="tab" accessibilityState={{ selected: active }}>
      <AppIcon name={item.icon} size={22} color={active ? colors.violet : colors.muted} strokeWidth={active ? 2.2 : 1.7} />
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} numberOfLines={1} style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
      {active && <View style={styles.activeDot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Le débordement reste visible : le bouton Ajouter dépasse volontairement de
  // 31 pixels au-dessus de la barre. La V2.2 le masquait, et le bouton
  // apparaissait donc coupé net. Les libellés, eux, se coupaient dès que
  // la taille de texte du téléphone était augmentée : la barre s'adapte
  // désormais à leur hauteur au lieu d'être figée à 82 pixels.
  safe: { backgroundColor: colors.card, borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth },
  indicator: { position: 'absolute', top: 0, height: 3, borderRadius: 2, backgroundColor: colors.violet },
  bar: { minHeight: 82, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 12, paddingBottom: 6, paddingHorizontal: 4 },
  item: { flex: 1, alignItems: 'center', gap: 5, minHeight: 58 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '500', textAlign: 'center' },
  activeLabel: { color: colors.violet, fontWeight: '700' },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.aqua },
  centerSlot: { flex: 1, alignItems: 'center', marginTop: -31 },
  addButton: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: colors.background, shadowColor: colors.violet, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 7 },
  addLabel: { color: colors.violet, fontSize: 12, fontWeight: '700', marginTop: 5 },
  pressed: { opacity: 0.65 },
});
