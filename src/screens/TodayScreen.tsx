import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalorieGauge } from '../components/CalorieGauge';
import { AppIcon, IconName } from '../components/AppIcon';
import { SectionHeader } from '../components/SectionHeader';
import { FoodName } from '../data/illustrations';
import { GuideCard } from '../components/GuideCard';
import { MealCard } from '../components/MealCard';
import { DayNavigator, PastDayBanner } from '../components/DayNavigator';
import { FoodMotion } from '../components/FoodMotion';
import { macroTargets } from '../domain/calories';
import { useApp } from '../state/AppContext';
import { colors, fonts, MAX_FONT_SCALE, radii, shadows, typeScale } from '../theme';
import { Entrance, MotionPressable } from '../components/Motion';
import { greeting } from '../domain/experience';
import { EnergyPlanCard } from '../components/EnergyEducation';
import { PremiumDayVisual } from '../components/PremiumDayVisual';
import { dailyEnergyPlan } from '../domain/activity-energy';
import { frequentMeals, mealsForDay, repeatMeal, templateLabel, totalCalories, totalMacros } from '../domain/meals';
import { dayPraise, mealStreak, streakPraise } from '../domain/praise';
import { QuickActivity } from '../components/QuickActivity';
import { PraiseCard } from '../components/PraiseCard';
import { Story } from '../domain/stories';
import { GOAL_LABELS, GoalPicker } from '../components/GoalPicker';
import { Meal } from '../types';

type Props = {
  onAdd: () => void;
  onEditMeal: (meal: Meal) => void;
  onProfile: () => void;
  onActivity: () => void;
  onPlayStory: (story: Story) => void;
};

export function TodayScreen({ onAdd, onEditMeal, onProfile, onActivity, onPlayStory }: Props) {
  const { profile, meals, activity, today, selectedDay, isDemo, profileCompleted, startFresh, addMeal } = useApp();
  const [goalOpen, setGoalOpen] = useState(false);
  const [explain, setExplain] = useState(false);

  const dayMeals = useMemo(() => mealsForDay(meals, selectedDay), [meals, selectedDay]);
  const consumed = totalCalories(dayMeals);
  const macros = totalMacros(dayMeals);
  const templates = useMemo(() => frequentMeals(meals, selectedDay), [meals, selectedDay]);

  const plan = dailyEnergyPlan(profile, activity, selectedDay, profileCompleted);
  const { target, issue } = plan;
  const targets = macroTargets(profile, target);
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
  const regularity = isToday ? streakPraise(mealStreak(meals, today)) : null;
  // Une seule carte à la fois. Deux félicitations l'une sous l'autre, c'est
  // une de trop : le palier de régularité, plus rare, passe devant.
  const praise = regularity ?? dayWell;

  // L'état de la journée reste descriptif : au-dessus du repère n'est pas une
  // faute, et l'application ne propose jamais de compenser.
  const needsSetup = isDemo || !profileCompleted || Boolean(issue);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.title} numberOfLines={1}>{greeting(profile.firstName)}</Text>
          <DayNavigator />
        </View>
        <MotionPressable onPress={onProfile} accessibilityRole="button" accessibilityLabel="Ouvrir mon profil" style={styles.avatar}>
          <Text maxFontSizeMultiplier={1.2} style={styles.avatarText}>{profile.firstName ? profile.firstName.charAt(0).toUpperCase() : 'CE'}</Text>
        </MotionPressable>
      </View>

      <PastDayBanner />

      {needsSetup && (
        <View style={styles.guideWrap}>
          <GuideCard
            message={isDemo
              ? 'Je te montre une journée exemple. Quand tu es prêt, créons ton propre repère calorique.'
              : issue
                ? 'Ton ancien repère doit être vérifié. Ouvre le profil pour contrôler les informations et enregistrer un objectif adapté.'
                : 'Ton profil n’est pas encore enregistré. Quelques informations suffisent pour personnaliser le baromètre.'}
            actionLabel={issue ? 'Vérifier mon profil' : 'Créer mon profil'}
            onAction={() => { if (isDemo) startFresh(); onProfile(); }}
          />
        </View>
      )}

      {/* V2.4 — trois blocs, trois sujets.
          L'accueil empilait une dizaine de cartes sans lien : le baromètre, un
          bouton, des repas, l'activité, des séquences vidéo, un conseil, une
          frise d'aliments. Tout était utile, rien n'était rangé. Chaque bloc
          porte désormais un titre et ne parle que d'une chose. Les séquences
          ont rejoint la Progression, où on vient pour comprendre. */}

      {/* Quand le repère est à vérifier, ce bloc n'aurait rien à montrer :
          mieux vaut pas de titre qu'un titre au-dessus du vide. La carte de
          Jaws, juste au-dessus, dit déjà quoi faire. */}
      {!issue && (
      <Section icon="target" tone={colors.violet} pale={colors.violetPale} art="pomme" title="Ma journée">
        <Entrance delay={60} style={styles.hero}>
          <PremiumDayVisual
            goalLabel={profileCompleted ? GOAL_LABELS[profile.goal] : 'À personnaliser'}
            target={profileCompleted ? target : undefined}
          />
          <View style={styles.heroTop}>
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
              accessibilityLabel={explain ? 'Masquer le calcul du repère' : 'Comment ce repère est calculé'}
              accessibilityState={{ expanded: explain }}
              style={styles.infoButton}
            >
              <AppIcon name="info" size={18} color={colors.inkSoft} strokeWidth={2} />
            </MotionPressable>
          </View>

          <CalorieGauge consumed={consumed} target={target} />

          <View style={styles.stats}>
            {/* V2.7 : le consommé est au centre de la jauge ; ici, ce qu'il reste. */}
            <Stat
              label={remaining < 0 ? 'Au-dessus' : 'Restant'}
              value={Math.abs(remaining).toLocaleString('fr-FR')}
              tone={remaining < 0 ? colors.warmInk : colors.ink}
            />
            <View style={styles.statDivider} />
            <Stat label={isDemo || !profileCompleted ? 'Exemple' : 'Repère'} value={target.toLocaleString('fr-FR')} />
            <View style={styles.statDivider} />
            <Stat
              label="Activité"
              value={plan.dynamic && plan.creditedKcal > 0 ? `+${plan.creditedKcal.toLocaleString('fr-FR')}` : plan.activity.hasEnergy ? plan.activity.activeKcal.toLocaleString('fr-FR') : '—'}
              tone={plan.dynamic && plan.creditedKcal > 0 ? colors.aqua : colors.ink}
            />
          </View>

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
                ? 'Ton total saisi dépasse l’objectif alimentaire, mais reste sous le maintien estimé. Ce bilan est provisoire tant que la journée n’est pas complète.'
                : 'Ton total saisi dépasse le repère. Observe plusieurs journées complètes et garde des repas réguliers, sans compensation.'}
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
      </Section>
      )}

      <Section icon="journal" tone={colors.aqua} pale={colors.aquaPale} art="assiette" title="Mes repas" meta={`${dayMeals.length} ${dayMeals.length > 1 ? 'entrées' : 'entrée'} · ${consumed.toLocaleString('fr-FR')} kcal`}>
      <MotionPressable onPress={onAdd} accessibilityRole="button" style={styles.primary}>
        <AppIcon name="plus" size={21} color={colors.white} strokeWidth={2.6} />
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.primaryText}>Ajouter un repas</Text>
      </MotionPressable>
      {templates.length > 0 && (
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
      )}
      <View style={styles.meals}>
        {dayMeals.slice(0, 3).map(meal => (
          <MealCard key={meal.id} meal={meal} compact onEdit={() => onEditMeal(meal)} />
        ))}
        {dayMeals.length === 0 && (
          <MotionPressable onPress={onAdd} accessibilityRole="button" style={styles.empty}>
            <View style={styles.emptyArt}>
              <FoodMotion kind="orbit" size={30} height={104} width={150} />
            </View>
            <View style={styles.emptyBody}>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.emptyTitle}>
                {isToday ? 'Aucun repas pour l’instant' : 'Rien n’a été saisi ce jour-là'}
              </Text>
              <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.emptyCopy}>Une phrase et une quantité suffisent pour commencer.</Text>
              <View style={styles.emptyCta}>
                <AppIcon name="plus" size={16} color={colors.violet} strokeWidth={2.6} />
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.emptyCtaText}>Ajouter un repas</Text>
              </View>
            </View>
          </MotionPressable>
        )}
      </View>
        {praise ? <PraiseCard praise={praise} tone={praise === regularity ? 'mint' : 'violet'} /> : null}
      </Section>

      <Section icon="steps" tone={colors.gold} pale={colors.goldPale} art="banane" title="Mon activité">
        <QuickActivity day={selectedDay} onProfile={onProfile} onDetails={onActivity} />
      <MotionPressable
        onPress={onActivity}
        accessibilityRole="button"
        accessibilityLabel="Ouvrir mon activité, mes pas et mes séances"
        style={styles.activity}
      >
        <View style={styles.activityIcon}><AppIcon name="steps" size={21} color={colors.aqua} strokeWidth={1.9} /></View>
        <View style={styles.activityBody}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.activityTitle}>
            {plan.activity.steps === null ? 'Pas à renseigner' : `${plan.activity.steps.toLocaleString('fr-FR')} pas`}
            {plan.activity.sessions.length > 0 ? ` · ${plan.activity.sessions.length} séance${plan.activity.sessions.length > 1 ? 's' : ''}` : ''}
          </Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.activityMeta}>
            {plan.activity.report
              ? `Total de ${plan.activity.report.deviceName} · ${plan.activity.activeKcal.toLocaleString('fr-FR')} kcal actives`
              : plan.activity.hasEnergy
                ? `≈ ${plan.activity.activeKcal.toLocaleString('fr-FR')} kcal actives${plan.dynamic && plan.creditedKcal > 0 ? ` · +${plan.creditedKcal.toLocaleString('fr-FR')} sur ton repère` : ''}`
                : 'Ajouter une séance ou les kcal de ma montre'}
          </Text>
          {plan.activity.partial && (
            <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.activityWarn}>Bilan partiel : des kcal restent à compléter.</Text>
          )}
        </View>
        <AppIcon name="chevron" size={20} color={colors.muted} strokeWidth={2.2} />
      </MotionPressable>
      </Section>

      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.legal}>
        Valeurs indicatives · ne remplacent pas l’avis d’un professionnel de santé.
      </Text>

      {goalOpen && <GoalPicker onClose={() => setGoalOpen(false)} />}
    </ScrollView>
  );
}

/**
 * Un bloc thématique : une pastille de couleur, un titre, un chiffre-clé
 * facultatif, et le contenu en dessous. Le même gabarit partout donne à la
 * page un rythme régulier — c'est ce qui la rend lisible bien plus que le
 * nombre d'informations qu'elle contient.
 */
function Section({ icon, tone, pale, title, meta, art, children }: {
  icon: IconName; tone: string; pale: string; title: string; meta?: string; art?: FoodName; children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <SectionHeader icon={icon} tone={tone} pale={pale} title={title} meta={meta} art={art} />
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Stat({ label, value, tone = colors.ink }: { label: string; value: string; tone?: string }) {
  return (
    <View style={styles.stat}>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.statLabel}>{label}</Text>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.statValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

function Macro({ label, value, target, color, partial }: { label: string; value: number; target: number; color: string; partial: boolean }) {
  const ratio = target > 0 ? Math.min(1, value / target) : 0;
  const shown = partial && value === 0 ? '—' : Math.round(value);
  return (
    <View style={styles.macro}>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.macroValue}>
        {shown} <Text style={styles.macroTarget}>/ {target} g</Text>
      </Text>
      <View style={styles.macroTrack}><View style={[styles.macroFill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: color }]} /></View>
      <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 34, gap: 14 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headerText: { flexShrink: 1, minWidth: 0 },
  title: { color: colors.ink, ...typeScale.display },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 15, fontFamily: fonts.extrabold },

  guideWrap: { marginTop: 2 },

  hero: { backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 14, ...shadows.card },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  goalChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.purplePale, paddingLeft: 14, paddingRight: 10, paddingVertical: 9, borderRadius: radii.pill },
  goalChipText: { color: colors.violet, fontSize: 13, fontFamily: fonts.extrabold },
  infoButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },

  stats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.track, paddingTop: 12 },
  stat: { flex: 1, gap: 2, paddingHorizontal: 2 },
  statDivider: { width: 1, backgroundColor: colors.track, marginHorizontal: 8 },
  statLabel: { color: colors.muted, ...typeScale.caption },
  statValue: { fontSize: 18, lineHeight: 24, fontFamily: fonts.extrabold, letterSpacing: -0.3 },

  macros: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: colors.track, paddingTop: 12 },
  macro: { flex: 1, gap: 6 },
  macroValue: { color: colors.ink, fontSize: 14, lineHeight: 20, fontFamily: fonts.bold },
  macroTarget: { color: colors.muted, fontSize: 12, fontFamily: fonts.semibold },
  macroTrack: { height: 6, borderRadius: radii.pill, backgroundColor: colors.track, overflow: 'hidden' },
  macroFill: { height: 6, borderRadius: radii.pill },
  macroLabel: { color: colors.muted, ...typeScale.caption },

  note: { color: colors.inkSoft, fontSize: 13, fontFamily: fonts.medium, lineHeight: 19, borderTopWidth: 1, borderTopColor: colors.track, paddingTop: 11 },

  explain: { gap: 8 },
  explainLine: { color: colors.violet, fontSize: 14, fontFamily: fonts.extrabold },

  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 56, borderRadius: radii.large, backgroundColor: colors.violet, ...shadows.raised },
  primaryText: { color: colors.white, fontSize: 16, lineHeight: 22, fontFamily: fonts.bold },

  repeatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  repeatOuter: { flexGrow: 1, flexBasis: 150 },
  repeatChip: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 8 },
  repeatBody: { flex: 1, minWidth: 0 },
  repeatTitle: { color: colors.ink, fontSize: 13, fontFamily: fonts.bold },
  repeatMeta: { color: colors.muted, fontSize: 12, fontFamily: fonts.semibold, marginTop: 2 },

  section: { gap: 10, marginTop: 4 },
  sectionBody: { gap: 12 },

  meals: { gap: 8 },
  empty: { alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 20 },
  emptyArt: { height: 104, justifyContent: 'center' },
  emptyBody: { alignItems: 'center', gap: 4 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontFamily: fonts.extrabold, textAlign: 'center' },
  emptyCopy: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium, lineHeight: 18, textAlign: 'center' },
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: colors.violetPale, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 9 },
  emptyCtaText: { color: colors.violet, fontSize: 14, fontFamily: fonts.extrabold },

  activity: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, padding: 14 },
  activityIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.aquaPale, alignItems: 'center', justifyContent: 'center' },
  activityBody: { flex: 1, minWidth: 0 },
  activityTitle: { color: colors.ink, fontSize: 15, fontFamily: fonts.bold },
  activityMeta: { color: colors.aqua, fontSize: 13, fontFamily: fonts.bold, marginTop: 3, lineHeight: 18 },
  activityWarn: { color: colors.goldText, fontSize: 12, fontFamily: fonts.bold, marginTop: 3 },


  legal: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium, lineHeight: 17, textAlign: 'center', marginTop: 4 },
});
