import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';
import { DEFAULT_EXPERIENCE, ExperienceSettings, isAppActive, motionStatus, readExperienceSettings, shouldReduceMotion } from '../domain/experience';

// Keep the V1.2 key so the user's preferences survive this update.
const KEY = '@calories-express/experience-v1';
type Experience = {
  ready: boolean;
  settings: ExperienceSettings;
  reducedMotion: boolean;
  active: boolean;
  setSetting: <K extends keyof ExperienceSettings>(key: K, value: ExperienceSettings[K]) => void;
  /** Phrase affichée dans le Profil : pourquoi ça bouge, ou pourquoi non. */
  motionExplanation: string;
};
const Context = createContext<Experience | null>(null);

export function ExperienceProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState(DEFAULT_EXPERIENCE);
  const [ready, setReady] = useState(false);
  // Par défaut les animations sont actives. L'ancienne valeur par défaut
  // (réduites) gelait toute l'application si la préférence du système ne
  // pouvait pas être lue — et l'échec était silencieux.
  const [systemReduced, setSystemReduced] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [active, setActive] = useState(() => isAppActive(AppState.currentState));

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY).then(raw => {
      if (alive && raw) setSettings(readExperienceSettings(JSON.parse(raw)));
    }).catch(() => undefined).finally(() => { if (alive) setReady(true); });
    const media = Platform.OS === 'web' && typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (media) setSystemReduced(media.matches);
    else AccessibilityInfo.isReduceMotionEnabled().then(value => { if (alive) setSystemReduced(value); }).catch(() => undefined);
    AccessibilityInfo.isScreenReaderEnabled().then(value => { if (alive) setScreenReader(value); }).catch(() => undefined);
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReduced);
    const reader = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    const change = (event: MediaQueryListEvent) => setSystemReduced(event.matches);
    media?.addEventListener('change', change);
    // Relecture après le montage : au lancement l'état peut encore être
    // « unknown », et l'écouteur ci-dessous ne réagit qu'aux changements.
    setActive(isAppActive(AppState.currentState));
    const app = AppState.addEventListener('change', state => setActive(isAppActive(state)));
    const visibility = () => setActive(document.visibilityState === 'visible');
    if (Platform.OS === 'web') {
      visibility();
      document.addEventListener('visibilitychange', visibility);
    }
    return () => {
      alive = false;
      motion.remove(); reader.remove(); app.remove(); media?.removeEventListener('change', change);
      if (Platform.OS === 'web') document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  useEffect(() => {
    if (ready) void AsyncStorage.setItem(KEY, JSON.stringify(settings)).catch(() => undefined);
  }, [ready, settings]);
  const setSetting = useCallback(<K extends keyof ExperienceSettings>(key: K, value: ExperienceSettings[K]) => setSettings(current => ({ ...current, [key]: value })), []);
  const value = useMemo(() => ({
    ready, settings,
    reducedMotion: shouldReduceMotion({ motion: settings.motion, systemReduced, screenReader }),
    motionExplanation: motionStatus({ motion: settings.motion, systemReduced, screenReader }),
    active, setSetting,
  }), [ready, settings, systemReduced, active, screenReader, setSetting]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

// Déclaré localement : React Native fournit ce drapeau à l'exécution, et cette
// ligne évite d'en dépendre pour la vérification de types.
declare const __DEV__: boolean;

// Repli utilisé hors fournisseur : les animations sont coupées, rien d'autre.
// Ces réglages ne pilotent que du confort visuel, jamais une donnée du journal.
const WITHOUT_PROVIDER: Experience = {
  ready: true,
  settings: DEFAULT_EXPERIENCE,
  reducedMotion: true,
  motionExplanation: '',
  active: true,
  setSetting: () => undefined,
};

/**
 * Hors fournisseur, on renvoie ce repli au lieu de lever une exception.
 *
 * Une erreur ici ferait tomber tout l'écran pour une question d'animation — et,
 * pire, elle peut survenir dans l'écran d'erreur lui-même, qui est monté au
 * -dessus des fournisseurs : l'application n'afficherait alors plus rien
 * d'exploitable. Un avertissement en développement suffit.
 */
export function useExperience(): Experience {
  const value = useContext(Context);
  if (!value) {
    if (__DEV__) console.warn('useExperience appelé hors ExperienceProvider : animations désactivées pour ce sous-arbre.');
    return WITHOUT_PROVIDER;
  }
  return value;
}
