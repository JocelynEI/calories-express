import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { AppIcon } from '../components/AppIcon';
import { FoodMotion } from '../components/FoodMotion';
import { GuideAvatar } from '../components/GuideAvatar';
import { MotionPressable } from '../components/Motion';
import { greeting } from '../domain/experience';
import { longDayLabel } from '../domain/date';
import { useApp } from '../state/AppContext';
import { useExperience } from '../state/ExperienceContext';
import { colors, MAX_FONT_SCALE, radii, shadows, fonts } from '../theme';

/**
 * V2.2 — l'ouverture de l'application.
 *
 * Jusqu'ici, deux écrans se disputaient ce rôle : le parcours de création du
 * profil, soigné mais joué une seule fois, et cet écran-ci, hérité de la V1.1 et
 * resté austère. On voyait donc la belle mise en scène une fois, puis plus
 * jamais. Cet écran reprend le même langage visuel — halos, marque qui se
 * dessine, Jaws qui salue — pour que chaque ouverture y ressemble.
 *
 * Il reste court : trois secondes de lecture, un bouton, et on entre.
 * Il se coupe dans Profil si on préfère aller droit au but.
 *
 * Toutes les animations de ce fichier utilisent le pilote JavaScript.
 */

const AnimatedPath = Animated.createAnimatedComponent(Path);
const RING = 150;
const RADIUS = 61;
const ARC = 2 * Math.PI * RADIUS * 0.75;

export function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  const { profile, profileCompleted } = useApp();
  const { reducedMotion } = useExperience();

  const enter = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const draw = useRef(new Animated.Value(reducedMotion ? 0 : ARC)).current;

  useEffect(() => {
    if (reducedMotion) { enter.setValue(1); draw.setValue(0); return; }
    const animation = Animated.timing(enter, {
      toValue: 1, duration: 900, easing: Easing.out(Easing.cubic),
      useNativeDriver: false, isInteraction: false,
    });
    const id = enter.addListener(({ value }) => draw.setValue(ARC * (1 - Math.min(1, value * 1.15))));
    animation.start();
    return () => { animation.stop(); enter.removeListener(id); };
  }, [enter, draw, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) { glow.setValue(0.5); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: false, isInteraction: false }),
      Animated.timing(glow, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: false, isInteraction: false }),
    ]));
    animation.start();
    return () => { animation.stop(); };
  }, [glow, reducedMotion]);

  const step = (from: number, to: number, distance = 20) => {
    const value = enter.interpolate({ inputRange: [0, from, to, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });
    return {
      opacity: value,
      transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
    };
  };

  const center = RING / 2;
  const start = { x: center + RADIUS * Math.cos((135 * Math.PI) / 180), y: center + RADIUS * Math.sin((135 * Math.PI) / 180) };
  const end = { x: center + RADIUS * Math.cos((45 * Math.PI) / 180), y: center + RADIUS * Math.sin((45 * Math.PI) / 180) };
  const arc = `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 1 1 ${end.x} ${end.y}`;

  return (
    <View style={styles.screen}>
      <Animated.View pointerEvents="none" style={[styles.glowTop, {
        transform: [
          { translateY: glow.interpolate({ inputRange: [0, 1], outputRange: [-20, 18] }) },
          { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) },
        ],
      }]} />
      <Animated.View pointerEvents="none" style={[styles.glowBottom, {
        transform: [
          { translateY: glow.interpolate({ inputRange: [0, 1], outputRange: [16, -16] }) },
          { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1.12, 0.94] }) },
        ],
      }]} />

      <View style={styles.body}>
        <Animated.View style={[styles.brandRow, step(0, 0.3, 10)]}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.brand}>CALORIES EXPRESS</Text>
        </Animated.View>

        <Animated.View style={[styles.markWrap, step(0, 0.35, 14)]}>
          <Svg width={RING} height={RING}>
            <Circle
              cx={center} cy={center} r={RADIUS} fill="none"
              stroke={colors.violetEdge} strokeWidth={14} strokeLinecap="round"
              strokeDasharray={`${ARC} ${ARC * 2}`} transform={`rotate(135 ${center} ${center})`}
            />
            <AnimatedPath
              d={arc} fill="none" stroke={colors.violet} strokeWidth={14} strokeLinecap="round"
              strokeDasharray={`${ARC} ${ARC}`} strokeDashoffset={draw as unknown as number}
            />
            <Circle cx={center} cy={center - 33} r={9} fill={colors.aqua} />
            <Rect x={center - 35} y={center - 5} width={70} height={11} rx={5.5} fill={colors.navy} />
            <Path d={`M ${center - 28} ${center + 6} A 28 28 0 0 0 ${center + 28} ${center + 6} Z`} fill={colors.navy} />
          </Svg>
        </Animated.View>

        <Animated.View style={step(0.2, 0.55)}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.day}>{longDayLabel().toLocaleUpperCase('fr-FR')}</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.greeting}>{greeting(profile.firstName)}</Text>
        </Animated.View>

        <Animated.View style={[styles.jawsRow, step(0.35, 0.75)]}>
          <GuideAvatar size={104} animationKey="accueil" pose="wave" />
          <View style={styles.bubble}>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.bubbleText}>
              {profileCompleted
                ? 'Content de te revoir. Ton repère t’attend.'
                : 'Bienvenue ! Créons ton repère, tranquillement.'}
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.parade, step(0.5, 0.9)]}>
          <FoodMotion kind="parade" size={30} height={52} width={320} foods={['pomme', 'brocoli', 'oeuf', 'pain', 'avocat', 'tomate', 'riz', 'carotte']} />
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, step(0.6, 1)]}>
        <MotionPressable onPress={onContinue} accessibilityRole="button" style={styles.start}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.startText}>Entrer</Text>
          <AppIcon name="chevron" size={19} color={colors.white} strokeWidth={2.4} />
        </MotionPressable>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.footNote}>
          Cet écran se règle dans Profil · Accueil au lancement
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, overflow: 'hidden', width: '100%', maxWidth: 520, alignSelf: 'center' },
  glowTop: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: colors.violetPale, top: -120, right: -100 },
  glowBottom: { position: 'absolute', width: 290, height: 290, borderRadius: 145, backgroundColor: colors.aquaPale, bottom: -110, left: -90 },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  brandRow: { alignItems: 'center' },
  brand: { color: colors.violet, fontSize: 12, fontFamily: fonts.extrabold, letterSpacing: 2.2 },
  markWrap: { alignItems: 'center', justifyContent: 'center' },

  day: { color: colors.muted, fontSize: 12, fontFamily: fonts.extrabold, letterSpacing: 1.5, textAlign: 'center' },
  greeting: { color: colors.ink, fontSize: 32, lineHeight: 38, fontFamily: fonts.extrabold, letterSpacing: -0.9, textAlign: 'center', marginTop: 6 },

  jawsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  bubble: { flex: 1, backgroundColor: colors.card, borderRadius: 18, borderBottomLeftRadius: 6, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.line, ...shadows.card },
  bubbleText: { color: colors.inkSoft, fontSize: 15, lineHeight: 21, fontFamily: fonts.semibold },

  parade: { alignItems: 'center', opacity: 0.95 },

  footer: { paddingHorizontal: 24, paddingBottom: 18, gap: 10 },
  start: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, minHeight: 58, borderRadius: radii.large, backgroundColor: colors.violet, ...shadows.raised },
  startText: { color: colors.white, fontSize: 17, fontFamily: fonts.extrabold },
  footNote: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium, lineHeight: 17, textAlign: 'center' },
});
