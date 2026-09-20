import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { AppIcon } from '../components/AppIcon';
import { GuideAvatar } from '../components/GuideAvatar';
import { GuideCard } from '../components/GuideCard';
import { calculateBmr } from '../domain/calories';
import { useApp } from '../state/AppContext';
import { colors, radii } from '../theme';
import { ActivityLevel, Goal, Profile, SexForFormula } from '../types';
import { useExperience } from '../state/ExperienceContext';
import { Entrance, MotionPressable } from '../components/Motion';
import { EnergyPlanCard } from '../components/EnergyEducation';
import { dailyEnergyPlan } from '../domain/activity-energy';
import { ActivityBudgetControls } from '../components/ActivityBudgetControls';
import appConfig from '../../app.json';
import { MAX_FONT_SCALE } from '../theme';

const goals: { id: Goal; label: string; detail: string }[] = [
  { id: 'maintain', label: 'Maintien', detail: 'Équilibre' },
  { id: 'lose', label: 'Perte progressive', detail: 'À personnaliser' },
  { id: 'gain', label: 'Prise progressive', detail: 'À personnaliser' },
];

const activityLevels: { id: ActivityLevel; label: string }[] = [
  { id: 'sedentary', label: 'Sédentaire' }, { id: 'light', label: 'Léger' }, { id: 'moderate', label: 'Modéré' }, { id: 'active', label: 'Actif' },
];

// V2.4 : les minutes de Jaws ne vivent plus qu'à un seul endroit — la
// Progression. Elles figuraient ici, sur l'accueil et sur la progression.
export function ProfileScreen({ onReplayWelcome, onReplayOnboarding }: { onReplayWelcome: () => void; onReplayOnboarding: () => void }) {
  const { settings, setSetting, reducedMotion, motionExplanation } = useExperience();
  const { profile, activity, today, profileCompleted, updateProfile, resetProfile, restoreDemo, exportData } = useApp();
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // V1.8 — sauvegarde hors de l'application. Rien n'est envoye nulle part :
  // le texte est produit sur le telephone, puis copie ou partage par la personne.
  const [backup, setBackup] = useState<string | null>(null);
  const [backupError, setBackupError] = useState('');
  useEffect(() => setDraft(profile), [profile]);
  const automaticTarget = useMemo(() => dailyEnergyPlan({ ...draft, targetMode: 'automatic' }, activity, today).target, [draft, activity, today]);
  const { target: shownTarget, issue } = dailyEnergyPlan(draft, activity, today);

  const patch = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setError(null);
  };

  const numericPatch = (key: 'age' | 'heightCm' | 'weightKg' | 'manualTarget', value: string) => {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) patch(key, parsed);
  };

  const save = () => {
    if (issue) {
      setError(issue);
      return;
    }
    updateProfile({ ...draft, firstName: draft.firstName.trim() });
    setSaved(true);
  };

  const requestReset = () => Alert.alert(
    'Effacer ton profil ?',
    'Tes informations personnelles seront réinitialisées. Ton journal de repas sera conservé.',
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Effacer le profil',
        style: 'destructive',
        onPress: () => {
          resetProfile();
          setSaved(false);
          setError(null);
        },
      },
    ],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>TES PRÉFÉRENCES</Text>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.subtitle}>Ces informations servent uniquement à estimer un repère quotidien.</Text>

      {/* V2.4.3 — le parcours guidé revient en tête d'écran.
          Il existait depuis la V2.1, mais son bouton se trouvait tout en bas,
          au milieu des réglages d'animation : personne ne le trouvait, et la
          question « pourquoi la création étape par étape n'y est plus ? » est
          revenue deux fois. Un parcours qu'on ne trouve pas n'existe pas. */}
      <MotionPressable
        onPress={onReplayOnboarding}
        accessibilityRole="button"
        accessibilityLabel={profileCompleted ? 'Revoir mon profil étape par étape' : 'Créer mon profil étape par étape'}
        style={styles.guided}
      >
        <View style={styles.guidedIcon}>
          <AppIcon name="sparkle" size={20} color={colors.white} strokeWidth={2.1} />
        </View>
        <View style={styles.guidedBody}>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.guidedTitle}>
            {profileCompleted ? 'Revoir mon profil étape par étape' : 'Créer mon profil étape par étape'}
          </Text>
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.guidedCopy}>
            Six questions, une par écran, avec Jaws qui explique. Ton profil actuel n’est remplacé qu’au dernier bouton.
          </Text>
        </View>
        <AppIcon name="chevron" size={20} color={colors.violet} strokeWidth={2.4} />
      </MotionPressable>

      <Text style={styles.orLine}>ou modifie un détail ci-dessous</Text>

      <View style={styles.guideWrap}>
        <GuideCard
          compact
          tips={['Le prénom est facultatif. S’il est renseigné, je l’utilise pour te souhaiter la bienvenue.', 'Tu peux activer ou désactiver les animations et rejouer l’accueil plus bas dans cet écran.']}
          title={profileCompleted ? 'Jaws t’accompagne' : 'Créons ton profil avec Jaws'}
          message={profileCompleted
            ? 'Tu peux modifier tes informations ou effacer le profil pour recommencer. Rien n’est définitif.'
            : 'Renseigne tes repères, vérifie le résultat, puis enregistre. Je t’explique chaque étape.'}
        />
      </View>

      <Text style={styles.sectionTitle}>À propos de toi</Text>
      <View style={styles.identityCard}>
        <Text style={styles.fieldLabel}>Prénom ou pseudo — facultatif</Text>
        <TextInput
          value={draft.firstName}
          onChangeText={(value) => patch('firstName', value)}
          placeholder=""
          autoCapitalize="words"
          maxLength={40}
          accessibilityLabel="Prénom ou pseudo"
          style={styles.nameInput}
        />
      </View>

      <Text style={styles.sectionTitle}>Objectif</Text>
      <View style={styles.goalList}>
        {goals.map((goal) => (
          <Pressable key={goal.id} onPress={() => patch('goal', goal.id)} style={[styles.goalCard, draft.goal === goal.id && styles.goalCardActive]}>
            <View style={[styles.radio, draft.goal === goal.id && styles.radioActive]}>{draft.goal === goal.id && <View style={styles.radioInner} />}</View>
            <View style={styles.goalBody}><Text style={[styles.goalLabel, draft.goal === goal.id && styles.goalLabelActive]}>{goal.label}</Text><Text style={styles.goalDetail}>{goal.detail}</Text></View>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Calcul de l’objectif</Text>
      <View style={styles.segmented}>
        <Segment label="Calcul automatique" active={draft.targetMode === 'automatic'} onPress={() => patch('targetMode', 'automatic')} />
        <Segment label="Valeur manuelle" active={draft.targetMode === 'manual'} onPress={() => patch('targetMode', 'manual')} />
      </View>

      <Text style={styles.formHelp}>Ces informations servent à estimer ton maintien, y compris si tu choisis un objectif manuel.</Text>
      {(
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Paramètre utilisé dans la formule</Text>
          <View style={styles.optionRow}>
            <Option label="Femme" active={draft.sexForFormula === 'female'} onPress={() => patch('sexForFormula', 'female' as SexForFormula)} />
            <Option label="Homme" active={draft.sexForFormula === 'male'} onPress={() => patch('sexForFormula', 'male' as SexForFormula)} />
          </View>
          <View style={styles.fieldsRow}>
            <NumberField label="Âge" value={draft.age} suffix="ans" onChange={(value) => numericPatch('age', value)} />
            <NumberField label="Taille" value={draft.heightCm} suffix="cm" onChange={(value) => numericPatch('heightCm', value)} />
            <NumberField label="Poids" value={draft.weightKg} suffix="kg" onChange={(value) => numericPatch('weightKg', value)} />
          </View>
          <Text style={styles.fieldLabel}>Activité habituelle {draft.targetMode === 'automatic' && draft.activityBudgetMode === 'daily' ? '(utilisée en mode fixe)' : ''}</Text>
          <View style={styles.wrapOptions}>
            {activityLevels.map((level) => <Option key={level.id} label={level.label} active={draft.activityLevel === level.id} onPress={() => patch('activityLevel', level.id)} />)}
          </View>
          <View style={styles.formulaInfo}><Text style={styles.formulaLabel}>Besoins au repos estimés</Text><Text style={styles.formulaValue}>{issue ? 'À vérifier' : `${calculateBmr(draft)} kcal`}</Text></View>
          {draft.targetMode === 'automatic' && <View style={styles.formulaInfo}><Text style={styles.formulaLabel}>Objectif alimentaire proposé</Text><Text style={styles.formulaValueStrong}>{issue ? 'À vérifier' : `${automaticTarget} kcal`}</Text></View>}
          <Text style={styles.settingCopy}>Calcul automatique : maintien estimé, puis −300 kcal en perte ou +250 kcal en prise. Cet ajustement se personnalise en valeur manuelle.</Text>
        </View>
      )}
      {draft.targetMode === 'manual' && (
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Objectif calorique journalier</Text>
          <View style={styles.manualField}><TextInput accessibilityLabel="Objectif alimentaire en kilocalories" value={String(draft.manualTarget)} onChangeText={(value) => numericPatch('manualTarget', value)} keyboardType="number-pad" style={styles.manualInput} /><Text style={styles.manualSuffix}>kcal</Text></View>
          <View style={styles.notice}><AppIcon name="info" size={18} color={colors.sageDark} /><Text style={styles.noticeText}>Utilise une valeur adaptée à ta situation, idéalement définie avec un professionnel qualifié.</Text></View>
        </View>
      )}

      <View style={styles.formCard}><ActivityBudgetControls profile={draft} onChange={value => patch('activityBudgetMode', value)} /></View>
      <EnergyPlanCard profile={draft} draft />

      {!issue && <View style={styles.resultCard}>
        <View><Text style={styles.resultLabel}>Ton baromètre utilisera</Text><Text style={styles.resultValue}>{shownTarget.toLocaleString('fr-FR')} <Text style={styles.resultUnit}>kcal aujourd’hui</Text></Text></View>
        <View style={styles.resultIcon}><AppIcon name="target" size={24} color={colors.white} /></View>
      </View>}

      <MotionPressable onPress={save} accessibilityRole="button" style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.75 }]}>
        {saved && <AppIcon name="check" size={19} color={colors.white} strokeWidth={2.2} />}
        <Text style={styles.saveText}>{saved ? 'Profil enregistré' : profileCompleted ? 'Enregistrer les modifications' : 'Créer et enregistrer mon profil'}</Text>
      </MotionPressable>
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {saved && <Entrance><Text accessibilityLiveRegion="polite" style={styles.savedNotice}>C’est enregistré. Ton baromètre utilise maintenant ces repères.</Text></Entrance>}

      <Text style={styles.sectionTitle}>Une application à ton rythme</Text>
      <View style={styles.formCard}>
        <View>
          <Text style={styles.settingLabel}>Animations</Text>
          <Text style={styles.settingCopy}>Jaws, les aliments en mouvement, les bulles et les transitions.</Text>
          <View style={styles.motionRow}>
            {([
              { id: 'system' as const, label: 'Mon téléphone' },
              { id: 'on' as const, label: 'Toujours' },
              { id: 'off' as const, label: 'Jamais' },
            ]).map(choice => (
              <MotionPressable
                key={choice.id}
                onPress={() => setSetting('motion', choice.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: settings.motion === choice.id }}
                containerStyle={{ flex: 1 }}
                style={[styles.motionChoice, settings.motion === choice.id && styles.motionChoiceOn]}
              >
                <Text style={[styles.motionChoiceText, settings.motion === choice.id && styles.motionChoiceTextOn]}>{choice.label}</Text>
              </MotionPressable>
            ))}
          </View>
          <View style={[styles.motionStatus, reducedMotion ? styles.motionStatusOff : styles.motionStatusOn]}>
            <AppIcon name={reducedMotion ? 'info' : 'check'} size={16} color={reducedMotion ? colors.goldText : colors.aqua} strokeWidth={2.2} />
            <Text accessibilityLiveRegion="polite" style={[styles.motionStatusText, { color: reducedMotion ? '#6F4E07' : colors.aqua }]}>{motionExplanation}</Text>
          </View>

          {/* Banc d'essai. Le doute « est-ce que ça bouge ? » se lève en trois
              secondes : on change le réglage juste au-dessus et on regarde. */}
          <View style={styles.motionTest}>
            <GuideAvatar size={104} pose="wave" animationKey={`essai-${settings.motion}`} />
            <View style={styles.motionTestBody}>
              <Text style={styles.motionTestTitle}>Jaws en direct</Text>
              <Text style={styles.motionTestCopy}>
                {reducedMotion
                  ? 'Il est figé : c’est le réglage ci-dessus qui l’arrête. Choisis « Toujours » et il repart aussitôt.'
                  : 'Il respire en continu et salue toutes les quelques secondes. Si tu ne le vois pas bouger ici, le problème vient de l’affichage, pas du réglage.'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.settingRow}><View style={styles.settingBody}><Text style={styles.settingLabel}>Accueil au lancement</Text><Text style={styles.settingCopy}>Un bonjour à chaque ouverture complète.</Text></View><Switch accessibilityLabel="Accueil au lancement" value={settings.welcome} onValueChange={value => setSetting('welcome', value)} trackColor={{ true: colors.violet, false: colors.line }} /></View>
        <View style={styles.settingRow}><View style={styles.settingBody}><Text style={styles.settingLabel}>Conseils après un repas</Text><Text style={styles.settingCopy}>Une invitation douce à bouger ou à récupérer. Deux maximum par jour, espacées d’au moins 3 heures.</Text></View><Switch accessibilityLabel="Conseils après un repas" value={settings.activityPrompts} onValueChange={value => setSetting('activityPrompts', value)} trackColor={{ true: colors.violet, false: colors.line }} /></View>
        <Text style={styles.settingCopy}>Jaws te guide avec des bulles de texte. Passe au conseil suivant quand tu le souhaites.</Text>
        <MotionPressable onPress={onReplayWelcome} accessibilityRole="button" style={styles.replayButton}><AppIcon name="sparkle" size={17} color={colors.violet} /><Text style={styles.replayText}>Rejouer l’accueil</Text></MotionPressable>
      </View>

      <Text style={styles.sectionTitle}>Sauvegarder mes données</Text>
      <View style={styles.formCard}>
        <Text style={styles.settingCopy}>
          Tout est enregistré sur ce téléphone uniquement : il n’y a ni compte, ni synchronisation, ni copie sur un
          serveur. Désinstaller Expo Go ou l’application effacerait donc le journal. Prépare une sauvegarde pour en
          garder une copie ailleurs.
        </Text>
        <MotionPressable
          onPress={() => {
            try { setBackup(exportData()); setBackupError(''); }
            catch { setBackupError('La sauvegarde n’a pas pu être préparée sur ce téléphone.'); }
          }}
          accessibilityRole="button"
          style={styles.replayButton}
        >
          <AppIcon name="download" size={17} color={colors.violet} strokeWidth={2} />
          <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.replayText}>{backup ? 'Actualiser la sauvegarde' : 'Préparer une sauvegarde'}</Text>
        </MotionPressable>
        {backupError ? <Text accessibilityRole="alert" style={styles.error}>{backupError}</Text> : null}
        {backup && (
          <>
            <Text style={styles.settingCopy}>
              {Math.max(1, Math.round(backup.length / 1024))} Ko de texte JSON. Sélectionne-le pour le copier, ou
              partage-le vers une note ou un courriel.
            </Text>
            {Platform.OS !== 'web' && (
              <MotionPressable
                onPress={() => {
                  void Share.share({ message: backup })
                    .catch(() => setBackupError('Le partage n’a pas abouti. Tu peux sélectionner le texte ci-dessous et le copier.'));
                }}
                accessibilityRole="button"
                style={styles.replayButton}
              >
                <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.replayText}>Partager la sauvegarde</Text>
              </MotionPressable>
            )}
            <ScrollView style={styles.backupBox} nestedScrollEnabled>
              <Text selectable style={styles.backupText}>{backup}</Text>
            </ScrollView>
            <Text style={styles.settingCopy}>
              Cette version ne réimporte pas encore une sauvegarde : ce texte sert à conserver tes données et à les
              relire, pas à les réinstaller automatiquement.
            </Text>
          </>
        )}
      </View>

      <View style={styles.resetCard}>
        <View style={styles.resetIcon}><AppIcon name="trash" size={19} color={colors.coral} /></View>
        <View style={styles.resetBody}>
          <Text style={styles.resetTitle}>Recommencer mon profil</Text>
          <Text style={styles.resetCopy}>Efface les informations du profil sans supprimer les repas déjà enregistrés.</Text>
          <Pressable onPress={requestReset} style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.65 }]}>
            <Text style={styles.resetButtonText}>Effacer mon profil</Text>
          </Pressable>
        </View>
      </View>
      <Pressable onPress={restoreDemo} style={styles.demoLink}><Text style={styles.demoLinkText}>Restaurer les données de démonstration</Text></Pressable>
      <Text style={styles.settingCopy}>Calories Express · version {appConfig.expo.version}</Text>
    </ScrollView>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.segment, active && styles.segmentActive]}><Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text></Pressable>;
}

function Option({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.option, active && styles.optionActive]}><Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text></Pressable>;
}

function NumberField({ label, value, suffix, onChange }: { label: string; value: number; suffix: string; onChange: (value: string) => void }) {
  return <View style={styles.numberField}><Text style={styles.fieldLabel}>{label}</Text><View style={styles.numberBox}><TextInput accessibilityLabel={`${label} en ${suffix}`} value={String(value)} onChangeText={onChange} keyboardType="decimal-pad" style={styles.numberInput} /><Text style={styles.numberSuffix}>{suffix}</Text></View></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingBody: { flex: 1 },
  settingLabel: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  settingCopy: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  guided: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.violetPale, borderRadius: 22, borderWidth: 1.5, borderColor: '#CFC5FF', padding: 14, marginTop: 16 },
  guidedIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  guidedBody: { flex: 1, minWidth: 0, gap: 3 },
  guidedTitle: { color: colors.violetInk, fontSize: 16, fontWeight: '800' },
  guidedCopy: { color: colors.inkSoft, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  orLine: { color: colors.muted, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 14 },
  replayButton: { minHeight: 44, backgroundColor: colors.violetPale, borderRadius: 12, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  replayText: { color: colors.violet, fontSize: 12, fontWeight: '800' },
  savedNotice: { color: colors.sageDark, fontSize: 12, lineHeight: 18, marginTop: 12 },
  error: { color: colors.inkSoft, backgroundColor: colors.goldPale, padding: 13, borderRadius: 12, fontSize: 12, lineHeight: 18, marginTop: 12 },
  formHelp: { color: colors.inkSoft, fontSize: 12, lineHeight: 17, marginTop: 14 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 42 },
  eyebrow: { color: colors.sageDark, fontSize: 12, fontWeight: '800', letterSpacing: 1.6 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '700', letterSpacing: -1, marginTop: 5 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, maxWidth: 320, marginTop: 7 },
  guideWrap: { marginTop: 20 },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', marginTop: 28, marginBottom: 11 },
  identityCard: { backgroundColor: colors.card, borderRadius: radii.large, padding: 15, borderWidth: 1, borderColor: colors.line, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 18 },
  nameInput: { backgroundColor: colors.background, borderRadius: 13, borderWidth: 1, borderColor: colors.line, color: colors.ink, fontSize: 14, fontWeight: '600', paddingHorizontal: 13, paddingVertical: 12 },
  goalList: { gap: 9 },
  goalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.line, padding: 14 },
  goalCardActive: { borderColor: colors.sageDark, backgroundColor: colors.sagePale },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.sageDark },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.sageDark },
  goalBody: { flex: 1, marginLeft: 11, flexDirection: 'row', justifyContent: 'space-between' },
  goalLabel: { color: colors.inkSoft, fontSize: 13, fontWeight: '600' },
  goalLabelActive: { color: colors.ink, fontWeight: '700' },
  goalDetail: { color: colors.muted, fontSize: 12 },
  segmented: { flexDirection: 'row', backgroundColor: colors.line, borderRadius: 13, padding: 3 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.card },
  segmentText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  segmentTextActive: { color: colors.ink, fontWeight: '700' },
  formCard: { backgroundColor: colors.card, borderRadius: radii.large, padding: 17, borderWidth: 1, borderColor: colors.line, marginTop: 11, gap: 13 },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  optionRow: { flexDirection: 'row', gap: 8 },
  wrapOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background },
  optionActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  optionText: { color: colors.inkSoft, fontSize: 12, fontWeight: '600' },
  optionTextActive: { color: colors.white },
  fieldsRow: { flexDirection: 'row', gap: 8 },
  numberField: { flex: 1 },
  numberBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 9 },
  numberInput: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '700', paddingVertical: 11 },
  numberSuffix: { color: colors.muted, fontSize: 12 },
  formulaInfo: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line },
  formulaLabel: { color: colors.muted, fontSize: 12 },
  formulaValue: { color: colors.inkSoft, fontSize: 12, fontWeight: '700' },
  formulaValueStrong: { color: colors.sageDark, fontSize: 13, fontWeight: '800' },
  manualField: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 14, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14 },
  manualInput: { flex: 1, color: colors.ink, fontSize: 25, fontWeight: '700', paddingVertical: 12 },
  manualSuffix: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  notice: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', backgroundColor: colors.sagePale, borderRadius: 14, padding: 12 },
  noticeText: { flex: 1, color: colors.inkSoft, fontSize: 12, lineHeight: 15 },
  resultCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.navy, borderRadius: radii.large, padding: 19, marginTop: 20 },
  resultLabel: { color: '#C8C9FF', fontSize: 12 },
  resultValue: { color: colors.white, fontSize: 26, fontWeight: '700', marginTop: 5, letterSpacing: -0.5 },
  resultUnit: { fontSize: 12, fontWeight: '500', color: '#C8C9FF' },
  resultIcon: { width: 45, height: 45, borderRadius: 16, backgroundColor: '#FFFFFF18', alignItems: 'center', justifyContent: 'center' },
  saveButton: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.violet, borderRadius: 16, paddingVertical: 15, marginTop: 14, shadowColor: colors.violet, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 14 },
  saveText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  resetCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderRadius: radii.large, borderWidth: 1, borderColor: colors.line, padding: 15, marginTop: 24 },
  resetIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: colors.coralPale, alignItems: 'center', justifyContent: 'center' },
  resetBody: { flex: 1, marginLeft: 12 },
  resetTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  resetCopy: { color: colors.muted, fontSize: 12, lineHeight: 15, marginTop: 4 },
  resetButton: { alignSelf: 'flex-start', borderRadius: 10, backgroundColor: colors.coralPale, paddingHorizontal: 11, paddingVertical: 8, marginTop: 10 },
  resetButtonText: { color: colors.coral, fontSize: 12, fontWeight: '800' },
  backupBox: { maxHeight: 190, backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 12 },
  backupText: { color: colors.inkSoft, fontSize: 12, lineHeight: 17 },
  motionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  motionChoice: { minHeight: 46, borderRadius: 13, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  motionChoiceOn: { backgroundColor: colors.violet, borderColor: colors.violet },
  motionChoiceText: { color: colors.inkSoft, fontSize: 13, fontWeight: '700' },
  motionChoiceTextOn: { color: colors.white },
  motionStatus: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, padding: 11, marginTop: 10 },
  motionStatusOn: { backgroundColor: colors.aquaPale },
  motionStatusOff: { backgroundColor: colors.goldPale },
  motionStatusText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  motionTest: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, padding: 10, borderRadius: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line },
  motionTestBody: { flex: 1, gap: 3 },
  motionTestTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  motionTestCopy: { color: colors.muted, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  demoLink: { alignItems: 'center', paddingVertical: 18 },
  demoLinkText: { color: colors.muted, fontSize: 12, textDecorationLine: 'underline' },
});
