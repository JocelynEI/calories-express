import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { useExperience } from '../state/ExperienceContext';
import { PREMIUM_FEATURES, PREMIUM_PRICE_LABEL, PremiumFeature, STAYS_FREE } from '../domain/premium';
import { buyPremium, restorePurchases, TEST_MODE, UNAVAILABLE_MESSAGE } from '../services/purchases';
import { colors, fonts, MAX_FONT_SCALE, radii } from '../theme';
import { AppIcon } from './AppIcon';
import { MotionPressable } from './Motion';

type Props = { feature?: PremiumFeature; onClose: () => void };

/**
 * V5.0 — ce que contient le premium, dit une seule fois et sans détour.
 *
 * Il ne s'ouvre jamais tout seul : seulement quand on touche une fonction
 * premium, ou la rubrique du profil. Un achat unique, sans abonnement ni
 * compte, et la liste de ce qui reste gratuit est sur l'écran même.
 */
export function PremiumModal({ feature, onClose }: Props) {
  const { premium, unlockPremium } = useApp();
  const { reducedMotion } = useExperience();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [thanks, setThanks] = useState(false);

  // La fonction que la personne voulait ouvrir passe en premier.
  const features = [...PREMIUM_FEATURES].sort((a, b) => (a.id === feature ? -1 : b.id === feature ? 1 : 0));
  const unlocked = premium.unlocked;

  const run = async (action: () => Promise<Awaited<ReturnType<typeof buyPremium>>>) => {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      const outcome = await action();
      if (outcome.status === 'unlocked') { unlockPremium(outcome.source); setThanks(true); }
      else if (outcome.status === 'nothing') setMessage('Aucun achat à restaurer avec ce compte.');
      else if (outcome.status === 'cancelled') setMessage('Achat annulé. Rien n’a été débité.');
      else setMessage(UNAVAILABLE_MESSAGE);
    } catch {
      setMessage('L’achat n’a pas pu aboutir. Rien n’a été débité ; tu peux réessayer.');
    } finally { setBusy(false); }
  };

  return (
    <Modal visible transparent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer" />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
            <View style={styles.header}>
              <View style={styles.badge}><AppIcon name="sparkle" size={22} color={colors.white} strokeWidth={2.1} /></View>
              <View style={styles.headerText}>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.eyebrow}>CALORIES EXPRESS</Text>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title} accessibilityRole="header">Premium</Text>
              </View>
              <MotionPressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer" style={styles.close}>
                <AppIcon name="close" size={18} color={colors.navy} strokeWidth={2.4} />
              </MotionPressable>
            </View>

            {thanks || unlocked ? (
              <View style={styles.thanks} accessibilityLiveRegion="polite">
                <AppIcon name="check" size={22} color={colors.greenInk} strokeWidth={2.4} />
                <View style={{ flex: 1 }}>
                  <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.thanksTitle}>{thanks ? 'Premium débloqué, merci !' : 'Premium débloqué'}</Text>
                  <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.thanksCopy}>
                    Pour toujours, sur ce téléphone.{premium.source === 'test' || (thanks && TEST_MODE) ? ' (Mode test : aucun paiement réel.)' : ''}
                  </Text>
                </View>
              </View>
            ) : (
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.lead}>Un seul achat, pour toujours. Pas d’abonnement, pas de compte.</Text>
            )}

            <View style={styles.list}>
              {features.map(item => (
                <View key={item.id} style={[styles.feature, item.id === feature && !unlocked && styles.featureAsked]}>
                  <View style={styles.featureIcon}><AppIcon name={item.icon} size={22} color={colors.violet} strokeWidth={2.1} /></View>
                  <View style={{ flex: 1 }}>
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.featureTitle}>{item.title}</Text>
                    <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.featureCopy}>{item.copy}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.free}>
              <AppIcon name="check" size={18} color={colors.greenInk} strokeWidth={2.3} />
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.freeText}>{STAYS_FREE}</Text>
            </View>

            {!(thanks || unlocked) && (
              <>
                <MotionPressable
                  onPress={() => run(buyPremium)}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={`Débloquer le premium à vie, ${PREMIUM_PRICE_LABEL}`}
                  style={[styles.buy, busy && { opacity: 0.6 }]}
                >
                  <Text maxFontSizeMultiplier={1.4} style={styles.buyText}>Débloquer à vie · {PREMIUM_PRICE_LABEL}</Text>
                </MotionPressable>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.small}>
                  Paiement unique. Le prix peut évoluer pour les prochains acheteurs, jamais pour toi une fois débloqué.
                </Text>
                {TEST_MODE && <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.testNote}>Mode test : l’achat est simulé, rien n’est débité.</Text>}
                {message ? <Text accessibilityRole="alert" maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.message}>{message}</Text> : null}
                <Pressable onPress={() => run(restorePurchases)} disabled={busy} accessibilityRole="button" style={styles.link}>
                  <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.linkText}>Restaurer mes achats</Text>
                </Pressable>
              </>
            )}

            <Pressable onPress={onClose} accessibilityRole="button" style={styles.later}>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.laterText}>{thanks || unlocked ? 'Continuer' : 'Plus tard'}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,38,30,0.55)' },
  sheet: { width: '100%', maxWidth: 480, maxHeight: '92%', backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: 8 },
  content: { paddingHorizontal: 20, paddingBottom: 30, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  eyebrow: { color: colors.sageDark, fontSize: 11, fontFamily: fonts.extrabold, letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 26, fontFamily: fonts.displayHeavy, letterSpacing: -0.5 },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  lead: { color: colors.inkSoft, fontSize: 15, lineHeight: 22, fontFamily: fonts.semibold },
  thanks: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.greenPale, borderRadius: radii.large, borderWidth: 1, borderColor: colors.greenEdge, padding: 14 },
  thanksTitle: { color: colors.greenInk, fontSize: 16, fontFamily: fonts.extrabold },
  thanksCopy: { color: colors.inkSoft, fontSize: 13, lineHeight: 19, fontFamily: fonts.medium, marginTop: 2 },
  list: { gap: 10 },
  feature: { flexDirection: 'row', gap: 12, backgroundColor: colors.background, borderRadius: radii.large, padding: 14, borderWidth: 1, borderColor: colors.line },
  featureAsked: { borderColor: colors.violet, backgroundColor: colors.sagePale },
  featureIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { color: colors.ink, fontSize: 15, fontFamily: fonts.extrabold },
  featureCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, fontFamily: fonts.medium, marginTop: 3 },
  free: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.greenPale, borderRadius: radii.medium, padding: 12 },
  freeText: { flex: 1, color: colors.greenInk, fontSize: 13, lineHeight: 19, fontFamily: fonts.semibold },
  buy: { backgroundColor: colors.violet, borderRadius: radii.large, minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buyText: { color: colors.white, fontSize: 17, fontFamily: fonts.extrabold },
  small: { color: colors.muted, fontSize: 12, lineHeight: 18, fontFamily: fonts.medium, textAlign: 'center' },
  testNote: { color: colors.warmInk, fontSize: 12, fontFamily: fonts.bold, textAlign: 'center' },
  message: { color: '#75510D', backgroundColor: '#FFF1D9', borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 19, fontFamily: fonts.semibold },
  link: { alignItems: 'center', paddingVertical: 10 },
  linkText: { color: colors.violet, fontSize: 15, fontFamily: fonts.bold, textDecorationLine: 'underline' },
  later: { alignItems: 'center', paddingVertical: 12 },
  laterText: { color: colors.muted, fontSize: 15, fontFamily: fonts.bold },
});
