import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SCENE_DURATION, Story, StoryAccent } from '../domain/stories';
import { useExperience } from '../state/ExperienceContext';
import { colors, MAX_FONT_SCALE, radii, fonts } from '../theme';
import { AppIcon } from './AppIcon';
import { MotionPressable } from './Motion';
import { StorySceneArt } from './StoryScene';

export const ACCENTS: Record<StoryAccent, { ink: string; pale: string }> = {
  violet: { ink: colors.violet, pale: colors.violetPale },
  aqua: { ink: colors.aqua, pale: colors.aquaPale },
  gold: { ink: colors.goldText, pale: colors.goldPale },
  coral: { ink: colors.coral, pale: colors.coralPale },
};

type Props = {
  story: Story;
  onClose: () => void;
  onSeen: (id: string) => void;
  nextStory?: Story | null;
  onPlayNext?: (story: Story) => void;
};

/**
 * Le lecteur des « minutes de Jaws ».
 *
 * Il avance seul, scène par scène, et peut être mis en pause, rembobiné ou
 * fermé à tout moment. Quand les animations sont réduites — réglage de
 * l'application, préférence du système ou lecteur d'écran actif — l'avance
 * automatique est désactivée : la séquence attend « Suivant ». Rien n'est
 * téléchargé, et regarder une séquence n'ajoute jamais rien au journal.
 */
export function StoryPlayer({ story, onClose, onSeen, nextStory, onPlayNext }: Props) {
  const { reducedMotion } = useExperience();
  const accent = ACCENTS[story.accent];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);

  /**
   * Une valeur d'animation neuve à chaque scène.
   *
   * Une seule valeur partagée entre toutes les scènes suffisait à propager un
   * problème : il a suffi qu'une scène associe cette valeur à une animation
   * native pour que toutes les scènes suivantes échouent. Repartir d'une valeur
   * propre à chaque scène cloisonne le problème au lieu de le laisser courir.
   */
  const sceneKey = `${story.id}-${index}`;
  const progressRef = useRef<{ key: string; value: Animated.Value }>({ key: sceneKey, value: new Animated.Value(0) });
  if (progressRef.current.key !== sceneKey) {
    progressRef.current = { key: sceneKey, value: new Animated.Value(0) };
  }
  const progress = progressRef.current.value;
  const elapsed = useRef(0);
  const scene = story.scenes[Math.min(index, story.scenes.length - 1)];
  const duration = scene.durationMs ?? SCENE_DURATION;
  const autoplay = !reducedMotion && !paused && !done;

  const goTo = useCallback((next: number) => {
    if (next < 0) return;
    if (next >= story.scenes.length) { onSeen(story.id); setDone(true); return; }
    elapsed.current = 0;
    progress.setValue(0);
    setIndex(next);
  }, [onSeen, progress, story.id, story.scenes.length]);

  // Une scène par animation : sa progression pilote à la fois le dessin et la
  // barre du haut. Une pause conserve le temps déjà écoulé.
  useEffect(() => {
    if (done) return;
    if (!autoplay) { if (reducedMotion) progress.setValue(1); return; }
    const remaining = Math.max(120, duration * (1 - elapsed.current));
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: remaining,
      useNativeDriver: false,
      isInteraction: false,
    });
    const listener = progress.addListener(({ value }) => { elapsed.current = value; });
    animation.start(({ finished }) => { if (finished) goTo(index + 1); });
    return () => { animation.stop(); progress.removeListener(listener); };
  }, [autoplay, done, duration, goTo, index, progress, reducedMotion]);

  useEffect(() => {
    if (index === story.scenes.length - 1) onSeen(story.id);
  }, [index, onSeen, story.id, story.scenes.length]);

  const replay = () => { setDone(false); elapsed.current = 0; progress.setValue(0); setIndex(0); };
  const openSource = (url: string) => { void Linking.openURL(url).catch(() => undefined); };

  const bars = useMemo(() => story.scenes.map((_, position) => {
    if (position < index || done) return { key: position, width: '100%' as const, animated: null };
    if (position > index) return { key: position, width: '0%' as const, animated: null };
    return { key: position, width: null, animated: progress };
  }), [done, index, progress, story.scenes]);

  return (
    <Modal visible animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaProvider>
      <SafeAreaView style={[styles.safe, { backgroundColor: accent.pale }]}>
        <View style={styles.shell}>
          <View style={styles.bars} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {bars.map(bar => (
              <View key={bar.key} style={styles.barTrack}>
                {bar.animated
                  ? <Animated.View style={[styles.barFill, { backgroundColor: accent.ink, width: bar.animated.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                  : <View style={[styles.barFill, { backgroundColor: accent.ink, width: bar.width ?? '0%' }]} />}
              </View>
            ))}
          </View>

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.eyebrow, { color: accent.ink }]}>{story.theme.toUpperCase()}</Text>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title} numberOfLines={1}>{story.title}</Text>
            </View>
            {!reducedMotion && !done && (
              <MotionPressable
                onPress={() => setPaused(value => !value)}
                accessibilityRole="button"
                accessibilityLabel={paused ? 'Reprendre la séquence' : 'Mettre la séquence en pause'}
                style={styles.roundButton}
              >
                <AppIcon name={paused ? 'play' : 'pause'} size={18} color={colors.ink} strokeWidth={2.2} />
              </MotionPressable>
            )}
            <MotionPressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer la séquence" style={styles.roundButton}>
              <AppIcon name="close" size={19} color={colors.ink} strokeWidth={2.2} />
            </MotionPressable>
          </View>

          {done ? (
            <ScrollView contentContainerStyle={styles.endContent}>
              <View style={[styles.endBadge, { backgroundColor: accent.ink }]}>
                <AppIcon name="check" size={26} color={colors.white} strokeWidth={2.4} />
              </View>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.endTitle}>C’est tout pour « {story.title} »</Text>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.endCopy}>Rien n’a été ajouté à ton journal : une séquence s’écoute, elle ne compte pas comme une activité.</Text>
              {story.sources?.map(source => (
                <Pressable key={source.url} onPress={() => openSource(source.url)} style={styles.sourceRow} accessibilityRole="link">
                  <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.sourceText, { color: accent.ink }]}>{source.label} ↗</Text>
                </Pressable>
              ))}
              <View style={styles.endActions}>
                <MotionPressable onPress={replay} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: accent.ink }]}>
                  <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.secondaryText, { color: accent.ink }]}>Revoir</Text>
                </MotionPressable>
                {nextStory && onPlayNext ? (
                  <MotionPressable onPress={() => onPlayNext(nextStory)} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: accent.ink }]}>
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.primaryText} numberOfLines={1}>« {nextStory.title} »</Text>
                    <AppIcon name="chevron" size={17} color={colors.white} strokeWidth={2.2} />
                  </MotionPressable>
                ) : (
                  <MotionPressable onPress={onClose} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: accent.ink }]}>
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.primaryText}>Revenir à l’application</Text>
                  </MotionPressable>
                )}
              </View>
            </ScrollView>
          ) : (
            <>
              <View style={styles.stageWrap}>
                <StorySceneArt key={`${story.id}-${index}`} scene={scene} progress={progress} accent={accent.ink} reducedMotion={reducedMotion} />
                {!reducedMotion && (
                  <>
                    <Pressable
                      style={styles.tapLeft}
                      onPress={() => goTo(index - 1)}
                      accessibilityRole="button"
                      accessibilityLabel="Scène précédente"
                      importantForAccessibility="no"
                    />
                    <Pressable
                      style={styles.tapRight}
                      onPress={() => goTo(index + 1)}
                      accessibilityRole="button"
                      accessibilityLabel="Scène suivante"
                      importantForAccessibility="no"
                    />
                  </>
                )}
              </View>

              <View style={styles.copyCard} accessibilityLiveRegion="polite">
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.sceneStep, { color: accent.ink }]}>
                  {index + 1} / {story.scenes.length}
                </Text>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.headline}>{scene.headline}</Text>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.caption}>{scene.caption}</Text>
              </View>

              <View style={styles.controls}>
                <MotionPressable
                  onPress={() => goTo(index - 1)}
                  disabled={index === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Scène précédente"
                  accessibilityState={{ disabled: index === 0 }}
                  style={[styles.secondaryButton, { borderColor: accent.ink }, index === 0 && styles.disabled]}
                >
                  <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.secondaryText, { color: accent.ink }]}>Précédent</Text>
                </MotionPressable>
                <MotionPressable
                  onPress={() => goTo(index + 1)}
                  accessibilityRole="button"
                  accessibilityLabel={index === story.scenes.length - 1 ? 'Terminer la séquence' : 'Scène suivante'}
                  style={[styles.primaryButton, { backgroundColor: accent.ink }]}
                >
                  <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.primaryText}>{index === story.scenes.length - 1 ? 'Terminer' : 'Suivant'}</Text>
                  <AppIcon name="chevron" size={17} color={colors.white} strokeWidth={2.2} />
                </MotionPressable>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  shell: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 18 },
  bars: { flexDirection: 'row', gap: 5, paddingTop: 12 },
  barTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#FFFFFFAA', overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  eyebrow: { fontSize: 12, fontFamily: fonts.extrabold, letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 20, fontFamily: fonts.extrabold, letterSpacing: -0.3, marginTop: 3 },
  roundButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },

  stageWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 250 },
  tapLeft: { position: 'absolute', top: 0, bottom: 0, left: -18, width: '34%' },
  tapRight: { position: 'absolute', top: 0, bottom: 0, right: -18, width: '46%' },

  copyCard: { backgroundColor: colors.card, borderRadius: radii.large, padding: 18, gap: 7 },
  sceneStep: { fontSize: 12, fontFamily: fonts.extrabold, letterSpacing: 1.2 },
  headline: { color: colors.ink, fontSize: 24, fontFamily: fonts.extrabold, letterSpacing: -0.5, lineHeight: 30 },
  caption: { color: colors.inkSoft, fontSize: 16, lineHeight: 23, fontFamily: fonts.medium },

  controls: { flexDirection: 'row', gap: 10, paddingVertical: 14 },
  secondaryButton: { minHeight: 52, flexGrow: 1, flexBasis: 0, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFFCC' },
  secondaryText: { fontSize: 15, fontFamily: fonts.extrabold },
  primaryButton: { minHeight: 52, flexGrow: 1.4, flexBasis: 0, borderRadius: 16, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  primaryText: { color: colors.white, fontSize: 15, fontFamily: fonts.extrabold, flexShrink: 1 },
  disabled: { opacity: 0.4 },

  endContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 30 },
  endBadge: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  endTitle: { color: colors.ink, fontSize: 24, fontFamily: fonts.extrabold, letterSpacing: -0.5, textAlign: 'center' },
  endCopy: { color: colors.inkSoft, fontSize: 16, fontFamily: fonts.medium, lineHeight: 23, textAlign: 'center', maxWidth: 330 },
  sourceRow: { minHeight: 44, justifyContent: 'center' },
  sourceText: { fontSize: 14, fontFamily: fonts.bold, textDecorationLine: 'underline' },
  endActions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 6 },
});
