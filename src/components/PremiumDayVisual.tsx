import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { FoodArt } from './FoodArt';
import { colors, MAX_FONT_SCALE, radii } from '../theme';
import { useExperience } from '../state/ExperienceContext';

type Props = {
  goalLabel?: string;
  target?: number;
};

/**
 * V2.6 — une image éditoriale composée des illustrations locales.
 *
 * Le visuel donne une vraie accroche à « Ma journée » sans télécharger une
 * photo différente à chaque ouverture. Les aliments restent des SVG légers,
 * mais leur mise en scène (halo, profondeur, ombres et petites formes) donne
 * l'impression d'une image de marque plutôt que d'une simple icône.
 */
export function PremiumDayVisual({ goalLabel = 'À personnaliser', target }: Props) {
  const { reducedMotion, active } = useExperience();
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion || !active) {
      float.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2200, useNativeDriver: true, isInteraction: false }),
        Animated.timing(float, { toValue: 0, duration: 2200, useNativeDriver: true, isInteraction: false }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [active, float, reducedMotion]);

  const lift = float.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  return (
    <View style={styles.card} accessible accessibilityLabel="Illustration d'une assiette équilibrée">
      <View pointerEvents="none" style={styles.wash} />
      <View pointerEvents="none" style={styles.mintOrb} />
      <View style={styles.copy}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.eyebrow}>TON REPÈRE DU JOUR</Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>Mieux manger, sans pression.</Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.subtitle}>Un cap simple pour équilibrer ta journée.</Text>
        <View style={styles.badges}>
          <View style={styles.goalBadge}>
            <Text maxFontSizeMultiplier={1.2} style={styles.goalText}>{goalLabel}</Text>
          </View>
          {target ? (
            <View style={styles.targetBadge}>
              <Text maxFontSizeMultiplier={1.2} style={styles.targetText}>{target.toLocaleString('fr-FR')} kcal</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.artStage} pointerEvents="none">
        <View style={styles.artHalo} />
        <Animated.View style={[styles.plateArt, { transform: [{ translateY: lift }] }]}>
          <FoodArt name="assiette" size={126} />
        </Animated.View>
        <View style={styles.avocadoArt}><FoodArt name="avocat" size={46} /></View>
        <View style={styles.tomatoArt}><FoodArt name="tomate" size={34} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 144,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: radii.large,
    borderWidth: 1,
    borderColor: colors.violetEdge,
    backgroundColor: colors.visualPale,
    paddingLeft: 18,
    paddingVertical: 15,
  },
  wash: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 120,
    right: -80,
    top: -62,
    backgroundColor: '#FFFFFF',
    opacity: 0.48,
  },
  mintOrb: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    right: 105,
    bottom: -22,
    backgroundColor: colors.visualMint,
  },
  copy: { flex: 1, minWidth: 0, zIndex: 2, paddingRight: 4 },
  eyebrow: { color: colors.violet, fontSize: 10, lineHeight: 14, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.visualInk, fontSize: 21, lineHeight: 25, fontWeight: '800', letterSpacing: -0.6, marginTop: 6 },
  subtitle: { color: colors.inkSoft, fontSize: 13, lineHeight: 18, fontWeight: '600', marginTop: 5, maxWidth: 190 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 11 },
  goalBadge: { backgroundColor: colors.white, borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 6 },
  goalText: { color: colors.visualInk, fontSize: 11, fontWeight: '800' },
  targetBadge: { backgroundColor: colors.visualMint, borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 6 },
  targetText: { color: '#236B50', fontSize: 11, fontWeight: '800' },
  artStage: { width: 148, height: 142, alignItems: 'center', justifyContent: 'center', marginRight: -4 },
  artHalo: { position: 'absolute', width: 124, height: 124, borderRadius: 62, backgroundColor: colors.white, opacity: 0.76 },
  plateArt: { position: 'absolute', right: 4, bottom: 1 },
  avocadoArt: { position: 'absolute', right: 2, top: 2, transform: [{ rotate: '13deg' }] },
  tomatoArt: { position: 'absolute', left: 5, bottom: 8, transform: [{ rotate: '-18deg' }] },
});
