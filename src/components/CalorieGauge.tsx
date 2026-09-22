import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { gaugeMessage } from '../domain/calories';
import { colors, fonts, MAX_FONT_SCALE, radii, typeScale } from '../theme';
import { useExperience } from '../state/ExperienceContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = { consumed: number; target: number };

/**
 * V2.7 — la jauge du design system.
 *
 * Un arc de 240° — l'ouverture en bas, de 120°, accueille la pastille d'état.
 * Au centre, le total consommé en grand, le repère juste dessous : c'est la
 * lecture demandée par le brief (« 1 310 sur 2 100 kcal »). Ce qu'il reste
 * n'a pas disparu : il est annoncé dans l'en-tête du bloc « Ma journée » et
 * dans la ligne de chiffres sous la jauge.
 *
 * La progression est toujours violette. Au-dessus du repère, l'arc reste
 * plein et c'est la pastille qui le dit, sans jugement.
 */
export function CalorieGauge({ consumed, target }: Props) {
  const { reducedMotion } = useExperience();
  const size = 200;
  const center = size / 2;
  const radius = 82;
  // 240° : de 150° (bas gauche) à 390° (bas droite), dans le sens horaire.
  const activeLength = 2 * Math.PI * radius * (240 / 360);
  const arcPath = describeArc(center, center, radius, 150, 390);
  const ratio = target > 0 ? consumed / target : 0;
  const visualRatio = Math.max(0, Math.min(1, ratio));
  const progress = useRef(new Animated.Value(reducedMotion ? visualRatio : 0)).current;
  const status = gaugeMessage(consumed, target);
  const remaining = Math.round(target - consumed);
  const over = remaining < 0;

  const shownValue = Math.max(0, Math.round(consumed));
  const counter = useRef(new Animated.Value(shownValue)).current;
  const [displayed, setDisplayed] = useState(shownValue);

  // La pastille prend la couleur de l'état ; son texte, l'encre lisible de
  // cette couleur (voir le thème : les accents du brief sont illisibles en
  // texte, leurs encres passent 4,5:1).
  const tone = useMemo(() => ({
    navy: { pale: colors.purplePale, ink: colors.violet },
    sage: { pale: colors.mintPale, ink: colors.mintInk },
    gold: { pale: colors.warmPale, ink: colors.warmInk },
  })[status.tone], [status.tone]);

  useEffect(() => {
    if (reducedMotion) { progress.setValue(visualRatio); return; }
    const animation = Animated.spring(progress, {
      toValue: visualRatio,
      useNativeDriver: false,
      speed: 10,
      bounciness: 2,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, visualRatio, reducedMotion]);

  useEffect(() => {
    const value = shownValue;
    if (reducedMotion) { counter.setValue(value); setDisplayed(value); return; }
    // Le compteur est arrondi à un pas : sans cela, monter jusqu'à 2 000 en
    // 620 ms provoquerait des centaines de rendus de l'écran d'accueil.
    const step = Math.max(1, Math.round(value / 50));
    const listener = counter.addListener(({ value: current }) => {
      setDisplayed(Math.abs(current - value) < step ? value : Math.round(current / step) * step);
    });
    const animation = Animated.timing(counter, { toValue: value, duration: 620, useNativeDriver: false, isInteraction: false });
    animation.start(({ finished }) => { if (finished) setDisplayed(value); });
    return () => { animation.stop(); counter.removeListener(listener); };
  }, [shownValue, counter, reducedMotion]);

  const dashOffset = progress.interpolate({ inputRange: [0, 1], outputRange: [activeLength, 0] });

  const label = target <= 0
    ? 'Profil à vérifier'
    : `${consumed} kilocalories saisies sur un objectif de ${target}. ${over ? `${Math.abs(remaining)} au-dessus du repère` : `${remaining} restantes`}. ${status.label}.`;

  return (
    <View style={styles.wrapper} accessible accessibilityLabel={label}>
      <Svg width={size} height={size}>
        <Path d={arcPath} fill="none" stroke={colors.track} strokeWidth={16} strokeLinecap="round" />
        <AnimatedPath
          d={arcPath}
          fill="none" stroke={colors.violet} strokeWidth={16}
          strokeLinecap="round" strokeDasharray={`${activeLength} ${activeLength}`}
          strokeDashoffset={dashOffset as never}
        />
      </Svg>
      <View style={styles.content} pointerEvents="none">
        <Text maxFontSizeMultiplier={1.35} style={styles.value}>
          {displayed.toLocaleString('fr-FR')}
        </Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.unit}>
          {target <= 0 ? 'repère à définir' : `sur ${target.toLocaleString('fr-FR')} kcal`}
        </Text>
      </View>
      {/* La pastille loge dans l'ouverture de 120° en bas de l'arc. */}
      <View style={[styles.statusPill, { backgroundColor: tone.pale }]} pointerEvents="none">
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.status, { color: tone.ink }]} numberOfLines={1}>{status.label}</Text>
      </View>
    </View>
  );
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const point = (angle: number) => {
    const radians = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
  };
  const start = point(startAngle);
  const end = point(endAngle);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 1 1 ${end.x} ${end.y}`;
}

const styles = StyleSheet.create({
  wrapper: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  content: { position: 'absolute', width: 150, alignItems: 'center', marginTop: -8 },
  value: { color: colors.ink, ...typeScale.numeric, fontSize: 36, lineHeight: 42 },
  unit: { color: colors.muted, fontSize: 13, lineHeight: 18, fontFamily: fonts.medium, marginTop: 2 },
  statusPill: { position: 'absolute', bottom: 6, maxWidth: 150, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6 },
  status: { fontSize: 12, lineHeight: 16, fontFamily: fonts.bold },
});
