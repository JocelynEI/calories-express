import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useExperience } from '../state/ExperienceContext';
import { colors, fonts, MAX_FONT_SCALE } from '../theme';
import { AppIcon, IconName } from './AppIcon';
import { MotionPressable } from './Motion';

export type AddChoice = 'scan' | 'search' | 'recipe' | 'activity' | 'weight';

type Props = { onChoose: (choice: AddChoice) => void; onClose: () => void };

const TILES: { id: Exclude<AddChoice, 'scan'>; label: string; icon: IconName; ink: string }[] = [
  { id: 'search', label: 'Chercher un aliment', icon: 'search', ink: colors.violet },
  { id: 'recipe', label: 'Un plat maison', icon: 'list', ink: colors.warmInk },
  { id: 'activity', label: 'Une activité', icon: 'steps', ink: colors.mintInk },
  { id: 'weight', label: 'Noter mon poids', icon: 'weight', ink: colors.purpleInk },
];

/**
 * V4.0 — le bouton + de la barre du bas ouvre cette feuille.
 *
 * Jusqu'ici il n'ajoutait qu'un repas, et chaque autre geste avait son propre
 * chemin. Tout ce qu'on peut ajouter est maintenant au même endroit, à portée
 * de pouce : le scan d'étiquette en premier et en grand, puis quatre tuiles.
 */
export function AddSheet({ onChoose, onClose }: Props) {
  const { reducedMotion } = useExperience();
  return (
    <Modal visible transparent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer" />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title} accessibilityRole="header">Ajouter</Text>
            <MotionPressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer" style={styles.close}>
              <AppIcon name="close" size={18} color={colors.navy} strokeWidth={2.4} />
            </MotionPressable>
          </View>

          <MotionPressable onPress={() => onChoose('scan')} accessibilityRole="button" accessibilityLabel="Scanner une étiquette" style={styles.scan}>
            <View style={styles.scanIcon}>
              <Svg width={30} height={30} viewBox="0 0 24 24" accessibilityElementsHidden>
                <Path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M8 9h8M8 12h8M8 15h5" fill="none" stroke={colors.white} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <View style={styles.scanText}>
              <Text maxFontSizeMultiplier={1.4} style={styles.scanTitle}>Scanner une étiquette</Text>
              <Text maxFontSizeMultiplier={1.4} style={styles.scanCopy}>Un paquet, une boîte, une bouteille</Text>
            </View>
          </MotionPressable>

          <View style={styles.grid}>
            {TILES.map(tile => (
              <MotionPressable
                key={tile.id}
                onPress={() => onChoose(tile.id)}
                accessibilityRole="button"
                accessibilityLabel={tile.label}
                containerStyle={styles.tileOuter}
                style={styles.tile}
              >
                <View style={styles.tileIcon}>
                  <AppIcon name={tile.icon} size={22} color={tile.ink} strokeWidth={2.1} />
                </View>
                <Text maxFontSizeMultiplier={1.4} style={styles.tileText}>{tile.label}</Text>
              </MotionPressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,38,30,0.55)' },
  sheet: { width: '100%', maxWidth: 480, backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34, gap: 16 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.track },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.ink, fontSize: 26, lineHeight: 32, fontFamily: fonts.displayHeavy, letterSpacing: -0.4 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  scan: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.navy, borderRadius: 26, padding: 18 },
  scanIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  scanText: { flex: 1, minWidth: 0, gap: 3 },
  scanTitle: { color: colors.white, fontSize: 20, lineHeight: 25, fontFamily: fonts.display },
  scanCopy: { color: colors.onDarkMuted, fontSize: 14, lineHeight: 19, fontFamily: fonts.medium },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tileOuter: { flexBasis: '46%', flexGrow: 1 },
  tile: { minHeight: 108, backgroundColor: colors.background, borderRadius: 22, padding: 16, gap: 12, justifyContent: 'space-between' },
  tileIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  tileText: { color: colors.ink, fontSize: 16, lineHeight: 20, fontFamily: fonts.semibold },
});
