import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityJournal, ActivitySession, Meal, Profile, SavedFood, StepDetails, ReportedDayEnergy, WeightEntry } from '../types';
import { readSavedFoods } from '../domain/foods';
import { activityIssue, readActivity, saveSession, setDaySteps, setDayEnergy } from '../domain/activity';

import { AppState as NativeAppState } from 'react-native';
import { dayKey, isValidDay } from '../domain/date';
import { CoachHistory, EMPTY_COACH_HISTORY, markMealPrompt, readCoachHistory } from '../domain/coaching';
import { readWeightLog, removeWeight, saveWeight } from '../domain/weight';
import { EMPTY_STORY_HISTORY, markStorySeen, readStoryHistory, StoryHistory } from '../domain/stories';
import { readMeal, readProfile } from '../domain/persistence';

// Clé inchangée depuis la V1 : la mise à jour ne fait pas perdre le journal.
const STORAGE_KEY = '@calories-express/v1';

export const DEFAULT_PROFILE: Profile = {
  firstName: '',
  sexForFormula: 'female',
  age: 30,
  heightCm: 170,
  weightKg: 70,
  activityLevel: 'light',
  activityBudgetMode: 'fixed',
  goal: 'maintain',
  targetMode: 'automatic',
  manualTarget: 2200,
};

const now = new Date();
const todayAt = (hour: number, minute: number) => {
  const date = new Date(now);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

const DEMO_MEALS: Meal[] = [
  {
    id: 'demo-breakfast', createdAt: todayAt(8, 15), moment: 'Petit-déjeuner',
    description: 'Bol de lait chocolaté + madeleine aux pépites', method: 'phrase',
    items: [
      { foodId: 'P001', name: 'Bol de lait chocolaté', quantity: 1, calories: { min: 180, estimated: 250, max: 350 }, macros: { protein: 10, carbs: 36, fat: 8 }, confidence: 'Moyenne' },
      { foodId: 'P002', name: 'Madeleine pépites chocolat', quantity: 1, calories: { min: 90, estimated: 120, max: 170 }, macros: { protein: 2, carbs: 17, fat: 5 }, confidence: 'Moyenne' },
    ],
    calories: { min: 270, estimated: 370, max: 520 }, macros: { protein: 12, carbs: 53, fat: 13 },
  },
  {
    id: 'demo-lunch', createdAt: todayAt(12, 40), moment: 'Déjeuner',
    description: 'Sandwich jambon fromage + verre de soda', method: 'phrase',
    items: [
      { foodId: 'P003', name: 'Sandwich jambon fromage', quantity: 1, calories: { min: 400, estimated: 520, max: 750 }, macros: { protein: 24, carbs: 58, fat: 21 }, confidence: 'Moyenne' },
      { foodId: 'P004', name: 'Verre de soda', quantity: 1, calories: { min: 80, estimated: 140, max: 160 }, macros: { protein: 0, carbs: 35, fat: 0 }, confidence: 'Moyenne' },
    ],
    calories: { min: 480, estimated: 660, max: 910 }, macros: { protein: 24, carbs: 93, fat: 21 },
  },
];

type PersistedState = {
  profile: Profile;
  meals: Meal[];
  isDemo: boolean;
  profileCompleted: boolean;
  savedFoods: SavedFood[];
  activity: ActivityJournal;
  coachHistory: CoachHistory;
  weightLog: WeightEntry[];
  storyHistory: StoryHistory;
};

type AppContextValue = PersistedState & {
  hydrated: boolean;
  today: string;
  /** Journée consultée par les écrans. Aujourd'hui par défaut. */
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  markCoachShown: () => void;
  snoozeCoach: () => void;
  addMeal: (meal: Meal) => void;
  updateMeal: (meal: Meal) => void;
  removeMeal: (id: string) => void;
  updateProfile: (profile: Profile) => void;
  startFresh: () => void;
  resetProfile: () => void;
  restoreDemo: () => void;
  rememberFood: (food: SavedFood) => void;
  forgetFood: (id: string) => void;
  recordActivity: (entry: ActivitySession) => void;
  removeActivity: (id: string) => void;
  recordSteps: (day: string, steps: number, details: StepDetails) => void;
  recordDayEnergy: (day: string, report: ReportedDayEnergy | null) => void;
  recordWeight: (day: string, kg: number) => void;
  forgetWeight: (day: string) => void;
  markStoryWatched: (id: string) => void;
  /** Tout l'état, en JSON lisible, pour une sauvegarde hors de l'application. */
  exportData: () => string;
  storageError: boolean;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [today, setToday] = useState(dayKey(new Date()));
  const [selectedDay, setSelectedDayState] = useState(today);
  const [coachHistory, setCoachHistory] = useState<CoachHistory>({ ...EMPTY_COACH_HISTORY });
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [meals, setMeals] = useState<Meal[]>(DEMO_MEALS);
  const [isDemo, setIsDemo] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [savedFoods, setSavedFoods] = useState<SavedFood[]>([]);
  const [activity, setActivity] = useState<ActivityJournal>({ sessions: [], stepsByDay: {} });
  const [weightLog, setWeightLog] = useState<WeightEntry[]>([]);
  const [storyHistory, setStoryHistory] = useState<StoryHistory>({ ...EMPTY_STORY_HISTORY });
  const [storageError, setStorageError] = useState(false);
  const storageLoaded = useRef(false);
  const writes = useRef(Promise.resolve());
  const pending = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const refresh = () => setToday(dayKey(new Date()));
    const tick = setInterval(refresh, 60000);
    const subscription = NativeAppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { clearInterval(tick); subscription.remove(); };
  }, []);

  // Quand minuit passe pendant que l'application est ouverte, la journée
  // consultée suit, sauf si la personne était déjà partie regarder un jour passé.
  const previousToday = useRef(today);
  useEffect(() => {
    if (previousToday.current !== today) {
      setSelectedDayState(current => (current === previousToday.current ? today : current));
      previousToday.current = today;
    }
  }, [today]);

  const setSelectedDay = useCallback((day: string) => {
    if (!isValidDay(day) || day > dayKey(new Date())) return;
    setSelectedDayState(day);
  }, []);

  const markCoachShown = useCallback(() => setCoachHistory(current => markMealPrompt(current)), []);
  const snoozeCoach = useCallback(() => setCoachHistory(current => ({ ...current, snoozedDay: dayKey(new Date()) })), []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) { storageLoaded.current = true; return; }
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        // V1.8 — chaque bloc est relu et validé séparément. Une entrée abîmée
        // est ignorée au lieu de faire planter l'écran au démarrage.
        setProfile(readProfile(parsed.profile, DEFAULT_PROFILE));
        setMeals(Array.isArray(parsed.meals) ? parsed.meals.map(readMeal).filter((meal): meal is Meal => meal !== null) : []);
        setIsDemo(Boolean(parsed.isDemo));
        setProfileCompleted(parsed.profileCompleted ?? !parsed.isDemo);
        setSavedFoods(readSavedFoods(parsed.savedFoods));
        setActivity(readActivity(parsed.activity));
        setCoachHistory(readCoachHistory(parsed.coachHistory));
        setWeightLog(readWeightLog(parsed.weightLog));
        setStoryHistory(readStoryHistory(parsed.storyHistory));
        storageLoaded.current = true;
      })
      .catch(() => setStorageError(true))
      .finally(() => setHydrated(true));
  }, []);

  // L'état à écrire est gardé dans une référence : la sérialisation n'a lieu
  // qu'au moment de l'écriture, pas à chaque frappe dans un formulaire.
  const latest = useRef<PersistedState | null>(null);
  latest.current = { profile, meals, isDemo, profileCompleted, savedFoods, activity, coachHistory, weightLog, storyHistory };

  const flush = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (!pending.current || !storageLoaded.current || !latest.current) return;
    pending.current = false;
    const payload = JSON.stringify(latest.current);
    // Les écritures restent ordonnées : une sauvegarde lente ne peut pas
    // réinstaller un état plus ancien par-dessus un plus récent.
    writes.current = writes.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(STORAGE_KEY, payload))
      .then(() => setStorageError(false))
      .catch(() => setStorageError(true));
  }, []);

  // Écriture différée de 600 ms : saisir une quantité caractère par caractère
  // ne réécrit plus tout le journal à chaque frappe.
  useEffect(() => {
    if (!hydrated || !storageLoaded.current) return;
    pending.current = true;
    if (timer.current) return;
    timer.current = setTimeout(() => { timer.current = null; flush(); }, 600);
  }, [hydrated, flush, profile, meals, isDemo, profileCompleted, savedFoods, activity, coachHistory, weightLog, storyHistory]);

  // Une mise en arrière-plan ou une fermeture ne doit pas perdre les 600 ms
  // en attente : on écrit tout de suite dans ce cas.
  useEffect(() => {
    const subscription = NativeAppState.addEventListener('change', state => { if (state !== 'active') flush(); });
    return () => { subscription.remove(); flush(); };
  }, [flush]);

  const addMeal = useCallback((meal: Meal) => {
    setMeals((current) => [meal, ...(isDemo ? [] : current)]);
    setIsDemo(false);
  }, [isDemo]);

  const updateMeal = useCallback((meal: Meal) => {
    setMeals((current) => current.map(item => (item.id === meal.id ? meal : item)));
    setIsDemo(false);
  }, []);

  const removeMeal = useCallback((id: string) => {
    setMeals((current) => current.filter((meal) => meal.id !== id));
  }, []);

  const updateProfile = useCallback((next: Profile) => {
    if (isDemo) setMeals([]);
    setProfile(next);
    setIsDemo(false);
    setProfileCompleted(true);
  }, [isDemo]);

  const startFresh = useCallback(() => {
    setMeals([]);
    setIsDemo(false);
    setProfileCompleted(false);
  }, []);

  const resetProfile = useCallback(() => {
    setProfile({ ...DEFAULT_PROFILE });
    setProfileCompleted(false);
    setIsDemo(false);
  }, []);

  const restoreDemo = useCallback(() => {
    setProfile({ ...DEFAULT_PROFILE });
    setMeals(DEMO_MEALS);
    setIsDemo(true);
    setProfileCompleted(false);
  }, []);

  const rememberFood = useCallback((food: SavedFood) => setSavedFoods(current => [food, ...current.filter(f => f.id !== food.id)].slice(0, 100)), []);
  const forgetFood = useCallback((id: string) => setSavedFoods(current => current.filter(f => f.id !== id)), []);
  const recordActivity = useCallback((entry: ActivitySession) => {
    const issue = activityIssue(entry, activity); if (issue) throw new Error(issue);
    setActivity(current => saveSession(current, entry));
  }, [activity]);
  const removeActivity = useCallback((id: string) => setActivity(current => ({ ...current, sessions: current.sessions.filter(s => s.id !== id) })), []);
  const recordSteps = useCallback((day: string, steps: number, details: StepDetails) => {
    setDaySteps(activity, day, steps, details);
    setActivity(current => setDaySteps(current, day, steps, details));
  }, [activity]);

  const recordDayEnergy = useCallback((day: string, report: ReportedDayEnergy | null) => {
    setDayEnergy(activity, day, report);
    setActivity(current => setDayEnergy(current, day, report));
  }, [activity]);

  const recordWeight = useCallback((day: string, kg: number) => {
    // Lève avant de toucher à l'état, pour que le formulaire affiche l'erreur.
    saveWeight(weightLog, { day, kg });
    setWeightLog(current => saveWeight(current, { day, kg }));
  }, [weightLog]);

  const forgetWeight = useCallback((day: string) => setWeightLog(current => removeWeight(current, day)), []);
  const markStoryWatched = useCallback((id: string) => setStoryHistory(current => markStorySeen(current, id)), []);

  const exportData = useCallback(() => JSON.stringify({
    application: 'Calories Express',
    exportedAt: new Date().toISOString(),
    format: 1,
    profile, profileCompleted, meals, activity, weightLog, savedFoods,
  }, null, 2), [profile, profileCompleted, meals, activity, weightLog, savedFoods]);

  const value = useMemo(() => ({
    profile, meals, isDemo, profileCompleted, hydrated, addMeal, updateMeal, removeMeal, updateProfile, startFresh, resetProfile, restoreDemo,
    today, selectedDay, setSelectedDay, coachHistory, markCoachShown, snoozeCoach, savedFoods, activity, rememberFood, forgetFood,
    recordActivity, removeActivity, recordSteps, recordDayEnergy, weightLog, recordWeight, forgetWeight,
    storyHistory, markStoryWatched, exportData, storageError,
  }), [profile, meals, isDemo, profileCompleted, hydrated, addMeal, updateMeal, removeMeal, updateProfile, startFresh, resetProfile, restoreDemo,
    today, selectedDay, setSelectedDay, coachHistory, markCoachShown, snoozeCoach, savedFoods, activity, rememberFood, forgetFood,
    recordActivity, removeActivity, recordSteps, recordDayEnergy, weightLog, recordWeight, forgetWeight,
    storyHistory, markStoryWatched, exportData, storageError]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
};
