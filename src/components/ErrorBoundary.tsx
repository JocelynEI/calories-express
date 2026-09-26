import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { track } from '../services/test-journal';
import { fonts } from '../theme';

/**
 * Filet de sécurité.
 *
 * ATTENTION : ce composant est monté **au-dessus** des fournisseurs de contexte
 * de l'application, parce qu'il doit aussi pouvoir rattraper une erreur venant
 * d'eux. Il ne doit donc utiliser aucun composant qui appelle `useApp` ou
 * `useExperience` — sinon l'écran d'erreur plante à son tour et masque l'erreur
 * d'origine. C'est exactement ce qui s'est produit avec la première V1.8 :
 * l'écran d'erreur appelait `MotionPressable`, qui demande `useExperience`.
 *
 * D'où la règle, volontairement stricte : ici, uniquement des composants de
 * base de React Native, aucune couleur importée, aucun style partagé.
 */

type Props = { children: React.ReactNode; label?: string };
type State = { error: Error | null; stack: string };

const INK = '#15162B';
const INK_SOFT = '#3E435C';
const MUTED = '#5A6076';
const BACKGROUND = '#F5F7FC';
const CARD = '#FFFFFF';
const LINE = '#E4E7F2';
const VIOLET = '#5B3FE0';
const GOLD_PALE = '#FFF7E4';
const GOLD_TEXT = '#8A6209';

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, stack: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    // Pas de service distant : la trace reste dans la console du Terminal,
    // et les premières lignes s'affichent sur le téléphone pour pouvoir
    // nommer le composant fautif sans rebrancher le Mac.
    console.error('Calories Express — erreur de rendu', error, info?.componentStack);
    // V3.1 — une ligne dans le journal de test, sans le message d'erreur :
    // il peut contenir n'importe quoi, y compris une valeur saisie.
    track('erreur-affichee');
    this.setState({ stack: (info?.componentStack ?? '').trim() });
  }

  render() {
    const { error, stack } = this.state;
    if (!error) return this.props.children;

    const where = stack
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .slice(0, 6)
      .join('\n');

    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.badge}><Text style={styles.badgeText}>!</Text></View>
          <Text style={styles.title}>
            {this.props.label ? `L’écran « ${this.props.label} » n’a pas pu s’afficher` : 'Cet écran n’a pas pu s’afficher'}
          </Text>
          <Text style={styles.copy}>
            Tes repas, ton activité, tes pesées et ton profil restent enregistrés sur le téléphone : cet écran ne
            supprime rien. Réessaie ci-dessous. Si le problème revient, ferme puis rouvre l’application.
          </Text>

          <Pressable
            onPress={() => this.setState({ error: null, stack: '' })}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>Réessayer</Text>
          </Pressable>

          <Text style={styles.detailLabel}>DÉTAIL TECHNIQUE</Text>
          <Text style={styles.detail} selectable>{error.message || String(error)}</Text>
          {where ? <Text style={styles.detail} selectable>{where}</Text> : null}
          <Text style={styles.hint}>
            Ce texte est sélectionnable : copie-le pour le transmettre. La trace complète est aussi affichée dans le
            Terminal qui fait tourner Expo.
          </Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BACKGROUND },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 14 },
  badge: { width: 54, height: 54, borderRadius: 27, backgroundColor: GOLD_PALE, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: GOLD_TEXT, fontSize: 28, fontFamily: fonts.extrabold },
  title: { color: INK, fontSize: 26, fontFamily: fonts.extrabold, letterSpacing: -0.6, lineHeight: 32 },
  copy: { color: INK_SOFT, fontSize: 16, fontFamily: fonts.medium, lineHeight: 23 },
  button: { backgroundColor: VIOLET, borderRadius: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  pressed: { opacity: 0.75 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontFamily: fonts.extrabold },
  detailLabel: { color: MUTED, fontSize: 12, fontFamily: fonts.extrabold, letterSpacing: 1.1, marginTop: 10 },
  detail: { color: INK_SOFT, fontSize: 13, fontFamily: fonts.medium, lineHeight: 19, backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: LINE, padding: 12 },
  hint: { color: MUTED, fontSize: 13, fontFamily: fonts.medium, lineHeight: 18 },
});
