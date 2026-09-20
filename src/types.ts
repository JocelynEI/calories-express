export type Goal = 'maintain' | 'lose' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type SexForFormula = 'female' | 'male';
export type MealMoment = 'Petit-déjeuner' | 'Déjeuner' | 'Goûter' | 'Dîner' | 'Snack';
export type EntryMethod = 'phrase' | 'manual' | 'product';

export type FoodReference = {
  amount: number;
  unit: 'g' | 'ml' | 'portion';
  calories: { min: number; estimated: number; max: number };
  macros: MacroNutrients;
  macrosComplete: boolean;
  source: 'manual' | 'off' | 'catalog' | 'ciqual' | 'label' | 'recipe';
  portionName?: string;
  sourceUrl?: string;
  /** V2.4 — photo réelle du produit, servie par Open Food Facts. */
  imageUrl?: string;
  description?: string;
};

export type SavedFood = { id: string; name: string; reference: FoodReference };
/** V1.8 — une pesée par journée ; la courbe se lit en moyenne, pas en points. */
export type WeightEntry = { day: string; kg: number };
export type ActivityKind = 'walk' | 'run' | 'swim' | 'aqua' | 'cycle' | 'strength' | 'interval' | 'mobility' | 'other';
export type ActivityEffort = 'easy' | 'moderate' | 'brisk';
export type ActivitySession = { id: string; day: string; kind: ActivityKind; minutes: number; note: string; effort?: ActivityEffort; weightKg?: number; includeInGoal?: boolean; includedInSteps?: boolean; energySource?: 'estimated' | 'reported'; reportedActiveKcal?: number; deviceName?: string };
export type StepDetails = { weightKg?: number; baselineSteps: number };
export type ReportedDayEnergy = { activeKcal: number; baselineActiveKcal: number; deviceName: string };
export type ActivityJournal = { sessions: ActivitySession[]; stepsByDay: Record<string, number>; stepDetailsByDay?: Record<string, StepDetails>; reportedEnergyByDay?: Record<string, ReportedDayEnergy> };

export type MacroNutrients = {
  protein: number;
  carbs: number;
  fat: number;
};

export type Food = {
  id: string;
  category: string;
  name: string;
  description: string;
  calories: { min: number; estimated: number; max: number };
  macros: MacroNutrients;
  confidence: 'Bonne' | 'Moyenne' | 'Faible';
  aliases: string[];
};

export type RecognizedFood = {
  foodId: string;
  name: string;
  quantity: number;
  calories: { min: number; estimated: number; max: number };
  macros: MacroNutrients;
  confidence: Food['confidence'];
  reference?: FoodReference;
  macrosComplete?: boolean;
};

export type Meal = {
  id: string;
  createdAt: string;
  moment: MealMoment;
  description: string;
  method: EntryMethod | 'photo'; // Preserve old journals; new entries have no photo mode.
  imageUri?: string;
  items: RecognizedFood[];
  calories: { min: number; estimated: number; max: number };
  macros: MacroNutrients;
};

export type Profile = {
  firstName: string;
  sexForFormula: SexForFormula;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  targetMode: 'automatic' | 'manual';
  activityBudgetMode?: 'fixed' | 'daily';
  manualTarget: number;
};

export type AppState = {
  profile: Profile;
  meals: Meal[];
  isDemo: boolean;
};
