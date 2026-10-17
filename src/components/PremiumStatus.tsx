import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PREMIUM_PRICE_LABEL } from '../domain/premium';
import { restorePurchases, TEST_MODE, UNAVAILABLE_MESSAGE } from '../services/purchases';
import { useApp } from '../state/AppContext';
import { usePaywall } from '../state/PaywallContext';
import { colors, fonts, MAX_FONT_SCALE, radii } from '../theme';
import { AppIcon } from './AppIcon';
import { MotionPressable } from './Motion';

/**
 * V5.0 — la rubrique « Premium » du profil : le statut, « Restaurer mes
 * achats » (exigé par Apple), et, en développement seulement, un bouton pour
 * remettre le compte en gratuit et retester les écrans verrouillés.
 */
export function PremiumStatus() {
  const { premium, unlockPremium, lockPremium } = useApp();
  const { openPaywall } = usePaywall();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const restore = async () => {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      const outcome = await restorePurchases();
      if (outcome.status === 'unlocked') { unlockPremium(outcome.source); setMessage('Ton premium a été restauré.'); }
      else if (outcome.status === 'nothing') setMessage('Aucun achat à restaurer avec ce compte.');
      else setMessage(outcome.status === 'cancelled' ? 'Restauration annulée.' : UNAVAILABLE_MESSAGE);
    } catch {
      setMessage('La restauration n’a pas pu aboutir. Tu peux réessayer.');
    } finally { setBusy(false); }
  };

  return (
    <View style={styles.card}>
      {premium.unlocked ? (
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: colors.greenPale }]}><AppIcon name="check" size={22} color={colors.greenInk} strokeWidth={2.4} /></View>
          <View style={{ flex: 1 }}>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>Premium débloqué</Text>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.copy}>
              Merci ! Les bilans et tes objectifs de macros sont à toi pour toujours.{premium.source === 'test' ? ' (Mode test : aucun paiement réel.)' : ''}
            </Text>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.row}>
            <View style={styles.icon}><AppIcon name="sparkle" size={22} color={colors.violet} strokeWidth={2.1} /></View>
            <View style={{ flex: 1 }}>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>Calories Express Premium</Text>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.copy}>
                Bilans de la semaine et du mois, objectifs de macros. Un achat unique de {PREMIUM_PRICE_LABEL}, sans abonnement. Tout le reste est et reste gratuit.
              </Text>
            </View>
          </View>
          <MotionPressable onPress={() => openPaywall()} accessibilityRole="button" style={styles.button}>
            <Text maxFontSizeMultiplier={1.4} style={styles.buttonText}>Voir le premium</Text>
          </MotionPressable>
        </>
      )}

      {!premium.unlocked && (
        <MotionPressable onPress={restore} accessibilityRole="button" style={styles.link}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.linkText}>Restaurer mes achats</Text>
        </MotionPressable>
      )}
      {message ? <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.message}>{message}</Text> : null}

      {TEST_MODE && premium.unlocked && (
        <MotionPressable onPress={lockPremium} accessibilityRole="button" style={styles.link}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.testText}>Remettre en gratuit (mode test seulement)</Text>
        </MotionPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.sagePale, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.ink, fontSize: 17, fontFamily: fonts.extrabold, letterSpacing: -0.2 },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 19, fontFamily: fonts.medium, marginTop: 3 },
  button: { backgroundColor: colors.violet, borderRadius: radii.large, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.white, fontSize: 16, fontFamily: fonts.extrabold },
  link: { alignItems: 'center', paddingVertical: 8 },
  linkText: { color: colors.violet, fontSize: 14, fontFamily: fonts.bold, textDecorationLine: 'underline' },
  testText: { color: colors.warmInk, fontSize: 13, fontFamily: fonts.bold, textDecorationLine: 'underline' },
  message: { color: colors.inkSoft, fontSize: 13, lineHeight: 19, fontFamily: fonts.semibold, textAlign: 'center' },
});
