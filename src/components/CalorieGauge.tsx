import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { gaugeMessage } from '../domain/calories';
import { colors, fonts, MAX_FONT_SCALE, radii, typeScale } from '../theme';
import { useExperience } from '../state/ExperienceContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = { consumed: number; target: number };

/**
 * V3.2 — la jauge répond à la question qu'on lui pose.
 *
 * Jusqu'ici le centre affichait le total consommé : « 1 850 sur 2 100 ». Un
 * constat exact, mais muet — à 16 h, 1 850 ne veut rien dire tant qu'on n'a
 * pas fait la soustraction soi-même. Or la question posée en ouvrant
 * l'application avant de passer à table est toujours la même : combien
 * reste-t-il pour ce soir ?
 *
 * C'est donc ce chiffre qui occupe le centre, le total passant en dessous en
 * petit : rien n'est perdu, l'ordre de lecture change.
 *
 * Au-dessus du repère, le centre annonce l'écart plutôt qu'un nombre négatif,
 * et la pastille garde son rôle : dire l'état sans le juger.
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

  // C'est le chiffre du centre qui s'anime : ce qu'il reste, ou l'écart
  // au-dessus du repère.
  const shownValue = target > 0 ? Math.abs(remaining) : Math.max(0, Math.round(consumed));
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
        {target > 0 ? (
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.eyebrow}>
            {over ? 'AU-DESSUS DE' : 'IL TE RESTE'}
          </Text>
        ) : null}
        <Text maxFontSizeMultiplier={1.35} style={styles.value}>
          {displayed.toLocaleString('fr-FR')}
        </Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.unit}>
          {target <= 0
            ? 'repère à définir'
            : `kcal · ${Math.round(consumed).toLocaleString('fr-FR')} sur ${target.toLocaleString('fr-FR')}`}
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
  content: { position: 'absolute', width: 154, alignItems: 'center', marginTop: -10 },
  eyebrow: { color: colors.violet, fontSize: 11, lineHeight: 15, fontFamily: fonts.bold, letterSpacing: 1.1 },
  value: { color: colors.ink, ...typeScale.numeric, fontSize: 36, lineHeight: 42 },
  unit: { color: colors.muted, fontSize: 12, lineHeight: 16, fontFamily: fonts.medium, marginTop: 1, textAlign: 'center' },
  statusPill: { position: 'absolute', bottom: 6, maxWidth: 150, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6 },
  status: { fontSize: 12, lineHeight: 16, fontFamily: fonts.bold },
});
