import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { ActivityModal } from './src/components/ActivityModal';
import { AddMealModal } from './src/components/AddMealModal';
import { BottomNav, TabName } from './src/components/BottomNav';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { JournalScreen } from './src/screens/JournalScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { Entrance } from './src/components/Motion';
import { FeedbackToast } from './src/components/FeedbackToast';
import { StoryPlayer } from './src/components/StoryPlayer';
import { ExperienceProvider, useExperience } from './src/state/ExperienceContext';
import { AppProvider, useApp } from './src/state/AppContext';
import { colors, MAX_FONT_SCALE, fonts } from './src/theme';
import { Meal } from './src/types';
import { MealCoachPopup } from './src/components/MealCoachPopup';
import { canShowMealPrompt, mealEncouragement, MealEncouragement } from './src/domain/coaching';
import { orderedStories, Story } from './src/domain/stories';
import { shouldShowOnboarding } from './src/domain/onboarding';
import { shouldAskConsent } from './src/domain/telemetry';
import { TEST_JOURNAL_URL } from './src/config/test-journal';
import { setTestJournalConsent, track } from './src/services/test-journal';
import { TestJournalConsent } from './src/components/TestJournalConsent';
import appConfig from './app.json';

/**
 * V2.4.2 — la version s'annonce dans les journaux au démarrage.
 *
 * Deux fois de suite, un message d'erreur a été rapporté depuis une version
 * déjà corrigée : rien, dans les journaux de React Native, ne dit quel paquet
 * tourne réellement. Cette ligne apparaît maintenant juste avant les
 * éventuelles erreurs, et tranche la question en une seconde.
 */
console.log(`----- Calories Express ${appConfig.expo.version} ----- (si le numéro n'est pas celui que tu viens d'installer, c'est l'ancien dossier qui tourne)`);

/** Les noms d'écrans du journal de test, tenus à part de l'affichage. */
const SCREEN_EVENTS: Record<TabName, string> = {
  today: 'ecran-accueil',
  journal: 'ecran-journal',
  progress: 'ecran-progression',
  profile: 'ecran-profil',
};

const TAB_LABELS: Record<TabName, string> = {
  today: 'Aujourd’hui',
  journal: 'Journal',
  progress: 'Progression',
  profile: 'Profil',
};

export default function App() {
  // V2.7 — Plus Jakarta Sans. Les fichiers de police font partie de
  // l'application : aucun réseau n'est nécessaire pour les charger. Tant
  // qu'ils ne sont pas prêts, on n'affiche qu'un fond uni plutôt qu'un texte
  // qui changerait de police sous les yeux. En cas d'échec, l'application
  // s'ouvre quand même, avec la police du système.
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  if (!fontsLoaded && !fontError) return <View style={styles.fontGate} />;

  return (
    // Ce filet-ci est au-dessus des fournisseurs : il rattrape aussi une erreur
    // venant d'eux. `ErrorBoundary` n'utilise donc aucun contexte.
    // V2.4.1 — `SafeAreaView` vient désormais de react-native-safe-area-context.
    // Celui de React Native est déprécié, ne fonctionnait que sur iOS, et ne
    // tenait pas compte de la barre d'accueil en bas des iPhone récents : la
    // barre de navigation pouvait passer dessous.
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppProvider>
          <ExperienceProvider><AppShell /></ExperienceProvider>
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function AppShell() {
  const { hydrated, storageError, activity, coachHistory, markCoachShown, snoozeCoach, selectedDay, today, setSelectedDay, markStoryWatched, storyHistory, profileCompleted } = useApp();
  const { ready, settings, setSetting } = useExperience();
  const [activityVisible, setActivityVisible] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [replayWelcome, setReplayWelcome] = useState(false);
  const [replayOnboarding, setReplayOnboarding] = useState(false);
  // « Passer » ne vaut que pour ce lancement : rien n'est écrit sur le téléphone.
  const [onboardingSkipped, setOnboardingSkipped] = useState(false);
  const [tab, setTab] = useState<TabName>('today');
  const [addVisible, setAddVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [suggestion, setSuggestion] = useState<MealEncouragement | null>(null);
  const [activityIdea, setActivityIdea] = useState<'walk' | 'mobility' | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [notice, setNotice] = useState(false);
  const dismissNotice = useCallback(() => setNotice(false), []);

  /* V3.1 — le journal de test. Il ne s'active que sur le site, avec l'accord
     de la personne et une adresse configurée ; partout ailleurs, `track` ne
     fait rien du tout. */
  const askConsent = shouldAskConsent({ consent: settings.testJournal, platform: Platform.OS, url: TEST_JOURNAL_URL });
  useEffect(() => { setTestJournalConsent(settings.testJournal); }, [settings.testJournal]);
  useEffect(() => { if (settings.testJournal === 'yes') track('premiere-ouverture'); }, [settings.testJournal]);
  useEffect(() => { track(SCREEN_EVENTS[tab]); }, [tab]);
  // Le nombre de séances au moment où la fenêtre s'ouvre : il dit, à la
  // fermeture, si la visite a servi à quelque chose ou non.
  const sessionsWhenOpened = useRef(0);

  useEffect(() => {
    if (ready && !settings.welcome) setWelcomeDismissed(true);
  }, [ready, settings.welcome]);

  const clearOverlays = () => { setSuggestion(null); setNotice(false); };
  const openAdd = () => { clearOverlays(); setEditingMeal(null); track('ouvre-ajout-repas'); setAddVisible(true); };
  const openEdit = (meal: Meal) => { clearOverlays(); setEditingMeal(meal); setAddVisible(true); };
  const closeAdd = () => { setAddVisible(false); setEditingMeal(null); };
  const changeTab = (next: TabName) => { clearOverlays(); setTab(next); };
  const openActivity = () => {
    clearOverlays(); setActivityIdea(null);
    sessionsWhenOpened.current = activity.sessions.length;
    track('ouvre-activite');
    setActivityVisible(true);
  };
  const closeActivity = () => {
    if (activity.sessions.length === sessionsWhenOpened.current) track('activite-abandonnee');
    setActivityVisible(false);
  };
  // Fermer l'ajout d'un repas sans l'avoir validé : c'est le signal le plus
  // utile du journal, celui qui dit où le formulaire décourage.
  const abandonAdd = () => { track('ajout-repas-abandonne'); closeAdd(); };
  const playStory = (next: Story) => { clearOverlays(); setStory(next); };

  const saved = (meal: Meal) => {
    const wasEditing = editingMeal !== null;
    track(wasEditing ? 'repas-modifie' : 'repas-ajoute');
    closeAdd();
    if (wasEditing) { setNotice(true); return; }
    setTab('today');
    if (canShowMealPrompt(coachHistory, settings.activityPrompts)) {
      markCoachShown();
      setNotice(false);
      setSuggestion(mealEncouragement(activity, meal.moment));
    } else setNotice(true);
  };

  /**
   * V1.8 — le bouton retour d'Android. Sans lui, un retour depuis une modale
   * ou depuis une journée passée fermait l'application. Les couches se
   * referment ici une par une, de la plus récente à la plus ancienne.
   */
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (story) { setStory(null); return true; }
      if (replayOnboarding) { setReplayOnboarding(false); return true; }
      if (suggestion) { setSuggestion(null); return true; }
      if (notice) { setNotice(false); return true; }
      if (replayWelcome) { setReplayWelcome(false); return true; }
      // Les modales gèrent elles-mêmes `onRequestClose` : elles peuvent avoir
      // une saisie en cours à confirmer, on ne les ferme pas d'autorité ici.
      if (addVisible || activityVisible) return false;
      if (selectedDay !== today) { setSelectedDay(today); return true; }
      if (tab !== 'today') { setTab('today'); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [story, suggestion, notice, replayWelcome, replayOnboarding, addVisible, activityVisible, selectedDay, today, setSelectedDay, tab]);

  const stories = orderedStories(storyHistory);
  const nextStory = story ? stories.find(item => item.id !== story.id && !storyHistory.seen.includes(item.id)) ?? null : null;

  /**
   * Pas de profil enregistré, donc le parcours guidé. « Passer » le met de côté
   * pour ce lancement seulement.
   *
   * La V2.4.3 et les précédentes gardaient ce choix en mémoire définitivement :
   * effacer son profil ne ramenait donc jamais les étapes, et il ne restait que
   * le formulaire détaillé. La règle est redevenue celle qu'on attend.
   */
  const showOnboarding = shouldShowOnboarding({
    replay: replayOnboarding,
    profileCompleted,
    skippedThisLaunch: onboardingSkipped,
  });

  return (
    <View style={styles.viewport}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.app}>
        <StatusBar style="dark" />
        {!hydrated || !ready ? (
          <View style={styles.loading}><ActivityIndicator color={colors.violet} /></View>
        ) : askConsent ? (
          /* V3.1 — avant tout le reste : on demande, on n'enregistre pas
             d'abord pour demander ensuite. */
          <TestJournalConsent
            onAccept={() => setSetting('testJournal', 'yes')}
            onDecline={() => setSetting('testJournal', 'no')}
          />
        ) : showOnboarding ? (
          /* Premier lancement : la création du profil, mise en scène. Elle ne
             réapparaît jamais une fois le profil enregistré ou passé. */
          <OnboardingScreen onDone={() => { setReplayOnboarding(false); setOnboardingSkipped(true); setWelcomeDismissed(true); }} />
        ) : ((!welcomeDismissed && settings.welcome) || replayWelcome) ? (
          <WelcomeScreen onContinue={() => { setWelcomeDismissed(true); setReplayWelcome(false); }} />
        ) : (
          <>
            {storageError && (
              <Text accessibilityRole="alert" maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.storageWarning}>
                La lecture ou la sauvegarde sur ce téléphone a échoué. Les dernières modifications risquent d’être perdues à la fermeture.
              </Text>
            )}
            {/* Second filet, à l'intérieur des fournisseurs : si un écran
                échoue, la barre de navigation reste utilisable et l'erreur est
                nommée, au lieu de faire tomber toute l'application. */}
            <ErrorBoundary key={`boundary-${tab}`} label={TAB_LABELS[tab]}>
              <Entrance key={tab} style={styles.screen}>
                {tab === 'today' && (
                  <TodayScreen
                    onAdd={openAdd}
                    onEditMeal={openEdit}
                    onProfile={() => changeTab('profile')}
                    onActivity={openActivity}
                    onPlayStory={playStory}
                  />
                )}
                {tab === 'journal' && <JournalScreen onEditMeal={openEdit} onAdd={openAdd} />}
                {tab === 'progress' && <ProgressScreen onPlayStory={playStory} />}
                {tab === 'profile' && <ProfileScreen onReplayWelcome={() => setReplayWelcome(true)} onReplayOnboarding={() => setReplayOnboarding(true)} />}
              </Entrance>
            </ErrorBoundary>
            <BottomNav active={tab} onChange={changeTab} onAdd={openAdd} />
            {addVisible && <AddMealModal visible onClose={abandonAdd} onAdded={saved} meal={editingMeal} />}
            {activityVisible && (
              <ActivityModal
                initialTab={activityIdea ? 'ideas' : 'journal'}
                initialIdea={activityIdea}
                initialDay={selectedDay}
                onClose={closeActivity}
                onSettings={() => { setActivityVisible(false); changeTab('profile'); }}
              />
            )}
            {story && (
              <StoryPlayer
                story={story}
                onClose={() => setStory(null)}
                onSeen={markStoryWatched}
                nextStory={nextStory}
                onPlayNext={setStory}
              />
            )}
            {suggestion && !activityVisible && !addVisible && !story && (
              <MealCoachPopup
                suggestion={suggestion}
                onClose={() => setSuggestion(null)}
                onSnooze={() => { snoozeCoach(); setSuggestion(null); }}
                onDisable={() => { setSetting('activityPrompts', false); setSuggestion(null); }}
                onIdea={() => { setActivityIdea(suggestion.idea); setSuggestion(null); setActivityVisible(true); }}
              />
            )}
            {notice && !activityVisible && !addVisible && !story && <FeedbackToast onDismiss={dismissNotice} />}
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fontGate: { flex: 1, backgroundColor: colors.background },
  viewport: { flex: 1, backgroundColor: colors.background, alignItems: 'center' },
  app: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: colors.background, overflow: 'hidden', ...(Platform.OS === 'web' ? { boxShadow: '0 0 40px rgba(16,46,45,.12)' } : {}) },
  screen: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  storageWarning: { paddingHorizontal: 14, paddingVertical: 10, color: '#6F4E07', backgroundColor: colors.goldPale, fontSize: 13, lineHeight: 18, fontFamily: fonts.semibold },
});
