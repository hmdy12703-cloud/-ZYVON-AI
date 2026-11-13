export type Language = "ar" | "en";
export type UserRole = "USER" | "ADMIN";
export type FitnessGoal =
  | "FAT_LOSS"
  | "MUSCLE_GAIN"
  | "STRENGTH"
  | "ENDURANCE"
  | "MOBILITY"
  | "GENERAL";
export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type Equipment =
  | "NONE"
  | "DUMBBELLS"
  | "BARBELL"
  | "MACHINES"
  | "RESISTANCE_BANDS"
  | "CARDIO"
  | "FULL_GYM";

export interface UserProfileInput {
  displayName: string;
  preferredLanguage: Language;
  goal: FitnessGoal;
  experienceLevel: ExperienceLevel;
  trainingDaysPerWeek: number;
  sessionMinutes: number;
  equipment: Equipment[];
}

export interface ExerciseSummary {
  id: string;
  slug: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  equipment: Equipment[];
  primaryMuscles: string[];
  safetyNotes: Record<Language, string>;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}
