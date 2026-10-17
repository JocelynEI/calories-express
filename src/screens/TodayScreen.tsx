import React, { ReactNode, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CalorieGauge } from '../components/CalorieGauge';
import { AppIcon } from '../components/AppIcon';
import { GuideCard } from '../components/GuideCard';
import { MomentMeals } from '../components/MomentMeals';
import { PastDayBanner } from '../components/DayNavigator';
import { longDay, WeekStrip } from '../components/WeekStrip';
import { macroTargets } from '../domain/calories';
import { useApp } from '../state/AppContext';
import { colors, fonts, MAX_FONT_SCALE, radii, shadows, typeScale } from '../theme';
import { Entrance, MotionPressable } from '../components/Motion';
import { greeting } from '../domain/experience';
import { EnergyPlanCard } from '../components/EnergyEducation';
import { dailyEnergyPlan } from '../domain/activity-energy';
import { frequentMeals, mealsByMoment, mealsForDay, momentForHour, plateSegments, repeatMeal, templateLabel, totalCalories, totalMacros } from '../domain/meals';
import { dayPraise, mealStreak, streakPraise } from '../domain/praise';
import { PraiseCard } from '../components/PraiseCard';
import { Story } from '../domain/stories';
import { GOAL_LABELS, GoalPicker } from '../components/GoalPicker';
import { Meal, MealMoment } from '../types';

type Props = {
  /** Chercher un aliment, au moment de l'heure. */
  onAdd: () => void;
  /** V4.0 — ajouter à un moment précis, depuis le + de sa ligne. */
  onAddFor: (moment: MealMoment) => void;
  /** V4.0 — ouvrir directement la lecture d'étiquette. */
  onScan: () => void;
  onEditMeal: (meal: Meal) => void;
  onProfile: () => void;
  onActivity: () => void;
  onPlayStory: (story: Story) => void;
  /** V4.0 — le conseil de Jaws, posé dans le fil plutôt que par-dessus. */
  coachTip?: ReactNode;
};

/**
 * V4.0 — l'accueil en cartes.
 *
 * De haut en bas : la semaine, l'assiette du jour (ce qu'il reste au centre,
 * chaque repas en couleur sur le bord), le scan d'étiquette — le geste qui
 * distingue l'application —, chercher un aliment ou ajouter une activité, puis
 * les repas rangés par moment, chacun avec son +.
 *
 * Ce qui a disparu de la V3.5 : les flèches « ‹ Aujourd'hui › » (remplacées par
 * la semaine), les deux boutons « Un repas / Une activité » (remplacés par le
 * scan et deux tuiles), « Dans ton assiette » (remplacé par les moments). Rien
 * de ce qu'ils permettaient n'a été perdu.
 */
export function TodayScreen({ onAdd, onAddFor, onScan, onEditMeal, onProfile, onActivity, coachTip }: Props) {
  const { profile, meals, activity, today, selectedDay, isDemo, profileCompleted, startFresh, addMeal } = useApp();
  const [goalOpen, setGoalOpen] = useState(false);
  const [explain, setExplain] = useState(false);

  const dayMeals = useMemo(() => mealsForDay(meals, selectedDay), [meals, selectedDay]);
  const groups = useMemo(() => mealsByMoment(dayMeals), [dayMeals]);
  const consumed = totalCalories(dayMeals);
  const macros = totalMacros(dayMeals);
  const templates = useMemo(() => frequentMeals(meals, selectedDay), [meals, selectedDay]);

  const plan = dailyEnergyPlan(profile, activity, selectedDay, profileCompleted);
  const { target, issue } = plan;
  const targets = macroTargets(profile, target);
  const segments = useMemo(() => plateSegments(groups, target), [groups, target]);
  const partialMacros = dayMeals.some(meal => meal.items.some(item => item.macrosComplete === false));
  const remaining = target - consumed;
  const isToday = selectedDay === today;

  // V2.8 — les félicitations. Le domaine décide s'il y a quelque chose à
  // saluer ; quand il renvoie `null`, rien ne s'affiche, et c'est voulu :
  // l'absence de carte n'est jamais un reproche.
  const dayWell = dayPraise({
    meals: dayMeals,
    consumed,
    target,
    protein: macros.protein,
    proteinTarget: targets.protein,
    hasProfile: profileCompleted && !issue,
    activeMinutes: plan.activity.minutes,
    day: selectedDay,
    today,
  });
  /**
   * Le détail de la ligne d'activité. Les pas et les séances y sont
   * ensemble : c'est le même mouvement pour celui qui l'a fait.
   */
  const activityDetail = plan.activity.report
    ? `Total de ${plan.activity.report.deviceName}`
    : [
      plan.activity.steps === null ? 'Pas à renseigner' : `${plan.activity.steps.toLocaleString('fr-FR')} pas`,
      plan.activity.sessions.length > 0 ? `${plan.activity.sessions.length} séance${plan.activity.sessions.length > 1 ? 's' : ''}` : '',
    ].filter(Boolean).join(', ');

  const regularity = isToday ? streakPraise(mealStreak(meals, today)) : null;
  // Une seule carte à la fois. Deux félicitations l'une sous l'autre, c'est
  // une de trop : le palier de régularité, plus rare, passe devant.
  const praise = regularity ?? dayWell;

  // L'état de la journée reste descriptif : au-dessus de l'objectif n'est pas
  // une faute, et l'application ne propose jamais de compenser.
  const needsSetup = isDemo || !profileCompleted || Boolean(issue);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.date} numberOfLines={1}>{longDay(selectedDay)}</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title} numberOfLines={1} accessibilityRole="header">{greeting(profile.firstName)}</Text>
        </View>
        <MotionPressable onPress={onProfile} accessibilityRole="button" accessibilityLabel="Ouvrir mon profil" style={styles.avatar}>
          <Text maxFontSizeMultiplier={1.2} style={styles.avatarText}>{profile.firstName ? profile.firstName.charAt(0).toUpperCase() : 'CE'}</Text>
        </MotionPressable>
      </View>

      <WeekStrip />
      <PastDayBanner />

      {needsSetup && (
        <GuideCard
          message={isDemo
            ? 'Je te montre une journée exemple. Quand tu es prêt, créons ton propre objectif.'
            : issue
              ? 'Ton ancien objectif doit être vérifié. Ouvre le profil pour contrôler les informations et enregistrer un objectif adapté.'
              : 'Ton profil n’est pas encore enregistré. Quelques informations suffisent pour personnaliser ton assiette.'}
          actionLabel={issue ? 'Vérifier mon profil' : 'Créer mon profil'}
          onAction={() => { if (isDemo) startFresh(); onProfile(); }}
        />
      )}

      {/* L'assiette du jour. Quand l'objectif est à vérifier, elle n'aurait rien
          à montrer : la carte de Jaws, juste au-dessus, dit déjà quoi faire. */}
      {!issue && (
      <>
        <Entrance delay={60} style={styles.plate}>
          <View style={styles.plateTop}>
            <MotionPressable
              onPress={() => (profileCompleted ? setGoalOpen(true) : onProfile())}
              accessibilityRole="button"
              accessibilityLabel={`Changer mon objectif, actuellement ${profileCompleted ? GOAL_LABELS[profile.goal] : 'non personnalisé'}`}
              style={styles.goalChip}
            >
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.goalChipText}>{profileCompleted ? GOAL_LABELS[profile.goal] : 'Personnaliser'}</Text>
              <AppIcon name="chevron" size={14} color={colors.violet} strokeWidth={2.4} />
            </MotionPressable>
            <MotionPressable
              onPress={() => setExplain(value => !value)}
              accessibilityRole="button"
              accessibilityLabel={explain ? 'Masquer le calcul de l’objectif' : 'Comment cet objectif est calculé'}
              accessibilityState={{ expanded: explain }}
              style={styles.infoButton}
            >
              <AppIcon name="info" size={18} color={colors.inkSoft} strokeWidth={2} />
            </MotionPressable>
          </View>

          <CalorieGauge consumed={consumed} target={target} segments={segments} />

          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.reference}>
            {consumed.toLocaleString('fr-FR')} kcal mangées sur {target.toLocaleString('fr-FR')}
            {isDemo || !profileCompleted ? ' (exemple)' : ''}
            {plan.dynamic && plan.creditedKcal > 0 ? `, dont +${plan.creditedKcal.toLocaleString('fr-FR')} gagnées en bougeant` : ''}
          </Text>

          <View style={styles.macros}>
            <Macro label="Protéines" value={macros.protein} target={targets.protein} color={colors.protein} partial={partialMacros} />
            <Macro label="Glucides" value={macros.carbs} target={targets.carbs} color={colors.carbs} partial={partialMacros} />
            <Macro label="Lipides" value={macros.fat} target={targets.fat} color={colors.fat} partial={partialMacros} />
          </View>

          {partialMacros && (
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.note}>
              Bilan partiel : certains aliments n’ont pas tous leurs macronutriments. Les valeurs manquantes ne sont pas comptées comme zéro.
            </Text>
          )}

          {profileCompleted && remaining < 0 && (
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.note}>
              {plan.direction === 'deficit' && consumed < plan.maintenance
                ? 'Ton total dépasse l’objectif, mais reste sous ton maintien estimé. Ce bilan est provisoire tant que la journée n’est pas complète.'
                : 'Ton total dépasse l’objectif. Observe plusieurs journées complètes et garde des repas réguliers, sans compensation.'}
            </Text>
          )}
        </Entrance>

      {explain && (
        <Entrance style={styles.explain}>
          {plan.dynamic && profileCompleted && (
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.explainLine}>
              Base {plan.baseTarget.toLocaleString('fr-FR')} + activité {plan.creditedKcal.toLocaleString('fr-FR')} = {target.toLocaleString('fr-FR')} kcal
            </Text>
          )}
          <EnergyPlanCard profile={profile} />
        </Entrance>
      )}
      </>
      )}

      {coachTip}

      {/* Le geste qui distingue l'application : lire l'étiquette d'un paquet.
          Il est le plus visible de l'écran, et le plus court. */}
      <MotionPressable onPress={onScan} accessibilityRole="button" accessibilityLabel="Scanner une étiquette" style={styles.scan}>
        <View style={styles.scanIcon}><ScanIcon /></View>
        <View style={styles.scanText}>
          <Text maxFontSizeMultiplier={1.4} style={styles.scanTitle}>Scanner une étiquette</Text>
          <Text maxFontSizeMultiplier={1.4} style={styles.scanCopy}>Les kcal se remplissent seules</Text>
        </View>
        <AppIcon name="chevron" size={20} color={colors.onDarkMuted} strokeWidth={2.4} />
      </MotionPressable>

      <View style={styles.tiles}>
        <MotionPressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Chercher un aliment"
          containerStyle={styles.tileOuter}
          style={styles.tile}
        >
          <View style={[styles.tileIcon, { backgroundColor: colors.violetPale }]}><AppIcon name="search" size={20} color={colors.violet} strokeWidth={2.2} /></View>
          <Text maxFontSizeMultiplier={1.4} style={styles.tileText}>Chercher un aliment</Text>
        </MotionPressable>
        <MotionPressable
          onPress={onActivity}
          accessibilityRole="button"
          accessibilityLabel="Ajouter une activité"
          containerStyle={styles.tileOuter}
          style={styles.tile}
        >
          <View style={[styles.tileIcon, { backgroundColor: colors.mintPale }]}><AppIcon name="steps" size={20} color={colors.mintInk} strokeWidth={2} /></View>
          <Text maxFontSizeMultiplier={1.4} style={styles.tileText}>Ajouter une activité</Text>
        </MotionPressable>
      </View>

      {/* V4.3 — « Ajouter une activité » ouvre la page Activités : on y choisit
          sa tuile, sa durée, et on voit le chiffre monter, sans repasser par
          « Ton activité ». */}

      {/* Ce qu'on a bougé : les pas et les séances ensemble, et un appui ouvre
          le détail (pas, séances, kcal de la montre). */}
      <MotionPressable
        onPress={onActivity}
        accessibilityRole="button"
        accessibilityLabel={`Ouvrir mon activité : ${plan.activity.activeKcal} kilocalories dépensées, ${activityDetail || 'rien de noté'}`}
        style={styles.moved}
      >
        <View style={styles.movedText}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.movedLabel}>Ton activité</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.movedDetail} numberOfLines={1}>{activityDetail || 'Rien de noté pour l’instant'}</Text>
        </View>
        <Text maxFontSizeMultiplier={1.3} style={styles.movedValue}>
          {plan.activity.activeKcal.toLocaleString('fr-FR')} <Text style={styles.movedUnit}>kcal</Text>
        </Text>
        <AppIcon name="chevron" size={16} color={colors.muted} strokeWidth={2.2} />
      </MotionPressable>

      {plan.activity.partial && (
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.activityWarn}>Bilan partiel : des kcal actives restent à compléter.</Text>
      )}

      <MomentMeals
        groups={groups}
        total={consumed}
        suggested={isToday ? momentForHour(new Date().getHours()) : null}
        onAddFor={onAddFor}
        onEdit={onEditMeal}
      />

      {templates.length > 0 && (
        <View style={styles.repeat}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.repeatHeading}>Refaire un repas habituel</Text>
          <View style={styles.repeatRow}>
            {templates.map(template => (
              <MotionPressable
                key={template.meal.id}
                onPress={() => addMeal(repeatMeal(template.meal, selectedDay))}
                accessibilityRole="button"
                accessibilityLabel={`Refaire ${template.meal.description}, ${template.meal.calories.estimated} kilocalories`}
                containerStyle={styles.repeatOuter}
                style={styles.repeatChip}
              >
                <AppIcon name="repeat" size={15} color={colors.violet} strokeWidth={2.2} />
                <View style={styles.repeatBody}>
                  <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.repeatTitle} numberOfLines={1}>{template.meal.description}</Text>
                  <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.repeatMeta}>{templateLabel(template)}</Text>
                </View>
              </MotionPressable>
            ))}
          </View>
        </View>
      )}

      {praise ? <PraiseCard praise={praise} tone={praise === regularity ? 'mint' : 'violet'} /> : null}

      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.legal}>
        Valeurs indicatives, qui ne remplacent pas l’avis d’un professionnel de santé.
      </Text>

      {goalOpen && <GoalPicker onClose={() => setGoalOpen(false)} />}
    </ScrollView>
  );
}

/** Un cadre de visée autour de lignes de texte : l'étiquette qu'on photographie. */
function ScanIcon() {
  const common = { fill: 'none', stroke: colors.white, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" {...common} />
      <Path d="M8 9h8M8 12h8M8 15h5" {...common} />
    </Svg>
  );
}

function Macro({ label, value, target, color, partial }: { label: string; value: number; target: number; color: string; partial: boolean }) {
  const ratio = target > 0 ? Math.min(1, value / target) : 0;
  const shown = partial && value === 0 ? '—' : Math.round(value);
  return (
    <View style={styles.macro}>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroTrack}><View style={[styles.macroFill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: color }]} /></View>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.macroValue}>
        {shown} <Text style={styles.macroTarget}>/ {target} g</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 34, gap: 16 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headerText: { flexShrink: 1, minWidth: 0 },
  date: { color: colors.muted, fontSize: 14, lineHeight: 19, fontFamily: fonts.medium },
  title: { color: colors.ink, ...typeScale.display },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 17, fontFamily: fonts.display },

  plate: { gap: 14, backgroundColor: colors.card, borderRadius: 28, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18, ...shadows.card },
  plateTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  goalChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.violetPale, paddingLeft: 14, paddingRight: 10, minHeight: 40, borderRadius: radii.pill },
  goalChipText: { color: colors.violet, fontSize: 13, fontFamily: fonts.extrabold },
  infoButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },

  reference: { color: colors.muted, textAlign: 'center', fontSize: 14, lineHeight: 20, fontFamily: fonts.medium },

  macros: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14 },
  macro: { flex: 1, gap: 6 },
  macroLabel: { color: colors.muted, ...typeScale.caption },
  macroValue: { color: colors.ink, fontSize: 13, lineHeight: 18, fontFamily: fonts.bold },
  macroTarget: { color: colors.muted, fontSize: 12, fontFamily: fonts.semibold },
  macroTrack: { height: 6, borderRadius: radii.pill, backgroundColor: colors.track, overflow: 'hidden' },
  macroFill: { height: 6, borderRadius: radii.pill },

  note: { color: colors.inkSoft, fontSize: 13, fontFamily: fonts.medium, lineHeight: 19 },

  explain: { gap: 8 },
  explainLine: { color: colors.violet, fontSize: 14, fontFamily: fonts.extrabold },

  scan: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 86, backgroundColor: colors.navy, borderRadius: 26, paddingHorizontal: 18, paddingVertical: 16 },
  scanIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  scanText: { flex: 1, minWidth: 0, gap: 2 },
  scanTitle: { color: colors.white, fontSize: 19, lineHeight: 24, fontFamily: fonts.display },
  scanCopy: { color: colors.onDarkMuted, fontSize: 14, lineHeight: 19, fontFamily: fonts.medium },

  tiles: { flexDirection: 'row', gap: 12 },
  tileOuter: { flex: 1 },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, backgroundColor: colors.card, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 12 },
  tileIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileText: { flex: 1, color: colors.ink, fontSize: 15, lineHeight: 19, fontFamily: fonts.semibold },

  moved: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, backgroundColor: colors.card, borderRadius: radii.large, paddingHorizontal: 16, paddingVertical: 10 },
  movedText: { flex: 1, minWidth: 0 },
  movedLabel: { color: colors.mintInk, fontSize: 13, lineHeight: 18, fontFamily: fonts.bold },
  movedDetail: { color: colors.muted, ...typeScale.caption },
  movedValue: { color: colors.ink, fontSize: 18, lineHeight: 24, fontFamily: fonts.extrabold },
  movedUnit: { color: colors.muted, fontSize: 13, fontFamily: fonts.semibold },

  activityWarn: { color: colors.goldText, fontSize: 12, fontFamily: fonts.bold },

  repeat: { gap: 8 },
  repeatHeading: { color: colors.inkSoft, fontSize: 14, fontFamily: fonts.bold, paddingHorizontal: 4 },
  repeatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  repeatOuter: { flexGrow: 1, flexBasis: 150 },
  repeatChip: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, borderRadius: radii.medium, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 8 },
  repeatBody: { flex: 1, minWidth: 0 },
  repeatTitle: { color: colors.ink, fontSize: 13, fontFamily: fonts.bold },
  repeatMeta: { color: colors.muted, fontSize: 12, fontFamily: fonts.semibold, marginTop: 2 },

  legal: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium, lineHeight: 17, textAlign: 'center', marginTop: 4 },
});
