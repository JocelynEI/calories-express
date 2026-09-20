import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
import { colors, MAX_FONT_SCALE } from './src/theme';
import { Meal } from './src/types';
import { MealCoachPopup } from './src/components/MealCoachPopup';
import { canShowMealPrompt, mealEncouragement, MealEncouragement } from './src/domain/coaching';
import { orderedStories, Story } from './src/domain/stories';
import { shouldShowOnboarding } from './src/domain/onboarding';
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

const TAB_LABELS: Record<TabName, string> = {
  today: 'Aujourd’hui',
  journal: 'Journal',
  progress: 'Progression',
  profile: 'Profil',
};

export default function App() {
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

  useEffect(() => {
    if (ready && !settings.welcome) setWelcomeDismissed(true);
  }, [ready, settings.welcome]);

  const clearOverlays = () => { setSuggestion(null); setNotice(false); };
  const openAdd = () => { clearOverlays(); setEditingMeal(null); setAddVisible(true); };
  const openEdit = (meal: Meal) => { clearOverlays(); setEditingMeal(meal); setAddVisible(true); };
  const closeAdd = () => { setAddVisible(false); setEditingMeal(null); };
  const changeTab = (next: TabName) => { clearOverlays(); setTab(next); };
  const openActivity = () => { clearOverlays(); setActivityIdea(null); setActivityVisible(true); };
  const playStory = (next: Story) => { clearOverlays(); setStory(next); };

  const saved = (meal: Meal) => {
    const wasEditing = editingMeal !== null;
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
            {addVisible && <AddMealModal visible onClose={closeAdd} onAdded={saved} meal={editingMeal} />}
            {activityVisible && (
              <ActivityModal
                initialTab={activityIdea ? 'ideas' : 'journal'}
                initialIdea={activityIdea}
                initialDay={selectedDay}
                onClose={() => setActivityVisible(false)}
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
  viewport: { flex: 1, backgroundColor: colors.background, alignItems: 'center' },
  app: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: colors.background, overflow: 'hidden', ...(Platform.OS === 'web' ? { boxShadow: '0 0 40px rgba(16,46,45,.12)' } : {}) },
  screen: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  storageWarning: { paddingHorizontal: 14, paddingVertical: 10, color: '#6F4E07', backgroundColor: colors.goldPale, fontSize: 13, lineHeight: 18, fontWeight: '600' },
});
