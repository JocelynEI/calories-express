import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { SceneArt, Story, storyLengthLabel } from '../domain/stories';
import { colors, MAX_FONT_SCALE, radii } from '../theme';
import { AppIcon } from './AppIcon';
import { MotionPressable } from './Motion';
import { ACCENTS } from './StoryPlayer';

/** Vignette fixe de la séquence : le motif de sa première scène, en petit. */
function Thumb({ art, color }: { art: SceneArt; color: string }) {
  const common = { fill: 'none', stroke: color, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={44} height={44} viewBox="0 0 44 44">
      {art === 'clock' && <><Circle cx="22" cy="22" r="15" {...common} /><Path d="M22 13v9l6 4" {...common} /></>}
      {art === 'label' && <><Rect x="8" y="7" width="28" height="30" rx="4" {...common} /><Line x1="14" y1="16" x2="30" y2="16" {...common} /><Line x1="14" y1="23" x2="30" y2="23" {...common} /><Line x1="14" y1="30" x2="24" y2="30" {...common} /></>}
      {art === 'steps' && <><Circle cx="18" cy="12" r="4" {...common} /><Path d="M18 17v10M18 20l-5 4M18 20l5 3M14 33l4-6 4 6" {...common} /></>}
      {art === 'scale' && <><Path d="M7 30l7-7 6 5 8-12 9 6" {...common} /><Circle cx="14" cy="23" r="2" fill={color} /><Circle cx="28" cy="16" r="2" fill={color} /></>}
      {art === 'plate' && <><Circle cx="22" cy="22" r="15" {...common} /><Path d="M22 7v30M22 22h15" {...common} /></>}
      {art === 'moon' && <Path d="M27 9a14 14 0 1 0 0 26 11 11 0 0 1 0-26Z" {...common} />}
      {art === 'ring' && <><Circle cx="22" cy="22" r="14" stroke={colors.track} strokeWidth="5" fill="none" /><Path d="M22 8a14 14 0 0 1 11 22.5" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" /></>}
      {art === 'balance' && <><Rect x="7" y="13" width="30" height="7" rx="3.5" fill={color} opacity={0.35} /><Rect x="7" y="25" width="21" height="7" rx="3.5" fill={color} /></>}
      {art === 'breath' && <><Circle cx="22" cy="22" r="14" {...common} opacity={0.4} /><Circle cx="22" cy="22" r="7" {...common} /></>}
      {art === 'jaws' && <><Circle cx="22" cy="17" r="7" {...common} /><Path d="M9 37c1.5-7 6.5-10 13-10s11.5 3 13 10" {...common} /></>}
    </Svg>
  );
}

function StoryCard({ story, seen, onPlay, wide = false }: { story: Story; seen: boolean; onPlay: () => void; wide?: boolean }) {
  const accent = ACCENTS[story.accent];
  return (
    <MotionPressable
      onPress={onPlay}
      accessibilityRole="button"
      accessibilityLabel={`Regarder la séquence ${story.title}, ${storyLengthLabel(story)}${seen ? ', déjà vue' : ''}`}
      containerStyle={wide ? undefined : styles.cardOuter}
      style={[styles.card, wide && styles.cardWide, { backgroundColor: accent.pale }]}
    >
      <View style={styles.cardTop}>
        <Thumb art={story.scenes[0].art} color={accent.ink} />
        <View style={[styles.duration, { backgroundColor: colors.white }]}>
          <AppIcon name="play" size={11} color={accent.ink} />
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.durationText, { color: accent.ink }]}>{storyLengthLabel(story)}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.theme, { color: accent.ink }]}>{story.theme.toUpperCase()}</Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.cardTitle} numberOfLines={wide ? 2 : 2}>{story.title}</Text>
        {wide && <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.cardSummary}>{story.summary}</Text>}
      </View>
      {seen && (
        <View style={styles.seen}>
          <AppIcon name="check" size={12} color={colors.muted} strokeWidth={2.4} />
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.seenText}>Déjà vue</Text>
        </View>
      )}
    </MotionPressable>
  );
}

type RailProps = { stories: Story[]; seen: string[]; onPlay: (story: Story) => void };

/** Le bandeau horizontal de l'accueil. */
export function StoryRail({ stories, seen, onPlay }: RailProps) {
  if (!stories.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
      accessibilityLabel="Les minutes de Jaws"
    >
      {stories.map(story => (
        <StoryCard key={story.id} story={story} seen={seen.includes(story.id)} onPlay={() => onPlay(story)} />
      ))}
    </ScrollView>
  );
}

/** La liste complète, dans Progression. */
export function StoryList({ stories, seen, onPlay }: RailProps) {
  return (
    <View style={styles.list}>
      {stories.map(story => (
        <StoryCard key={story.id} story={story} seen={seen.includes(story.id)} onPlay={() => onPlay(story)} wide />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { gap: 10, paddingRight: 20 },
  list: { gap: 10 },
  cardOuter: { width: 176 },
  card: { width: 176, minHeight: 168, borderRadius: radii.large, padding: 14, justifyContent: 'space-between', gap: 10 },
  cardWide: { width: '100%', minHeight: 0 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  duration: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4 },
  durationText: { fontSize: 12, fontWeight: '800' },
  cardBody: { gap: 4 },
  theme: { fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  cardTitle: { color: colors.ink, fontSize: 16, lineHeight: 21, fontWeight: '800', letterSpacing: -0.2 },
  cardSummary: { color: colors.inkSoft, fontSize: 14, lineHeight: 20, marginTop: 2 },
  seen: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seenText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
});
