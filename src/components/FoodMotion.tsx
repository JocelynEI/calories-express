import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useExperience } from '../state/ExperienceContext';
import { FoodArt, FOOD_NAMES, FoodName } from './FoodArt';

/**
 * V2.0 — les aliments en mouvement.
 *
 * Trois mises en scène, toutes dessinées et animées sur l'appareil : rien n'est
 * téléchargé, et l'ensemble pèse quelques kilo-octets.
 *
 *  - `orbit`   : les aliments tournent lentement autour d'un centre. Pour un
 *                espace vide ou une attente, sans donner l'impression d'un
 *                chargement bloqué.
 *  - `rain`    : ils tombent et rebondissent légèrement. Pour une confirmation.
 *  - `parade`  : ils défilent en ligne, décalés. Pour une bande décorative.
 *
 * Toutes les animations de ce fichier utilisent le pilote natif, sans exception :
 * mélanger les deux pilotes dans une même vue casse l'animation suivante.
 */

export type FoodMotionKind = 'orbit' | 'rain' | 'parade';

type Props = {
  kind?: FoodMotionKind;
  /** Aliments à montrer. Par défaut, une sélection variée. */
  foods?: FoodName[];
  size?: number;
  /** Hauteur de la scène. La largeur suit le conteneur. */
  height?: number;
  width?: number;
};

const DEFAULT_FOODS: FoodName[] = ['pomme', 'brocoli', 'oeuf', 'pain', 'tomate', 'avocat'];

export function FoodMotion({ kind = 'orbit', foods, size = 34, height = 120, width = 300 }: Props) {
  const { reducedMotion, active } = useExperience();
  const items = useMemo(
    () => (foods && foods.length ? foods : DEFAULT_FOODS).filter(name => FOOD_NAMES.includes(name)),
    [foods],
  );
  const cycle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion || !active) { cycle.setValue(0); return; }
    const duration = kind === 'rain' ? 2600 : kind === 'parade' ? 7000 : 9000;
    const animation = Animated.loop(
      Animated.timing(cycle, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true, isInteraction: false }),
    );
    animation.start();
    return () => { animation.stop(); };
  }, [cycle, kind, reducedMotion, active]);

  return (
    <View
      style={[styles.stage, { height, width }]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      {items.map((name, index) => (
        <Item
          key={name}
          name={name}
          index={index}
          count={items.length}
          kind={kind}
          size={size}
          height={height}
          width={width}
          cycle={cycle}
          still={reducedMotion || !active}
        />
      ))}
    </View>
  );
}

function Item({ name, index, count, kind, size, height, width, cycle, still }: {
  name: FoodName; index: number; count: number; kind: FoodMotionKind;
  size: number; height: number; width: number; cycle: Animated.Value; still: boolean;
}) {
  const phase = index / count;
  // Chaque aliment lit le même cycle, décalé : une seule animation pilote toute
  // la scène, ce qui reste économe même avec une dizaine d'éléments.
  const shifted = cycle.interpolate({
    inputRange: [0, 1],
    outputRange: [phase, phase + 1],
  });

  if (kind === 'orbit') {
    const radiusX = (width - size) / 2 - 6;
    const radiusY = (height - size) / 2 - 6;
    const steps = Array.from({ length: 25 }, (_, i) => i / 24);
    const x = shifted.interpolate({
      inputRange: steps,
      outputRange: steps.map(t => Math.cos(t * Math.PI * 2) * radiusX),
      extrapolate: 'extend',
    });
    const y = shifted.interpolate({
      inputRange: steps,
      outputRange: steps.map(t => Math.sin(t * Math.PI * 2) * radiusY),
      extrapolate: 'extend',
    });
    const scale = shifted.interpolate({
      inputRange: steps,
      outputRange: steps.map(t => 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2))),
      extrapolate: 'extend',
    });
    return (
      <Animated.View style={[styles.item, { transform: still ? [] : [{ translateX: x }, { translateY: y }, { scale }] }]}>
        <FoodArt name={name} size={size} />
      </Animated.View>
    );
  }

  if (kind === 'rain') {
    const left = ((index + 0.5) / count) * width - width / 2;
    const fall = shifted.interpolate({
      inputRange: [0, 0.55, 0.7, 0.82, 0.92, 1],
      outputRange: [-height * 0.7, height * 0.32, height * 0.22, height * 0.32, height * 0.28, height * 0.32],
      extrapolate: 'clamp',
    });
    const fade = shifted.interpolate({ inputRange: [0, 0.08, 0.9, 1], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' });
    const tilt = shifted.interpolate({ inputRange: [0, 0.55, 1], outputRange: ['-16deg', '4deg', '0deg'], extrapolate: 'clamp' });
    return (
      <Animated.View style={[styles.item, { transform: still ? [{ translateX: left }] : [{ translateX: left }, { translateY: fall }, { rotate: tilt }], opacity: still ? 1 : fade }]}>
        <FoodArt name={name} size={size} />
      </Animated.View>
    );
  }

  const travel = shifted.interpolate({
    inputRange: [0, 1],
    outputRange: [width / 2 + size, -width / 2 - size],
    extrapolate: 'extend',
  });
  const bob = shifted.interpolate({
    inputRange: Array.from({ length: 9 }, (_, i) => i / 8),
    outputRange: Array.from({ length: 9 }, (_, i) => Math.sin((i / 8) * Math.PI * 4) * 7),
    extrapolate: 'extend',
  });
  return (
    <Animated.View style={[styles.item, { transform: still ? [{ translateX: (index - count / 2) * (size + 12) }] : [{ translateX: travel }, { translateY: bob }] }]}>
      <FoodArt name={name} size={size} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  item: { position: 'absolute' },
});
