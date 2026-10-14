import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { gaugeMessage } from '../domain/calories';
import { PlateSegment } from '../domain/meals';
import { colors, fonts, MAX_FONT_SCALE, typeScale } from '../theme';
import { useExperience } from '../state/ExperienceContext';
import { toneFor } from './MealCard';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  consumed: number;
  target: number;
  /** V4.0 — les parts de l'assiette, une par moment de la journée. */
  segments?: PlateSegment[];
};

/**
 * V3.5 — la jauge est une assiette vue du dessus.
 * V4.0 — son bord se colore par repas.
 *
 * Le centre répond toujours à la même question : combien reste-t-il ? Le bord,
 * lui, raconte la journée : orange pour le petit-déjeuner, vert pour le
 * déjeuner, bleu-vert pour le goûter, prune pour le dîner — les teintes du
 * Journal. On voit d'un coup d'œil quel repas a pesé le plus.
 *
 * Les parts se dessinent l'une après l'autre, dans l'ordre de la journée, en
 * partant du haut. Au-dessus de l'objectif, le bord est plein et le centre
 * annonce l'écart plutôt qu'un nombre négatif.
 */
export function CalorieGauge({ consumed, target, segments }: Props) {
  const { reducedMotion } = useExperience();
  const size = 224;
  const center = size / 2;
  // Le bord de l'assiette, où se dessinent les parts.
  const rimRadius = 100;
  const rimWidth = 18;
  const circumference = 2 * Math.PI * rimRadius;
  const ratio = target > 0 ? consumed / target : 0;
  const visualRatio = Math.max(0, Math.min(1, ratio));

  // Sans détail par moment (anciens appels), une seule part couvre ce qui a été mangé.
  const parts: PlateSegment[] = segments ?? (visualRatio > 0 ? [{ moment: 'Déjeuner', start: 0, length: visualRatio }] : []);
  const end = parts.reduce((max, part) => Math.max(max, part.start + part.length), 0);

  // Une seule valeur animée, la part du tour déjà dessinée : chaque segment en
  // lit sa portion. Le pilote reste JS, comme pour le compteur du centre.
  const progress = useRef(new Animated.Value(reducedMotion ? end : 0)).current;
  const status = gaugeMessage(consumed, target);
  const remaining = Math.round(target - consumed);
  const over = remaining < 0;

  const shownValue = target > 0 ? Math.abs(remaining) : Math.max(0, Math.round(consumed));
  const counter = useRef(new Animated.Value(shownValue)).current;
  const [displayed, setDisplayed] = useState(shownValue);

  useEffect(() => {
    if (reducedMotion) { progress.setValue(end); return; }
    const animation = Animated.timing(progress, { toValue: end, duration: 700, useNativeDriver: false, isInteraction: false });
    animation.start();
    return () => animation.stop();
  }, [progress, end, reducedMotion]);

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

  const label = target <= 0
    ? 'Profil à vérifier'
    : `${consumed} kilocalories mangées sur un objectif de ${target}. ${over ? `${Math.abs(remaining)} au-dessus de l’objectif` : `${remaining} restantes`}. ${status.label}.`;

  return (
    <View style={styles.wrapper} accessible accessibilityLabel={label}>
      <Svg width={size} height={size}>
        {/* Le bord vide, puis une part par moment, qui part du haut et tourne dans le sens des aiguilles d'une montre. */}
        <Circle cx={center} cy={center} r={rimRadius} fill="none" stroke={colors.track} strokeWidth={rimWidth} />
        {parts.map(part => (
          <AnimatedCircle
            key={part.moment}
            cx={center} cy={center} r={rimRadius}
            fill="none" stroke={toneFor(part.moment).fill} strokeWidth={rimWidth} strokeLinecap="butt"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={progress.interpolate({
              inputRange: [part.start, part.start + Math.max(part.length, 0.0001)],
              outputRange: [circumference, circumference * (1 - part.length)],
              extrapolate: 'clamp',
            }) as never}
            rotation={-90 + part.start * 360} origin={`${center}, ${center}`}
          />
        ))}
        {/* L'assiette elle-même, et le creux du centre. */}
        <Circle cx={center} cy={center} r={rimRadius - rimWidth / 2 - 6} fill={colors.card} stroke={colors.background} strokeWidth={2} />
        <Circle cx={center} cy={center} r={rimRadius - rimWidth / 2 - 22} fill="none" stroke={colors.background} strokeWidth={2} />
      </Svg>
      <View style={styles.content} pointerEvents="none">
        {target > 0 ? (
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.eyebrow}>
            {over ? 'Au-dessus de' : 'Il te reste'}
          </Text>
        ) : null}
        <Text maxFontSizeMultiplier={1.3} style={styles.value}>
          {displayed.toLocaleString('fr-FR')}
        </Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.unit}>
          {target <= 0 ? 'objectif à définir' : 'kcal'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: 224, height: 224, alignItems: 'center', alignSelf: 'center' },
  content: { position: 'absolute', top: 0, height: 224, width: 150, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.muted, fontSize: 14, lineHeight: 18, fontFamily: fonts.semibold },
  value: { color: colors.ink, ...typeScale.numeric, fontSize: 48, lineHeight: 54, letterSpacing: -1.8 },
  unit: { color: colors.muted, fontSize: 14, lineHeight: 18, fontFamily: fonts.semibold },
});
