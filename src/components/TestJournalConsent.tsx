import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, MAX_FONT_SCALE, radii, shadows, typeScale } from '../theme';
import { AppIcon } from './AppIcon';
import { GuideAvatar } from './GuideAvatar';
import { MotionPressable } from './Motion';

/**
 * V3.1 — la question posée avant d'enregistrer quoi que ce soit.
 *
 * Elle n'apparaît que sur le site, pendant la phase de test, et une seule
 * fois. Elle dit trois choses, dans cet ordre : ce qui est enregistré, ce qui
 * ne l'est **jamais**, et qu'on peut refuser sans rien perdre.
 *
 * Le bouton « Non merci » est un vrai bouton, de la même taille que l'autre :
 * un refus qu'il faut chercher n'est pas un refus, c'est un piège.
 */
export function TestJournalConsent({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <GuideAvatar size={72} />
        <View style={styles.headerText}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.eyebrow}>VERSION D’ESSAI</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>Tu veux bien m’aider ?</Text>
        </View>
      </View>

      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.copy}>
        Cette application est en test. Pour savoir ce qui fonctionne et ce qui coince, elle peut noter
        les boutons que tu utilises et les écrans que tu ouvres — rien d’autre.
      </Text>

      <View style={[styles.card, styles.yes]}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.cardTitle, { color: colors.greenInk }]}>Ce qui est noté</Text>
        {[
          'Les écrans que tu ouvres',
          'Les actions réussies : repas ajouté, séance enregistrée',
          'Les moments où tu abandonnes un formulaire',
          'Téléphone ou ordinateur, et la version de l’application',
        ].map(line => (
          <View key={line} style={styles.line}>
            <AppIcon name="check" size={15} color={colors.greenInk} strokeWidth={2.6} />
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.lineText}>{line}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, styles.no]}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.cardTitle, { color: colors.coral }]}>Ce qui ne sort jamais d’ici</Text>
        {[
          'Ce que tu manges, et le nom de tes aliments',
          'Ton poids, ta taille, ton âge, ton objectif',
          'Tes calories et tes totaux',
          'Ton nom, ton adresse mail, tes photos',
        ].map(line => (
          <View key={line} style={styles.line}>
            <AppIcon name="close" size={15} color={colors.coral} strokeWidth={2.6} />
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.lineText}>{line}</Text>
          </View>
        ))}
      </View>

      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.small}>
        Un numéro tiré au sort remplace ton nom. Il ne sort pas de ce navigateur et disparaît si tu
        effaces tes données de navigation. Tu peux changer d’avis quand tu veux dans Profil, et
        l’application marche exactement pareil si tu refuses.
      </Text>

      <MotionPressable onPress={onAccept} accessibilityRole="button" style={styles.primary}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.primaryText}>D’accord, ça m’aide à aider</Text>
      </MotionPressable>
      <MotionPressable onPress={onDecline} accessibilityRole="button" style={styles.secondary}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.secondaryText}>Non merci</Text>
      </MotionPressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, paddingBottom: 34, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.violet, fontSize: 12, lineHeight: 16, fontFamily: fonts.bold, letterSpacing: 1.2 },
  title: { color: colors.ink, ...typeScale.display, marginTop: 2 },
  copy: { color: colors.inkSoft, ...typeScale.body },
  card: { borderRadius: radii.large, borderWidth: 1, padding: 14, gap: 9, ...shadows.card },
  yes: { backgroundColor: colors.greenPale, borderColor: '#CDE9D1' },
  no: { backgroundColor: colors.coralPale, borderColor: '#F6D6D3' },
  cardTitle: { fontSize: 15, lineHeight: 20, fontFamily: fonts.bold },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  lineText: { flex: 1, color: colors.ink, ...typeScale.body },
  small: { color: colors.muted, ...typeScale.caption },
  primary: { minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: radii.large, backgroundColor: colors.violet, ...shadows.raised },
  primaryText: { color: colors.white, fontSize: 16, lineHeight: 22, fontFamily: fonts.bold },
  secondary: { minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  secondaryText: { color: colors.inkSoft, fontSize: 16, lineHeight: 22, fontFamily: fonts.bold },
});
