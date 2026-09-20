import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { gaugeMessage } from '../domain/calories';
import { colors, MAX_FONT_SCALE } from '../theme';
import { useExperience } from '../state/ExperienceContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = { consumed: number; target: number };

/**
 * V1.8 — le grand nombre est désormais ce qu'il reste, pas ce qui a été saisi.
 *
 * C'est la question qu'on se pose en ouvrant l'application à midi. Le total
 * saisi reste lisible juste en dessous du baromètre, dans la ligne de chiffres.
 * Au-dessus du repère, l'écart est annoncé sans jugement.
 */
export function CalorieGauge({ consumed, target }: Props) {
  const { reducedMotion } = useExperience();
  const size = 200;
  const center = size / 2;
  const radius = 80;
  const activeLength = 2 * Math.PI * radius * 0.75;
  const arcPath = describeArc(center, center, radius, 135, 405);
  const ratio = target > 0 ? consumed / target : 0;
  const visualRatio = Math.max(0, Math.min(1, ratio));
  const progress = useRef(new Animated.Value(reducedMotion ? visualRatio : 0)).current;
  const status = gaugeMessage(consumed, target);
  const remaining = Math.round(target - consumed);
  const over = remaining < 0;

  const counter = useRef(new Animated.Value(Math.abs(remaining))).current;
  const [displayed, setDisplayed] = useState(Math.abs(remaining));

  const toneColor = useMemo(() => ({
    navy: colors.violet,
    sage: colors.aqua,
    gold: colors.gold,
  })[status.tone], [status.tone]);

  // Sur la pastille teintée à 10 %, le trait ne suffit pas : le libellé prend
  // une variante plus foncée pour rester lisible.
  const toneText = useMemo(() => ({
    navy: colors.violet,
    sage: '#0B5F59',
    gold: colors.goldText,
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
    const value = Math.abs(remaining);
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
  }, [remaining, counter, reducedMotion]);

  const dashOffset = progress.interpolate({ inputRange: [0, 1], outputRange: [activeLength, 0] });

  const label = target <= 0
    ? 'Profil à vérifier'
    : `${consumed} kilocalories saisies sur un objectif de ${target}. ${over ? `${Math.abs(remaining)} au-dessus du repère` : `${remaining} restantes`}. ${status.label}.`;

  return (
    <View style={styles.wrapper} accessible accessibilityLabel={label}>
      <Svg width={size} height={size}>
        <Path d={arcPath} fill="none" stroke={colors.track} strokeWidth={14} strokeLinecap="round" />
        <AnimatedPath
          d={arcPath}
          fill="none" stroke={toneColor} strokeWidth={14}
          strokeLinecap="round" strokeDasharray={`${activeLength} ${activeLength}`}
          strokeDashoffset={dashOffset as never}
        />
      </Svg>
      <View style={styles.content} pointerEvents="none">
        <Text maxFontSizeMultiplier={1.35} style={styles.value}>
          {over ? '+' : ''}{displayed.toLocaleString('fr-FR')}
        </Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.unit}>
          {target <= 0 ? 'repère à définir' : over ? 'kcal au-dessus' : 'kcal restantes'}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: `${toneColor}1A` }]}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.status, { color: toneText }]}>{status.label}</Text>
        </View>
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
  content: { position: 'absolute', width: 150, alignItems: 'center' },
  value: { color: colors.ink, fontSize: 44, lineHeight: 48, fontWeight: '800', letterSpacing: -1.6 },
  unit: { color: colors.muted, fontSize: 14, fontWeight: '600', marginTop: 1 },
  statusPill: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, marginTop: 10 },
  status: { fontSize: 12, fontWeight: '800' },
});
