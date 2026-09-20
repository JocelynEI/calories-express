import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import { StoryScene as Scene } from '../domain/stories';
import { colors, MAX_FONT_SCALE } from '../theme';
import { GuideAvatar } from './GuideAvatar';

/**
 * Les dessins animés des « minutes de Jaws ».
 *
 * Chaque scène reçoit `progress`, une valeur animée qui va de 0 à 1 pendant sa
 * durée. Les mouvements s'appuient sur des vues animées plutôt que sur des
 * propriétés SVG animées : c'est ce qui se comporte le plus uniformément entre
 * iOS, Android et le web. Quand les animations sont réduites, la scène affiche
 * directement son état final, sans boucle ni compte à rebours.
 */

const W = 300;
const H = 250;
const AnimatedPath = Animated.createAnimatedComponent(Path);

export type SceneProps = {
  scene: Scene;
  progress: Animated.Value;
  accent: string;
  reducedMotion: boolean;
};

export function StorySceneArt(props: SceneProps) {
  const { scene } = props;
  return (
    <View style={styles.stage} accessible={false} importantForAccessibility="no-hide-descendants">
      {scene.art === 'clock' && <ClockScene {...props} />}
      {scene.art === 'balance' && <BalanceScene {...props} />}
      {scene.art === 'ring' && <RingScene {...props} />}
      {scene.art === 'label' && <LabelScene {...props} />}
      {scene.art === 'steps' && <StepsScene {...props} />}
      {scene.art === 'scale' && <ScaleScene {...props} />}
      {scene.art === 'plate' && <PlateScene {...props} />}
      {scene.art === 'moon' && <MoonScene {...props} />}
      {scene.art === 'breath' && <BreathScene {...props} />}
      {scene.art === 'jaws' && <JawsScene {...props} />}
    </View>
  );
}

/* ---------------------------------------------------------------- outils */

/** Fenêtre [from, to] de la progression, ramenée à 0→1. */
const window_ = (progress: Animated.Value, from: number, to: number) =>
  progress.interpolate({ inputRange: [0, from, to, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });

const fadeUp = (progress: Animated.Value, from: number, to: number, distance = 14) => {
  const value = window_(progress, from, to);
  return {
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
  };
};

const pop = (progress: Animated.Value, from: number, to: number) => {
  const value = window_(progress, from, to);
  return {
    opacity: value,
    transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
  };
};

/**
 * Compteur qui monte avec la scène.
 *
 * La valeur est arrondie à un pas calculé pour produire au plus une soixantaine
 * de rendus sur toute la scène : sans cela, un compteur qui va jusqu'à 6 000
 * déclencherait des milliers de rendus et ferait saccader l'animation. La
 * dernière valeur, elle, est exacte.
 */
function useCounter(progress: Animated.Value, target: number, reducedMotion: boolean, from = 0, to = 0.65) {
  const [value, setValue] = useState(reducedMotion ? target : 0);
  useEffect(() => {
    if (reducedMotion) { setValue(target); return; }
    const step = Math.max(1, Math.round(Math.abs(target) / 60));
    const id = progress.addListener(({ value: current }) => {
      const ratio = Math.max(0, Math.min(1, (current - from) / Math.max(0.001, to - from)));
      setValue(ratio >= 1 ? target : Math.round((target * ratio) / step) * step);
    });
    return () => progress.removeListener(id);
  }, [progress, target, reducedMotion, from, to]);
  return value;
}

function Caption({ children, color = colors.muted }: { children: React.ReactNode; color?: string }) {
  return <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.sceneLabel, { color }]}>{children}</Text>;
}

/* ----------------------------------------------------------------- scènes */

/** Le cadran d'une journée, avec les repas qui s'y posent. */
function ClockScene({ progress, accent, scene }: SceneProps) {
  const evening = scene.variant === 'evening';
  const marks = Array.from({ length: 12 }, (_, i) => i * 30);
  const meals = evening
    ? [{ angle: 120, label: '8 h' }, { angle: 200, label: '13 h' }, { angle: 300, label: '20 h' }]
    : [{ angle: 120, label: '8 h' }, { angle: 200, label: '13 h' }, { angle: 300, label: '20 h' }];
  const cx = W / 2;
  const cy = 118;
  const r = 84;
  return (
    <View style={styles.center}>
      <Svg width={W} height={H}>
        <Circle cx={cx} cy={cy} r={r} fill={evening ? '#EDEBFA' : colors.violetPale} />
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke={accent} strokeWidth={2} opacity={0.35} />
        <G>
          {marks.map(angle => {
            const rad = (angle - 90) * (Math.PI / 180);
            return (
              <Line
                key={angle}
                x1={cx + Math.cos(rad) * (r - 12)} y1={cy + Math.sin(rad) * (r - 12)}
                x2={cx + Math.cos(rad) * (r - 5)} y2={cy + Math.sin(rad) * (r - 5)}
                stroke={accent} strokeWidth={2} strokeLinecap="round" opacity={0.45}
              />
            );
          })}
        </G>
        <Circle cx={cx} cy={cy} r={5} fill={accent} />
      </Svg>
      {meals.map((meal, index) => {
        const rad = (meal.angle - 90) * (Math.PI / 180);
        const x = cx + Math.cos(rad) * r;
        const y = cy + Math.sin(rad) * r;
        return (
          <Animated.View
            key={meal.label}
            style={[styles.clockDot, { left: x - 21, top: y - 15, borderColor: accent }, pop(progress, 0.15 + index * 0.16, 0.35 + index * 0.16)]}
          >
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.clockDotText, { color: accent }]}>{meal.label}</Text>
          </Animated.View>
        );
      })}
      <Animated.View style={[styles.clockCaption, fadeUp(progress, 0.55, 0.8)]}>
        <Caption color={accent}>{evening ? 'La journée est entière' : 'Une journée complète'}</Caption>
      </Animated.View>
    </View>
  );
}

/**
 * Le diagramme à barres des scènes d'explication. Construit avec des vues
 * plutôt qu'en SVG : les libellés restent du vrai texte, donc lisibles par un
 * lecteur d'écran et grossissables.
 */
function BalanceScene({ progress, accent, scene }: SceneProps) {
  const variant = scene.variant ?? 'deficit';
  const rows: { label: string; value: string; ratio: number; tone: string; faded?: boolean }[] =
    variant === 'scale'
      ? [
        { label: '100 g du produit', value: '150 kcal', ratio: 0.4, tone: colors.muted },
        { label: '250 g mangés', value: '375 kcal', ratio: 1, tone: accent },
      ]
      : variant === 'dedupe'
        ? [
          { label: 'Pas de la journée', value: '150 kcal', ratio: 1, tone: accent },
          { label: 'Marche déjà dedans', value: '112 kcal', ratio: 0.75, tone: colors.muted, faded: true },
          { label: 'Retenu au bilan', value: '150 kcal', ratio: 1, tone: accent },
        ]
        : variant === 'time'
          ? [
            { label: '1 semaine', value: 'illisible', ratio: 0.33, tone: colors.muted, faded: true },
            { label: '2 semaines', value: 'à confirmer', ratio: 0.66, tone: colors.muted },
            { label: '3 semaines', value: 'lisible', ratio: 1, tone: accent },
          ]
          : [
            { label: 'Maintien estimé', value: '2 220', ratio: 1, tone: colors.muted },
            { label: 'Objectif alimentaire', value: '1 920', ratio: 0.865, tone: accent },
          ];
  return (
    <View style={styles.barsWrap}>
      {rows.map((row, index) => {
        const value = window_(progress, 0.12 + index * 0.2, 0.42 + index * 0.2);
        return (
          <Animated.View key={row.label} style={[styles.barRow, { opacity: row.faded ? 0.55 : 1 }, fadeUp(progress, 0.06 + index * 0.2, 0.3 + index * 0.2, 8)]}>
            <View style={styles.barHeading}>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.barLabel}>{row.label}</Text>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.barValue, { color: row.tone }]}>{row.value}</Text>
            </View>
            <View style={styles.barTrack}>
              <Animated.View style={[styles.barFill, {
                backgroundColor: row.tone,
                width: value.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.round(row.ratio * 100)}%`] }),
              }]} />
            </View>
          </Animated.View>
        );
      })}
      {variant === 'deficit' && (
        <Animated.View style={[styles.gapPill, { borderColor: accent }, fadeUp(progress, 0.6, 0.85, 6)]}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.gapText, { color: accent }]}>écart prévu : 300 kcal</Text>
        </Animated.View>
      )}
    </View>
  );
}

/** L'anneau du baromètre qui se remplit, avec son nombre. */
function RingScene({ progress, accent, scene, reducedMotion }: SceneProps) {
  const ratio = scene.value ?? 0.6;
  const size = 196;
  const r = 78;
  const c = size / 2;
  const start = { x: c + r * Math.cos((135 * Math.PI) / 180), y: c + r * Math.sin((135 * Math.PI) / 180) };
  const end = { x: c + r * Math.cos((45 * Math.PI) / 180), y: c + r * Math.sin((45 * Math.PI) / 180) };
  const arc = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;
  const length = 2 * Math.PI * r * 0.75;
  const offset = useRef(new Animated.Value(reducedMotion ? length * (1 - ratio) : length)).current;
  useEffect(() => {
    if (reducedMotion) { offset.setValue(length * (1 - ratio)); return; }
    const id = progress.addListener(({ value }) => {
      const eased = Math.max(0, Math.min(1, (value - 0.05) / 0.55));
      offset.setValue(length * (1 - ratio * eased));
    });
    return () => progress.removeListener(id);
  }, [progress, offset, length, ratio, reducedMotion]);
  const shown = useCounter(progress, Math.round(2100 * ratio), reducedMotion, 0.05, 0.6);
  return (
    <View style={styles.center}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Path d={arc} fill="none" stroke={colors.track} strokeWidth={15} strokeLinecap="round" />
          <AnimatedPath
            d={arc} fill="none" stroke={accent} strokeWidth={15} strokeLinecap="round"
            strokeDasharray={`${length} ${length}`} strokeDashoffset={offset as unknown as number}
          />
        </Svg>
        <View style={styles.ringCore} pointerEvents="none">
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.ringValue}>{shown.toLocaleString('fr-FR')}</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.ringUnit}>sur 2 100 kcal</Text>
        </View>
      </View>
      <Animated.View style={fadeUp(progress, 0.62, 0.85)}>
        <Caption color={accent}>l’écart est déjà dans ce nombre</Caption>
      </Animated.View>
    </View>
  );
}

/** Le tableau nutritionnel, avec la colonne qui s'allume. */
function LabelScene({ progress, accent, scene }: SceneProps) {
  const portion = scene.variant === 'portion';
  const rows = [
    { label: 'Énergie', hundred: '500 kcal', serving: '100 kcal' },
    { label: 'Glucides', hundred: '62 g', serving: '12,4 g' },
    { label: 'Lipides', hundred: '24 g', serving: '4,8 g' },
  ];
  const highlight = window_(progress, 0.15, 0.45);
  return (
    <View style={styles.labelCard}>
      <View style={styles.labelHead}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.labelCell, styles.labelFirst, styles.labelHeadText]}>Valeurs</Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.labelCell, styles.labelHeadText]}>100 g</Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.labelCell, styles.labelHeadText]}>1 biscuit</Text>
      </View>
      {rows.map((row, index) => (
        <Animated.View key={row.label} style={[styles.labelRow, fadeUp(progress, 0.05 + index * 0.1, 0.25 + index * 0.1, 6)]}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.labelCell, styles.labelFirst]}>{row.label}</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.labelCell}>{row.hundred}</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.labelCell}>{row.serving}</Text>
        </Animated.View>
      ))}
      <Animated.View
        pointerEvents="none"
        style={[styles.labelFrame, { borderColor: accent, left: portion ? '64%' : '35%' }, { opacity: highlight, transform: [{ scaleY: highlight }] }]}
      />
      <Animated.View style={[styles.labelFoot, fadeUp(progress, 0.55, 0.8, 6)]}>
        <Caption color={accent}>{portion ? '3 biscuits = 300 kcal' : '250 g mangés = 1 250 kcal'}</Caption>
      </Animated.View>
    </View>
  );
}

/** Le marcheur et son compteur. */
function StepsScene({ progress, accent, scene, reducedMotion }: SceneProps) {
  const target = scene.value ?? 6000;
  const baseline = scene.variant === 'baseline';
  const steps = useCounter(progress, target, reducedMotion, 0.05, 0.55);
  const stride = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducedMotion) { stride.setValue(0.5); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(stride, { toValue: 1, duration: 420, useNativeDriver: false, isInteraction: false }),
      Animated.timing(stride, { toValue: 0, duration: 420, useNativeDriver: false, isInteraction: false }),
    ]));
    animation.start();
    return () => { animation.stop(); };
  }, [stride, reducedMotion]);
  const walk = window_(progress, 0, 0.8);
  return (
    <View style={styles.center}>
      <Animated.View style={[styles.walkLane, { transform: [{ translateX: walk.interpolate({ inputRange: [0, 1], outputRange: [-70, 70] }) }] }]}>
        <Animated.View style={{ transform: [{ translateY: stride.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }] }}>
          <Svg width={64} height={78}>
            <Circle cx={32} cy={13} r={10} fill={accent} />
            <Line x1={32} y1={24} x2={32} y2={48} stroke={accent} strokeWidth={6} strokeLinecap="round" />
            <Line x1={32} y1={30} x2={16} y2={42} stroke={accent} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
            <Line x1={32} y1={30} x2={48} y2={40} stroke={accent} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.legs, { opacity: stride.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
          <Svg width={64} height={30}>
            <Line x1={32} y1={0} x2={19} y2={26} stroke={accent} strokeWidth={6} strokeLinecap="round" />
            <Line x1={32} y1={0} x2={45} y2={26} stroke={accent} strokeWidth={6} strokeLinecap="round" />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.legs, { opacity: stride }]}>
          <Svg width={64} height={30}>
            <Line x1={32} y1={0} x2={28} y2={27} stroke={accent} strokeWidth={6} strokeLinecap="round" />
            <Line x1={32} y1={0} x2={38} y2={27} stroke={accent} strokeWidth={6} strokeLinecap="round" />
          </Svg>
        </Animated.View>
      </Animated.View>
      <View style={styles.ground} />
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.stepsValue}>{steps.toLocaleString('fr-FR')} <Text style={styles.stepsUnit}>pas</Text></Text>
      {baseline ? (
        <Animated.View style={[styles.splitTrack, fadeUp(progress, 0.45, 0.7, 8)]}>
          <View style={[styles.splitPart, { flex: 2, backgroundColor: colors.track }]} />
          <View style={[styles.splitPart, { flex: 4, backgroundColor: accent }]} />
          <View style={styles.splitLegend}>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.splitLeft}>2 000 déjà comptés</Text>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.splitRight, { color: accent }]}>4 000 ≈ 100 kcal</Text>
          </View>
        </Animated.View>
      ) : (
        <Animated.View style={fadeUp(progress, 0.55, 0.8)}>
          <Caption color={accent}>≈ 150 kcal actives estimées</Caption>
        </Animated.View>
      )}
    </View>
  );
}

/** La courbe de poids : d'abord les points, puis la moyenne. */
function ScaleScene({ progress, accent, scene, reducedMotion }: SceneProps) {
  const average = scene.variant === 'average';
  const raw = [80.4, 79.9, 80.6, 80.1, 79.6, 80.2, 79.7, 79.5, 79.9, 79.2, 79.4, 78.9];
  const chartW = 260;
  const chartH = 128;
  const min = 78.4;
  const max = 81;
  const x = (i: number) => (i / (raw.length - 1)) * chartW;
  const y = (v: number) => chartH - ((v - min) / (max - min)) * chartH;
  const smooth = raw.map((_, i) => {
    const slice = raw.slice(Math.max(0, i - 3), i + 1);
    return slice.reduce((sum, v) => sum + v, 0) / slice.length;
  });
  const line = smooth.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  const length = chartW * 1.4;
  const offset = useRef(new Animated.Value(reducedMotion ? 0 : length)).current;
  useEffect(() => {
    if (!average || reducedMotion) { offset.setValue(0); return; }
    const id = progress.addListener(({ value }) => {
      offset.setValue(length * (1 - Math.max(0, Math.min(1, (value - 0.2) / 0.5))));
    });
    return () => progress.removeListener(id);
  }, [progress, offset, length, average, reducedMotion]);
  return (
    <View style={styles.center}>
      <View style={{ width: chartW, height: chartH + 26 }}>
        <Svg width={chartW} height={chartH + 26}>
          <Line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke={colors.line} strokeWidth={1} />
          {average && (
            <AnimatedPath
              d={line} fill="none" stroke={accent} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={`${length} ${length}`} strokeDashoffset={offset as unknown as number}
            />
          )}
        </Svg>
        {raw.map((value, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              { left: x(index) - 4, top: y(value) - 4, backgroundColor: average ? colors.muted : accent, opacity: average ? 0.45 : 1 },
              pop(progress, 0.04 + index * 0.035, 0.18 + index * 0.035),
            ]}
          />
        ))}
      </View>
      <Animated.View style={fadeUp(progress, 0.7, 0.9)}>
        <Caption color={accent}>{average ? 'la moyenne sur 7 jours descend' : 'les points sautent d’un matin à l’autre'}</Caption>
      </Animated.View>
    </View>
  );
}

/** L'assiette et ses parts. */
function PlateScene({ progress, accent, scene }: SceneProps) {
  const protein = scene.variant === 'protein';
  const cx = W / 2;
  const cy = 112;
  const r = 82;
  const parts = [
    { label: 'Légumes', from: 90, to: 270, color: colors.aqua },
    { label: 'Féculents', from: 270, to: 360, color: colors.gold },
    { label: 'Protéines', from: 0, to: 90, color: colors.violet },
  ];
  const sector = (from: number, to: number) => {
    const a = (from * Math.PI) / 180;
    const b = (to * Math.PI) / 180;
    const large = to - from > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(b)} ${cy + r * Math.sin(b)} Z`;
  };
  return (
    <View style={styles.center}>
      <View style={{ width: W, height: 210 }}>
        <Svg width={W} height={210}>
          <Circle cx={cx} cy={cy} r={r + 10} fill={colors.card} stroke={colors.line} strokeWidth={2} />
          {parts.map(part => (
            <Path
              key={part.label}
              d={sector(part.from, part.to)}
              fill={part.color}
              opacity={protein ? (part.label === 'Protéines' ? 0.95 : 0.2) : 0.85}
            />
          ))}
          <Circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.white} strokeWidth={3} />
        </Svg>
        {parts.map((part, index) => {
          const mid = ((part.from + part.to) / 2) * (Math.PI / 180);
          return (
            <Animated.View
              key={part.label}
              style={[
                styles.plateTag,
                { left: cx + Math.cos(mid) * (r + 26) - 42, top: cy + Math.sin(mid) * (r + 26) - 13 },
                pop(progress, 0.12 + index * 0.16, 0.34 + index * 0.16),
              ]}
            >
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.plateTagText}>{part.label}</Text>
            </Animated.View>
          );
        })}
      </View>
      <Animated.View style={fadeUp(progress, 0.6, 0.85)}>
        <Caption color={accent}>{protein ? '1,5 g de protéines par kilo de poids' : 'des parts, pas des grammes'}</Caption>
      </Animated.View>
    </View>
  );
}

/** Le soir : un croissant de lune et une courbe qui s'apaise. */
function MoonScene({ progress, accent, reducedMotion }: SceneProps) {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducedMotion) { float.setValue(0.5); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 2400, useNativeDriver: false, isInteraction: false }),
      Animated.timing(float, { toValue: 0, duration: 2400, useNativeDriver: false, isInteraction: false }),
    ]));
    animation.start();
    return () => { animation.stop(); };
  }, [float, reducedMotion]);
  const stars = [{ x: 58, y: 48 }, { x: 236, y: 38 }, { x: 208, y: 96 }, { x: 76, y: 116 }];
  return (
    <View style={styles.center}>
      <View style={{ width: W, height: 200 }}>
        <Animated.View style={{ transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }] }}>
          <Svg width={W} height={200}>
            <Circle cx={W / 2} cy={96} r={56} fill={accent} opacity={0.16} />
            <Path
              d={`M ${W / 2 + 18} 56 a 44 44 0 1 0 0 80 a 34 34 0 1 1 0 -80 Z`}
              fill={accent}
            />
          </Svg>
        </Animated.View>
        {stars.map((star, index) => (
          <Animated.View key={index} style={[styles.star, { left: star.x, top: star.y, backgroundColor: accent }, pop(progress, 0.2 + index * 0.12, 0.4 + index * 0.12)]} />
        ))}
      </View>
      <Animated.View style={fadeUp(progress, 0.55, 0.8)}>
        <Caption color={accent}>demain n’a rien à rattraper</Caption>
      </Animated.View>
    </View>
  );
}

/** La pause : un cercle qui respire doucement. */
function BreathScene({ progress, accent, reducedMotion }: SceneProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducedMotion) { pulse.setValue(0.5); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2600, useNativeDriver: false, isInteraction: false }),
      Animated.timing(pulse, { toValue: 0, duration: 2600, useNativeDriver: false, isInteraction: false }),
    ]));
    animation.start();
    return () => { animation.stop(); };
  }, [pulse, reducedMotion]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1.06] });
  return (
    <View style={styles.center}>
      <View style={styles.breathWrap}>
        <Animated.View style={[styles.breathHalo, { backgroundColor: accent, transform: [{ scale }] }]} />
        <Animated.View style={[styles.breathCore, { borderColor: accent, transform: [{ scale }] }]} />
        <View style={styles.breathLabel}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.breathText, { color: accent }]}>5 min</Text>
        </View>
      </View>
      <Animated.View style={fadeUp(progress, 0.45, 0.75)}>
        <Caption color={accent}>si tu en as envie, et seulement si</Caption>
      </Animated.View>
    </View>
  );
}

/**
 * Le plan de fin : Jaws, en plus grand qu'ailleurs dans l'application.
 * Depuis la V2.0 c'est l'avatar articulé qui est utilisé ; son balancement lui
 * appartient, et cette scène ne s'occupe plus que de son apparition.
 */
function JawsScene({ progress, accent }: SceneProps) {
  const enter = window_(progress, 0, 0.3);
  return (
    <View style={styles.center}>
      <Animated.View style={[styles.jawsHalo, { backgroundColor: accent, opacity: enter.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] }) }]} />
      {/*
        Deux vues imbriquées, et non une seule : l'apparition dépend de
        `progress`, le balancement de `sway`. Réunir deux valeurs animées
        distinctes dans un même style les fait partager le même nœud de
        propriétés — c'est ce qui avait contaminé `progress` en V1.8 et faisait
        planter la scène suivante. Une valeur, une vue.
      */}
      <Animated.View style={{
        opacity: enter,
        transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
      }}>
        <GuideAvatar size={196} animationKey="fin" pose="present" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { width: W, height: H, alignItems: 'center', justifyContent: 'center' },
  center: { width: W, height: H, alignItems: 'center', justifyContent: 'center' },
  sceneLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 8 },

  clockDot: { position: 'absolute', minWidth: 42, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.white, borderWidth: 2, alignItems: 'center' },
  clockDotText: { fontSize: 12, fontWeight: '800' },
  clockCaption: { position: 'absolute', bottom: 4 },

  barsWrap: { width: W - 12, gap: 16, paddingHorizontal: 6 },
  barRow: { gap: 7 },
  barHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  barLabel: { color: colors.inkSoft, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  barValue: { fontSize: 15, fontWeight: '800' },
  barTrack: { height: 14, borderRadius: 7, backgroundColor: colors.track, overflow: 'hidden' },
  barFill: { height: 14, borderRadius: 7 },
  gapPill: { alignSelf: 'center', borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 2 },
  gapText: { fontSize: 12, fontWeight: '800' },

  ringCore: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ringValue: { color: colors.ink, fontSize: 40, fontWeight: '800', letterSpacing: -1.4 },
  ringUnit: { color: colors.muted, fontSize: 13, fontWeight: '600', marginTop: 2 },

  labelCard: { width: W - 16, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, paddingVertical: 10, paddingHorizontal: 6 },
  labelHead: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  labelHeadText: { color: colors.muted, fontWeight: '800' },
  labelRow: { flexDirection: 'row', paddingVertical: 9 },
  labelCell: { flex: 1, textAlign: 'center', color: colors.ink, fontSize: 13, fontWeight: '700' },
  labelFirst: { flex: 1.2, textAlign: 'left', paddingLeft: 8, color: colors.inkSoft, fontWeight: '600' },
  labelFrame: { position: 'absolute', top: 4, bottom: 34, width: '31%', borderWidth: 2.5, borderRadius: 12 },
  labelFoot: { alignItems: 'center', paddingTop: 4 },

  walkLane: { alignItems: 'center' },
  legs: { position: 'absolute', top: 48, left: 0 },
  ground: { width: 210, height: 3, borderRadius: 2, backgroundColor: colors.line, marginTop: 6 },
  stepsValue: { color: colors.ink, fontSize: 32, fontWeight: '800', letterSpacing: -1, marginTop: 12 },
  stepsUnit: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  splitTrack: { width: W - 40, marginTop: 12, flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  splitPart: { height: 12, borderRadius: 6 },
  splitLegend: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  splitLeft: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  splitRight: { fontSize: 12, fontWeight: '800' },

  dot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },

  plateTag: { position: 'absolute', width: 84, alignItems: 'center', backgroundColor: colors.white, borderRadius: 999, paddingVertical: 4, borderWidth: 1, borderColor: colors.line },
  plateTagText: { color: colors.inkSoft, fontSize: 12, fontWeight: '700' },

  star: { position: 'absolute', width: 7, height: 7, borderRadius: 4 },

  breathWrap: { width: 190, height: 190, alignItems: 'center', justifyContent: 'center' },
  breathHalo: { position: 'absolute', width: 170, height: 170, borderRadius: 85, opacity: 0.12 },
  breathCore: { position: 'absolute', width: 132, height: 132, borderRadius: 66, borderWidth: 3 },
  breathLabel: { alignItems: 'center' },
  breathText: { fontSize: 26, fontWeight: '800' },

  jawsHalo: { position: 'absolute', width: 186, height: 186, borderRadius: 93 },
  jaws: { width: 196, height: 196 },
});
