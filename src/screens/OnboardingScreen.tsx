import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Easing, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { AppIcon } from '../components/AppIcon';
import { GuideAvatar } from '../components/GuideAvatar';
import { MotionPressable } from '../components/Motion';
import { readNumber } from '../domain/foods';
import {
  ACTIVITY_CHOICES, FieldName, fieldIssue, GOAL_CHOICES, nextStep, previousStep,
  progressAt, resultSentence, StepId, STEPS, stepIssue, summarize,
} from '../domain/onboarding';
import { DEFAULT_PROFILE, useApp } from '../state/AppContext';
import { useExperience } from '../state/ExperienceContext';
import { colors, MAX_FONT_SCALE, radii, shadows, fonts } from '../theme';
import { Profile } from '../types';

/**
 * V1.9 — le parcours de création du profil, au premier lancement.
 *
 * Six étapes, une animation par étape, et le droit de passer à chaque instant.
 * Rien n'est enregistré tant que le dernier bouton n'est pas touché : quitter
 * en cours de route ne laisse aucune trace.
 *
 * Toutes les animations de ce fichier tournent sur le pilote JavaScript, sans
 * exception. Mélanger les deux pilotes dans une même vue animée est ce qui
 * avait cassé le lecteur de séquences en V1.8 ; la règle est désormais : un
 * fichier, un pilote.
 */

const AnimatedPath = Animated.createAnimatedComponent(Path);
const RING = 190;
const RING_RADIUS = 78;
const ARC_LENGTH = 2 * Math.PI * RING_RADIUS * 0.75;

type Props = { onDone: () => void };

export function OnboardingScreen({ onDone }: Props) {
  const { updateProfile } = useApp();
  const { reducedMotion } = useExperience();

  const [step, setStep] = useState<StepId>('welcome');
  const [goal, setGoal] = useState<Profile['goal']>('maintain');
  const [activityLevel, setActivityLevel] = useState<Profile['activityLevel']>('light');
  const [sexForFormula, setSexForFormula] = useState<Profile['sexForFormula']>('female');
  const [firstName, setFirstName] = useState('');
  const [fields, setFields] = useState({ age: '', heightCm: '', weightKg: '' });
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const scroll = useRef<ScrollView>(null);

  const draft: Profile = useMemo(() => ({
    ...DEFAULT_PROFILE,
    firstName: firstName.trim(),
    sexForFormula,
    goal,
    activityLevel,
    targetMode: 'automatic',
    age: readNumber(fields.age) ?? NaN,
    heightCm: readNumber(fields.heightCm) ?? NaN,
    weightKg: readNumber(fields.weightKg) ?? NaN,
  }), [firstName, sexForFormula, goal, activityLevel, fields]);

  const progress = progressAt(step);
  const meta = STEPS[step];
  const isResult = step === 'result';

  /* ----------------------------------------------------------- animations */

  const enter = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const bar = useRef(new Animated.Value(progress.ratio)).current;
  const glow = useRef(new Animated.Value(0)).current;

  // Entrée du contenu à chaque changement d'étape.
  useEffect(() => {
    if (reducedMotion) { enter.setValue(1); return; }
    enter.setValue(0);
    const animation = Animated.timing(enter, {
      toValue: 1, duration: 460, delay: 60, easing: Easing.out(Easing.cubic),
      useNativeDriver: false, isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [step, enter, reducedMotion]);

  // Barre d'avancement.
  useEffect(() => {
    if (reducedMotion) { bar.setValue(progress.ratio); return; }
    const animation = Animated.timing(bar, {
      toValue: progress.ratio, duration: 420, easing: Easing.out(Easing.cubic),
      useNativeDriver: false, isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [bar, progress.ratio, reducedMotion]);

  // Halos du fond : une respiration lente, très discrète.
  useEffect(() => {
    if (reducedMotion) { glow.setValue(0.5); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: false, isInteraction: false }),
      Animated.timing(glow, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: false, isInteraction: false }),
    ]));
    animation.start();
    return () => { animation.stop(); };
  }, [glow, reducedMotion]);

  const fade = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }],
  };
  const stagger = (position: number) => {
    const value = enter.interpolate({
      inputRange: [0, Math.min(0.85, 0.12 * position), Math.min(1, 0.12 * position + 0.4), 1],
      outputRange: [0, 0, 1, 1],
      extrapolate: 'clamp',
    });
    return {
      opacity: value,
      transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    };
  };

  /* -------------------------------------------------------------- actions */

  const toTop = () => scroll.current?.scrollTo({ y: 0, animated: !reducedMotion });

  /**
   * Passer ne touche à rien : ni au profil, ni au journal.
   *
   * C'est important pour le cas où ce parcours est rejoué depuis le Profil par
   * quelqu'un qui a déjà des semaines de saisie derrière lui — abandonner en
   * cours de route ne doit rien lui coûter.
   */
  const skip = () => onDone();

  const goBack = () => {
    const back = previousStep(step);
    if (!back) return;
    setError('');
    setTouched(false);
    setStep(back);
    toTop();
  };

  const advance = () => {
    const issue = stepIssue(step, draft);
    if (issue) { setTouched(true); setError(issue); toTop(); return; }
    setError('');
    setTouched(false);
    const next = nextStep(step);
    if (!next) {
      // Dernière étape : c'est ici, et seulement ici, que le profil est écrit.
      updateProfile(draft);
      onDone();
      return;
    }
    setStep(next);
    toTop();
  };

  const patchField = (field: FieldName, value: string) => {
    setFields(current => ({ ...current, [field]: value }));
    setError('');
  };

  const result = isResult ? summarize(draft) : null;
  const primaryLabel = isResult ? 'C’est parti' : step === 'welcome' ? 'Commencer' : step === 'activity' ? 'Voir mon repère' : 'Continuer';

  return (
    <View style={styles.screen}>
      <Animated.View
        pointerEvents="none"
        style={[styles.glowTop, {
          transform: [
            { translateY: glow.interpolate({ inputRange: [0, 1], outputRange: [-18, 16] }) },
            { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
          ],
        }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.glowBottom, {
          transform: [
            { translateY: glow.interpolate({ inputRange: [0, 1], outputRange: [14, -14] }) },
            { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1.1, 0.95] }) },
          ],
        }]}
      />

      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <MotionPressable
            onPress={goBack}
            disabled={step === 'welcome'}
            accessibilityRole="button"
            accessibilityLabel="Étape précédente"
            accessibilityState={{ disabled: step === 'welcome' }}
            style={[styles.round, step === 'welcome' && styles.invisible]}
          >
            <AppIcon name="chevronLeft" size={19} color={colors.inkSoft} strokeWidth={2.4} />
          </MotionPressable>

          <View
            style={styles.barWrap}
            accessible
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: progress.total, now: progress.done }}
            accessibilityLabel={`Étape ${progress.done} sur ${progress.total}`}
          >
            <View style={styles.barTrack}>
              <Animated.View style={[styles.barFill, { width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
            </View>
          </View>

          <MotionPressable onPress={skip} accessibilityRole="button" accessibilityLabel="Passer la création du profil" style={styles.skip}>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.skipText}>Passer</Text>
          </MotionPressable>
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.says}>
              <GuideAvatar size={54} animationKey={step} pose={step === 'welcome' ? 'wave' : step === 'result' ? 'nod' : 'present'} />
              <Animated.View style={[styles.bubble, fade]}>
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.bubbleText}>{meta.says}</Text>
              </Animated.View>
            </View>

            <Animated.View style={fade}>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title}>{meta.title}</Text>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.subtitle}>{meta.subtitle}</Text>
            </Animated.View>

            {step === 'welcome' && <WelcomeStep enter={enter} reducedMotion={reducedMotion} stagger={stagger} />}

            {step === 'name' && (
              <Animated.View style={[styles.block, stagger(1)]}>
                <TextInput
                  accessibilityLabel="Ton prénom, facultatif"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder=""
                  autoCapitalize="words"
                  maxLength={40}
                  style={styles.nameInput}
                  returnKeyType="next"
                  onSubmitEditing={advance}
                />
                <View style={styles.preview}>
                  <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.previewLabel}>SUR TON ACCUEIL</Text>
                  <Text maxFontSizeMultiplier={1.3} style={styles.previewValue} numberOfLines={1}>
                    Bonjour{firstName.trim() ? ` ${firstName.trim()}` : ''}
                  </Text>
                </View>
              </Animated.View>
            )}

            {step === 'goal' && (
              <View style={styles.block}>
                {GOAL_CHOICES.map((choice, position) => (
                  <Animated.View key={choice.id} style={stagger(position + 1)}>
                    <ChoiceCard
                      label={choice.label}
                      detail={choice.detail}
                      selected={goal === choice.id}
                      onPress={() => setGoal(choice.id)}
                    />
                  </Animated.View>
                ))}
              </View>
            )}

            {step === 'body' && (
              <View style={styles.block}>
                <Animated.View style={stagger(1)}>
                  <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.label}>Paramètre utilisé dans la formule</Text>
                  <View style={styles.segmented}>
                    <Segment label="Femme" active={sexForFormula === 'female'} onPress={() => setSexForFormula('female')} />
                    <Segment label="Homme" active={sexForFormula === 'male'} onPress={() => setSexForFormula('male')} />
                  </View>
                </Animated.View>
                {([
                  // V2.4 : plus d'exemples en gris dans les champs. Ils se lisaient
                  // comme des valeurs déjà saisies, et on ne savait plus ce qui
                  // venait de soi et ce qui venait de l'application.
                  { field: 'age' as FieldName, label: 'Âge', unit: 'ans' },
                  { field: 'heightCm' as FieldName, label: 'Taille', unit: 'cm' },
                  { field: 'weightKg' as FieldName, label: 'Poids', unit: 'kg' },
                ]).map((row, position) => {
                  const issue = touched ? fieldIssue(row.field, readNumber(fields[row.field])) : null;
                  return (
                    <Animated.View key={row.field} style={stagger(position + 2)}>
                      <NumberRow
                        label={row.label}
                        unit={row.unit}
                        value={fields[row.field]}
                        onChange={value => patchField(row.field, value)}
                        issue={issue}
                      />
                    </Animated.View>
                  );
                })}
              </View>
            )}

            {step === 'activity' && (
              <View style={styles.block}>
                {ACTIVITY_CHOICES.map((choice, position) => (
                  <Animated.View key={choice.id} style={stagger(position + 1)}>
                    <ChoiceCard
                      label={choice.label}
                      detail={choice.detail}
                      selected={activityLevel === choice.id}
                      onPress={() => setActivityLevel(choice.id)}
                    />
                  </Animated.View>
                ))}
              </View>
            )}

            {isResult && result && (
              <ResultStep result={result} enter={enter} stagger={stagger} reducedMotion={reducedMotion} />
            )}

            {error ? (
              <Animated.View style={fade}>
                <Text accessibilityRole="alert" maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.error}>{error}</Text>
              </Animated.View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <MotionPressable onPress={advance} accessibilityRole="button" style={[styles.primary, isResult && styles.primaryDone]}>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.primaryText}>{primaryLabel}</Text>
              <AppIcon name={isResult ? 'check' : 'chevron'} size={19} color={colors.white} strokeWidth={2.4} />
            </MotionPressable>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.footNote}>
              {isResult
                ? 'Ton profil est enregistré sur ce téléphone uniquement. Aucun compte, aucun envoi.'
                : 'Rien n’est enregistré tant que tu n’as pas terminé.'}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

/* ------------------------------------------------------------- les étapes */

/** Première étape : le logo se dessine, puis trois promesses courtes. */
function WelcomeStep({ enter, reducedMotion, stagger }: {
  enter: Animated.Value;
  reducedMotion: boolean;
  stagger: (position: number) => { opacity: Animated.AnimatedInterpolation<number>; transform: { translateY: Animated.AnimatedInterpolation<number> }[] };
}) {
  const draw = useRef(new Animated.Value(reducedMotion ? 0 : ARC_LENGTH)).current;
  useEffect(() => {
    if (reducedMotion) { draw.setValue(0); return; }
    const id = enter.addListener(({ value }) => draw.setValue(ARC_LENGTH * (1 - Math.min(1, value * 0.62))));
    return () => enter.removeListener(id);
  }, [enter, draw, reducedMotion]);

  const center = RING / 2;
  const start = { x: center + RING_RADIUS * Math.cos((135 * Math.PI) / 180), y: center + RING_RADIUS * Math.sin((135 * Math.PI) / 180) };
  const end = { x: center + RING_RADIUS * Math.cos((45 * Math.PI) / 180), y: center + RING_RADIUS * Math.sin((45 * Math.PI) / 180) };
  const arc = `M ${start.x} ${start.y} A ${RING_RADIUS} ${RING_RADIUS} 0 1 1 ${end.x} ${end.y}`;

  const promises = [
    { icon: 'target' as const, text: 'Un repère estimé, expliqué de bout en bout' },
    { icon: 'journal' as const, text: '3 339 aliments Ciqual, hors connexion' },
    { icon: 'profile' as const, text: 'Tout reste sur ton téléphone' },
  ];

  return (
    <View style={styles.block}>
      <View style={styles.markWrap}>
        <Svg width={RING} height={RING}>
          <Circle cx={center} cy={center} r={RING_RADIUS} fill="none" stroke={colors.violetEdge} strokeWidth={17} strokeLinecap="round" strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH * 2}`} transform={`rotate(135 ${center} ${center})`} />
          <AnimatedPath
            d={arc} fill="none" stroke={colors.violet} strokeWidth={17} strokeLinecap="round"
            strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`} strokeDashoffset={draw as unknown as number}
          />
          <Circle cx={center} cy={center - 42} r={11} fill={colors.aqua} />
          <Rect x={center - 44} y={center - 6} width={88} height={13} rx={6.5} fill={colors.navy} />
          <Path d={`M ${center - 36} ${center + 7} A 36 36 0 0 0 ${center + 36} ${center + 7} Z`} fill={colors.navy} />
        </Svg>
      </View>
      {promises.map((promise, position) => (
        <Animated.View key={promise.text} style={[styles.promise, stagger(position + 1)]}>
          <View style={styles.promiseIcon}><AppIcon name={promise.icon} size={17} color={colors.violet} strokeWidth={2} /></View>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.promiseText}>{promise.text}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

/** Dernière étape : l'anneau se remplit, le nombre monte, le calcul se déplie. */
function ResultStep({ result, enter, stagger, reducedMotion }: {
  result: ReturnType<typeof summarize>;
  enter: Animated.Value;
  stagger: (position: number) => { opacity: Animated.AnimatedInterpolation<number>; transform: { translateY: Animated.AnimatedInterpolation<number> }[] };
  reducedMotion: boolean;
}) {
  const fill = useRef(new Animated.Value(reducedMotion ? 0 : ARC_LENGTH)).current;
  const [shown, setShown] = useState(reducedMotion ? result.target : 0);

  useEffect(() => {
    if (reducedMotion) { fill.setValue(0); setShown(result.target); return; }
    // Un pas d'arrondi : un compteur au kcal près provoquerait des centaines
    // de rendus par seconde et ferait saccader l'animation.
    const step = Math.max(1, Math.round(result.target / 60));
    const id = enter.addListener(({ value }) => {
      const eased = Math.min(1, value);
      fill.setValue(ARC_LENGTH * (1 - eased));
      setShown(eased >= 1 ? result.target : Math.round((result.target * eased) / step) * step);
    });
    return () => enter.removeListener(id);
  }, [enter, fill, result.target, reducedMotion]);

  const center = RING / 2;
  const start = { x: center + RING_RADIUS * Math.cos((135 * Math.PI) / 180), y: center + RING_RADIUS * Math.sin((135 * Math.PI) / 180) };
  const end = { x: center + RING_RADIUS * Math.cos((45 * Math.PI) / 180), y: center + RING_RADIUS * Math.sin((45 * Math.PI) / 180) };
  const arc = `M ${start.x} ${start.y} A ${RING_RADIUS} ${RING_RADIUS} 0 1 1 ${end.x} ${end.y}`;

  if (result.issue) {
    return (
      <View style={styles.block}>
        <Text accessibilityRole="alert" maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.error}>{result.issue}</Text>
      </View>
    );
  }

  const rows = [
    { label: 'Besoins au repos estimés', value: `${result.bmr.toLocaleString('fr-FR')} kcal` },
    { label: 'Maintien estimé', value: `${result.maintenance.toLocaleString('fr-FR')} kcal` },
    {
      label: result.direction === 'deficit' ? 'Écart prévu' : result.direction === 'surplus' ? 'Apport prévu en plus' : 'Objectif de maintien',
      value: result.direction === 'maintenance' ? '—' : `${result.direction === 'deficit' ? '−' : '+'}${Math.abs(result.difference).toLocaleString('fr-FR')} kcal`,
    },
  ];

  return (
    <View style={styles.block}>
      <View style={styles.markWrap} accessible accessibilityLabel={`Ton repère alimentaire estimé : ${result.target} kilocalories par jour.`}>
        <Svg width={RING} height={RING}>
          <Circle cx={center} cy={center} r={RING_RADIUS} fill="none" stroke={colors.track} strokeWidth={17} strokeLinecap="round" strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH * 2}`} transform={`rotate(135 ${center} ${center})`} />
          <AnimatedPath
            d={arc} fill="none" stroke={colors.aqua} strokeWidth={17} strokeLinecap="round"
            strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`} strokeDashoffset={fill as unknown as number}
          />
        </Svg>
        <View style={styles.markCore} pointerEvents="none">
          <Text maxFontSizeMultiplier={1.3} style={styles.markValue}>{shown.toLocaleString('fr-FR')}</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.markUnit}>kcal par jour</Text>
        </View>
      </View>

      <Animated.View style={[styles.breakdown, stagger(2)]}>
        {rows.map((row, position) => (
          <View key={row.label} style={[styles.breakdownRow, position > 0 && styles.breakdownDivider]}>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.breakdownLabel}>{row.label}</Text>
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.breakdownValue}>{row.value}</Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View style={stagger(3)}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.resultNote}>
          {resultSentence(result.direction, result.difference)}
        </Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.resultNote}>
          Ces valeurs sont indicatives et ne remplacent pas l’avis d’un professionnel de santé. Tu pourras tout modifier dans Profil.
        </Text>
      </Animated.View>
    </View>
  );
}

/* --------------------------------------------------------------- éléments */

function ChoiceCard({ label, detail, selected, onPress }: { label: string; detail: string; selected: boolean; onPress: () => void }) {
  return (
    <MotionPressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}. ${detail}`}
      style={[styles.choice, selected && styles.choiceOn]}
    >
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected && <AppIcon name="check" size={13} color={colors.white} strokeWidth={3} />}
      </View>
      <View style={styles.choiceBody}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.choiceLabel, selected && styles.choiceLabelOn]}>{label}</Text>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.choiceDetail}>{detail}</Text>
      </View>
    </MotionPressable>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <MotionPressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      containerStyle={styles.segmentOuter}
      style={[styles.segment, active && styles.segmentOn]}
    >
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.segmentText, active && styles.segmentTextOn]}>{label}</Text>
    </MotionPressable>
  );
}

function NumberRow({ label, unit, value, onChange, issue }: {
  label: string; unit: string; value: string; onChange: (value: string) => void; issue: string | null;
}) {
  return (
    <View style={styles.numberRow}>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.label}>{label}</Text>
      <View style={[styles.numberBox, issue && styles.numberBoxError]}>
        <TextInput
          accessibilityLabel={`${label} en ${unit}`}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          maxLength={6}
          style={styles.numberInput}
        />
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.numberUnit}>{unit}</Text>
      </View>
      {issue ? <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.fieldError}>{issue}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  flex: { flex: 1 },
  safe: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  glowTop: { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: colors.violetPale, top: -130, right: -110 },
  glowBottom: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: colors.aquaPale, bottom: -120, left: -100 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  invisible: { opacity: 0 },
  barWrap: { flex: 1, paddingHorizontal: 4 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.violetEdge, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.violet },
  skip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 },
  skipText: { color: colors.muted, fontSize: 14, fontFamily: fonts.bold },

  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 26, gap: 16 },
  says: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bubble: { flex: 1, backgroundColor: colors.card, borderRadius: 18, borderBottomLeftRadius: 6, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: colors.line },
  bubbleText: { color: colors.inkSoft, fontSize: 14, lineHeight: 20, fontFamily: fonts.semibold },

  title: { color: colors.ink, fontSize: 30, lineHeight: 36, fontFamily: fonts.extrabold, letterSpacing: -0.8 },
  subtitle: { color: colors.inkSoft, fontSize: 16, fontFamily: fonts.medium, lineHeight: 23, marginTop: 8 },

  block: { gap: 10, marginTop: 4 },

  markWrap: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center', width: RING, height: RING },
  markCore: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  markValue: { color: colors.ink, fontSize: 42, lineHeight: 46, fontFamily: fonts.extrabold, letterSpacing: -1.5 },
  markUnit: { color: colors.muted, fontSize: 14, fontFamily: fonts.semibold, marginTop: 2 },

  promise: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.card, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.line, padding: 13 },
  promiseIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.violetPale, alignItems: 'center', justifyContent: 'center' },
  promiseText: { flex: 1, color: colors.inkSoft, fontSize: 14, lineHeight: 20, fontFamily: fonts.semibold },

  nameInput: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: '#C9CEDC', color: colors.ink, fontSize: 18, fontFamily: fonts.bold, paddingHorizontal: 16, paddingVertical: 15 },
  preview: { backgroundColor: colors.violetPale, borderRadius: radii.medium, padding: 14 },
  previewLabel: { color: colors.violet, fontSize: 12, fontFamily: fonts.extrabold, letterSpacing: 1.1 },
  previewValue: { color: colors.violetInk, fontSize: 24, fontFamily: fonts.extrabold, letterSpacing: -0.5, marginTop: 5 },

  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radii.medium, borderWidth: 1.5, borderColor: colors.line, padding: 15, minHeight: 68 },
  choiceOn: { borderColor: colors.violet, backgroundColor: colors.violetPale },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#C9CEDC', alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.violet, borderColor: colors.violet },
  choiceBody: { flex: 1 },
  choiceLabel: { color: colors.ink, fontSize: 16, fontFamily: fonts.bold },
  choiceLabelOn: { color: colors.violetInk, fontFamily: fonts.extrabold },
  choiceDetail: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium, lineHeight: 18, marginTop: 3 },

  label: { color: colors.muted, fontSize: 12, fontFamily: fonts.extrabold, letterSpacing: 1, marginBottom: 7 },
  segmented: { flexDirection: 'row', gap: 8 },
  segmentOuter: { flex: 1 },
  segment: { minHeight: 52, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  segmentText: { color: colors.inkSoft, fontSize: 15, fontFamily: fonts.bold },
  segmentTextOn: { color: colors.white },

  numberRow: { marginTop: 4 },
  numberBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1.5, borderColor: '#C9CEDC', paddingHorizontal: 14 },
  numberBoxError: { borderColor: colors.coral },
  numberInput: { flex: 1, color: colors.ink, fontSize: 20, fontFamily: fonts.extrabold, paddingVertical: 13 },
  numberUnit: { color: colors.muted, fontSize: 14, fontFamily: fonts.bold },
  fieldError: { color: colors.coral, fontSize: 13, fontFamily: fonts.medium, lineHeight: 18, marginTop: 6 },

  breakdown: { backgroundColor: colors.card, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, ...shadows.card },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 14 },
  breakdownDivider: { borderTopWidth: 1, borderTopColor: colors.track },
  breakdownLabel: { flex: 1, color: colors.inkSoft, fontSize: 14, lineHeight: 20, fontFamily: fonts.semibold },
  breakdownValue: { color: colors.ink, fontSize: 16, fontFamily: fonts.extrabold },
  resultNote: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium, lineHeight: 19, marginTop: 8 },

  error: { color: '#8E241D', backgroundColor: colors.coralPale, borderRadius: 14, padding: 14, fontSize: 14, lineHeight: 20, fontFamily: fonts.semibold },

  footer: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12, gap: 8 },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, minHeight: 58, borderRadius: 18, backgroundColor: colors.violet, ...shadows.raised },
  primaryDone: { backgroundColor: colors.aqua, shadowColor: colors.aqua },
  primaryText: { color: colors.white, fontSize: 17, fontFamily: fonts.extrabold },
  footNote: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium, lineHeight: 17, textAlign: 'center' },
});
