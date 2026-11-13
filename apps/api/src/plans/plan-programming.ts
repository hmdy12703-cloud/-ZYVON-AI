export type PlanGoal =
  | 'FAT_LOSS'
  | 'MUSCLE_GAIN'
  | 'STRENGTH'
  | 'ENDURANCE'
  | 'MOBILITY'
  | 'GENERAL';

export type PlanLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface PlanProfile {
  goal: PlanGoal;
  experienceLevel: PlanLevel;
  trainingDaysPerWeek: number;
  sessionMinutes: number;
  equipment: unknown;
  preferredLanguage: 'ar' | 'en';
  safetyNotes?: string | null;
}

export interface PlanCandidate {
  id: string;
  nameAr: string;
  nameEn: string;
  difficulty: PlanLevel;
  equipment: unknown;
}

export interface PlannedExercise {
  exerciseId: string;
  sortOrder: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  durationSeconds?: number;
  restSeconds: number;
  notes: string;
}

export interface PlannedDay {
  dayNumber: number;
  title: string;
  notes: string;
  exercises: PlannedExercise[];
}

const levelRank: Record<PlanLevel, number> = {
  BEGINNER: 0,
  INTERMEDIATE: 1,
  ADVANCED: 2,
};

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function equipmentMatches(requiredValue: unknown, availableValue: unknown): boolean {
  const required = stringList(requiredValue);
  if (required.length === 0 || required.some((item) =>
    ['bodyweight', 'body weight', 'none', 'no equipment', 'بدون معدات', 'وزن الجسم'].includes(item),
  )) return true;

  const available = stringList(availableValue);
  if (available.length === 0) return false;
  return required.every((item) => available.some((owned) =>
    owned === item || owned.includes(item) || item.includes(owned),
  ));
}

export function buildPlanDays(profile: PlanProfile, candidates: PlanCandidate[]): PlannedDay[] {
  const days = Math.min(6, Math.max(1, Math.floor(profile.trainingDaysPerWeek || 3)));
  const minutes = Math.min(180, Math.max(10, Math.floor(profile.sessionMinutes || 45)));
  const exerciseLimit = minutes <= 20 ? 2 : minutes <= 35 ? 3 : minutes <= 55 ? 4 : 5;
  const suitable = candidates.filter((exercise) =>
    levelRank[exercise.difficulty] <= levelRank[profile.experienceLevel]
      && equipmentMatches(exercise.equipment, profile.equipment),
  );

  if (suitable.length < 3) {
    throw new Error('NOT_ENOUGH_SUITABLE_EXERCISES');
  }

  const settings: Record<PlanGoal, { sets: number; repsMin: number; repsMax: number; rest: number; duration?: number }> = {
    FAT_LOSS: { sets: 3, repsMin: 10, repsMax: 15, rest: 45 },
    MUSCLE_GAIN: { sets: 3, repsMin: 8, repsMax: 12, rest: 75 },
    STRENGTH: { sets: 4, repsMin: 4, repsMax: 6, rest: 120 },
    ENDURANCE: { sets: 2, repsMin: 12, repsMax: 20, rest: 40 },
    MOBILITY: { sets: 2, repsMin: 8, repsMax: 10, rest: 30, duration: 30 },
    GENERAL: { sets: 3, repsMin: 8, repsMax: 12, rest: 60 },
  };
  const setting = settings[profile.goal];
  const maxExercises = Math.min(exerciseLimit, suitable.length);
  const chosenPerDay = Math.min(maxExercises, Math.max(2, Math.ceil(suitable.length / Math.max(days, 1))));
  const caution = profile.safetyNotes?.trim()
    ? (profile.preferredLanguage === 'ar'
      ? 'تم إدخال ملاحظات سلامة في ملفك. راجع ملاءمة كل تمرين، وتوقف عند الألم أو الأعراض غير المعتادة، واستشر مختصًا عند الحاجة.'
      : 'Your profile includes safety notes. Check every exercise for suitability, stop if pain or unusual symptoms occur, and consult a qualified professional when needed.')
    : (profile.preferredLanguage === 'ar'
      ? 'ابدأ بإحماء خفيف. أوقف التمرين عند الألم الحاد أو الدوخة أو أي أعراض غير معتادة.'
      : 'Begin with a gentle warm-up. Stop for sharp pain, dizziness, or unusual symptoms.');

  const daysResult: PlannedDay[] = [];
  const usedByDay = new Set<string>();
  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const start = (dayIndex * chosenPerDay) % suitable.length;
    const selected: PlanCandidate[] = [];
    for (let offset = 0; offset < suitable.length && selected.length < chosenPerDay; offset += 1) {
      const candidate = suitable[(start + offset) % suitable.length]!;
      if (!usedByDay.has(candidate.id) || selected.length === 0) selected.push(candidate);
    }
    // Reset the preference when the catalog is smaller than the weekly schedule.
    if (selected.length < chosenPerDay) {
      for (let offset = 0; offset < suitable.length && selected.length < chosenPerDay; offset += 1) {
        const candidate = suitable[(start + offset) % suitable.length]!;
        if (!selected.some((item) => item.id === candidate.id)) selected.push(candidate);
      }
    }
    selected.forEach((item) => usedByDay.add(item.id));
    const title = profile.preferredLanguage === 'ar' ? `اليوم ${dayIndex + 1}` : `Day ${dayIndex + 1}`;
    daysResult.push({
      dayNumber: dayIndex + 1,
      title,
      notes: caution,
      exercises: selected.map((exercise, index) => ({
        exerciseId: exercise.id,
        sortOrder: index + 1,
        sets: setting.sets,
        repsMin: setting.repsMin,
        repsMax: setting.repsMax,
        ...(setting.duration ? { durationSeconds: setting.duration } : {}),
        restSeconds: setting.rest,
        notes: profile.preferredLanguage === 'ar'
          ? `اختر شدة تسمح بأداء الحركة بشكل صحيح: ${exercise.nameAr}`
          : `Choose a load that allows controlled technique: ${exercise.nameEn}`,
      })),
    });
  }
  return daysResult;
}
