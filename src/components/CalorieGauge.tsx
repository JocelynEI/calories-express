import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { gaugeMessage } from '../domain/calories';
import { colors, fonts, MAX_FONT_SCALE, radii, typeScale } from '../theme';
import { useExperience } from '../state/ExperienceContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = { consumed: number; target: number };

/**
 * V3.5 — la jauge devient une assiette vue du dessus.
 *
 * La V3.2 avait déjà mis au centre la réponse à la question qu'on pose en
 * ouvrant l'application : combien reste-t-il ? Ce chiffre ne bouge pas. Ce qui
 * change, c'est la forme : un arc de compteur devient le bord d'une assiette,
 * qui se remplit à mesure des repas notés.
 *
 * Le total consommé et le repère ne sont plus répétés au centre : le repère
 * est écrit juste dessous, le total en tête de la liste « Dans ton assiette ».
 * Une information, un seul endroit.
 *
 * Au-dessus du repère, le centre annonce l'écart plutôt qu'un nombre négatif,
 * et la pastille garde son rôle : dire l'état sans le juger.
 */
export function CalorieGauge({ consumed, target }: Props) {
  const { reducedMotion } = useExperience();
  const size = 248;
  const center = size / 2;
  // Le bord de l'assiette, où se dessine la progression.
  const rimRadius = 112;
  const rimWidth = 12;
  const circumference = 2 * Math.PI * rimRadius;
  const ratio = target > 0 ? consumed / target : 0;
  const visualRatio = Math.max(0, Math.min(1, ratio));
  const progress = useRef(new Animated.Value(reducedMotion ? visualRatio : 0)).current;
  const status = gaugeMessage(consumed, target);
  const remaining = Math.round(target - consumed);
  const over = remaining < 0;

  // C'est le chiffre du centre qui s'anime : ce qu'il reste, ou l'écart
  // au-dessus du repère.
  const shownValue = target > 0 ? Math.abs(remaining) : Math.max(0, Math.round(consumed));
  const counter = useRef(new Animated.Value(shownValue)).current;
  const [displayed, setDisplayed] = useState(shownValue);

  // La pastille prend la couleur de l'état ; son texte, l'encre lisible de
  // cette couleur (voir le thème : chaque encre passe 4,5:1 sur sa pastille).
  const tone = useMemo(() => ({
    navy: { pale: colors.violetPale, ink: colors.violet },
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

  const dashOffset = progress.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  const label = target <= 0
    ? 'Profil à vérifier'
    : `${consumed} kilocalories saisies sur un objectif de ${target}. ${over ? `${Math.abs(remaining)} au-dessus du repère` : `${remaining} restantes`}. ${status.label}.`;

  return (
    <View style={styles.wrapper} accessible accessibilityLabel={label}>
      <Svg width={size} height={size}>
        {/* Le bord, puis la part déjà servie, qui part du haut et tourne dans le sens des aiguilles d'une montre. */}
        <Circle cx={center} cy={center} r={rimRadius} fill="none" stroke={colors.track} strokeWidth={rimWidth} />
        <AnimatedCircle
          cx={center} cy={center} r={rimRadius}
          fill="none" stroke={colors.violet} strokeWidth={rimWidth} strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset as never}
          rotation={-90} origin={`${center}, ${center}`}
        />
        {/* L'assiette elle-même, et le creux du centre. */}
        <Circle cx={center} cy={center} r={rimRadius - rimWidth / 2 - 8} fill={colors.card} />
        <Circle cx={center} cy={center} r={rimRadius - rimWidth / 2 - 28} fill="none" stroke={colors.background} strokeWidth={2} />
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
          {target <= 0 ? 'repère à définir' : 'kcal'}
        </Text>
      </View>
      {/* La pastille est posée sur le bas du bord, comme une étiquette. */}
      <View style={[styles.statusPill, { backgroundColor: tone.pale }]} pointerEvents="none">
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.status, { color: tone.ink }]} numberOfLines={1}>{status.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: 248, height: 260, alignItems: 'center', alignSelf: 'center' },
  content: { position: 'absolute', top: 0, height: 248, width: 160, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.muted, fontSize: 14, lineHeight: 18, fontFamily: fonts.semibold },
  value: { color: colors.ink, ...typeScale.numeric, fontSize: 56, lineHeight: 62, letterSpacing: -2.2 },
  unit: { color: colors.muted, fontSize: 14, lineHeight: 18, fontFamily: fonts.semibold },
  statusPill: { position: 'absolute', bottom: 0, maxWidth: 220, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 2, borderColor: colors.background },
  status: { fontSize: 13, lineHeight: 17, fontFamily: fonts.bold },
});
