import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, MAX_FONT_SCALE, radii, shadows, typeScale } from '../theme';
import { AppIcon } from './AppIcon';
import { GuideAvatar } from './GuideAvatar';
import { MotionPressable } from './Motion';

/**
 * V3.1, réécrit en V3.2 — la demande d'accord, avant tout enregistrement.
 *
 * Elle n'apparaît que sur le site, pendant la phase de test, et une seule
 * fois. Elle énonce trois choses, dans cet ordre : ce qui est enregistré, ce
 * qui ne l'est **jamais**, et le fait qu'un refus n'a aucune conséquence.
 *
 * Le ton est neutre. La première version disait « D'accord, ça m'aide à
 * aider » : une formule bancale, qui sonnait faux là où la personne attend
 * une information claire avant de décider. Un écran de consentement se lit
 * comme un contrat, pas comme une conversation.
 *
 * « Refuser » est un bouton de même taille que « Accepter » : un refus qu'il
 * faut chercher n'est pas un refus.
 */
export function TestJournalConsent({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <GuideAvatar size={72} />
        <View style={styles.headerText}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.eyebrow}>VERSION D’ESSAI</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>Participer à l’amélioration de l’application</Text>
        </View>
      </View>

      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.copy}>
        Cette version est en cours de test. Avec ton accord, l’application enregistre les écrans
        ouverts et les actions effectuées, afin d’identifier ce qui fonctionne et ce qui pose
        problème. Aucune donnée personnelle n’est concernée.
      </Text>

      <View style={[styles.card, styles.yes]}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.cardTitle, { color: colors.greenInk }]}>Ce qui est enregistré</Text>
        {[
          'Les écrans ouverts',
          'Les actions menées à terme : repas ajouté, séance enregistrée',
          'Les formulaires quittés avant validation',
          'Le type d’appareil et la version de l’application',
        ].map(line => (
          <View key={line} style={styles.line}>
            <AppIcon name="check" size={15} color={colors.greenInk} strokeWidth={2.6} />
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.lineText}>{line}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, styles.no]}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.cardTitle, { color: colors.coral }]}>Ce qui n’est jamais enregistré</Text>
        {[
          'Les aliments saisis et les quantités',
          'Le poids, la taille, l’âge et l’objectif',
          'Les calories et les totaux de la journée',
          'Le nom, l’adresse électronique et les photos',
        ].map(line => (
          <View key={line} style={styles.line}>
            <AppIcon name="close" size={15} color={colors.coral} strokeWidth={2.6} />
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.lineText}>{line}</Text>
          </View>
        ))}
      </View>

      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.small}>
        Un identifiant aléatoire remplace toute information nominative. Il reste propre à ce
        navigateur et disparaît si les données de navigation sont effacées. Ce choix est modifiable
        à tout moment depuis le Profil. Un refus n’a aucune conséquence sur le fonctionnement de
        l’application.
      </Text>

      <MotionPressable onPress={onAccept} accessibilityRole="button" style={styles.primary}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.primaryText}>Accepter</Text>
      </MotionPressable>
      <MotionPressable onPress={onDecline} accessibilityRole="button" style={styles.secondary}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.secondaryText}>Refuser</Text>
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
