export interface ProgressionSet {
  exerciseId: string;
  reps: number | null;
  loadKg: number | null;
  completed: boolean;
}

export interface ProgressionSession {
  feedback?: string | null;
  perceivedEffort?: number | null;
  sets: ProgressionSet[];
}

export interface ProgressionRecommendation {
  exerciseId: string;
  action: 'ADD_ONE_REP' | 'SMALL_LOAD_INCREASE' | 'HOLD';
  suggestedLoadKg: number | null;
  reason: string;
}

const painSignals = /pain|hurt|injur|numb|tingl|ألم|وجع|إصابة|تنميل|خدر|وخز|دوخة/i;

export function buildProgressionRecommendations(
  sessions: ProgressionSession[],
): ProgressionRecommendation[] {
  if (sessions.length < 2) return [];
  const [latest, previous] = sessions;
  if (!latest || !previous) return [];
  const safetyFlag = [latest, previous].some((session) =>
    painSignals.test(session.feedback ?? '') || (session.perceivedEffort !== null && session.perceivedEffort !== undefined && session.perceivedEffort >= 9),
  );
  if (safetyFlag) {
    return [];
  }

  const group = (sets: ProgressionSet[]) => {
    const result = new Map<string, ProgressionSet[]>();
    for (const set of sets.filter((item) => item.completed)) {
      const current = result.get(set.exerciseId) ?? [];
      current.push(set);
      result.set(set.exerciseId, current);
    }
    return result;
  };
  const latestByExercise = group(latest.sets);
  const previousByExercise = group(previous.sets);
  const recommendations: ProgressionRecommendation[] = [];

  for (const [exerciseId, current] of latestByExercise) {
    const prior = previousByExercise.get(exerciseId);
    if (!prior?.length || !current.length) continue;
    const currentReps = current.map((item) => item.reps ?? 0);
    const priorReps = prior.map((item) => item.reps ?? 0);
    const currentLoads = current.map((item) => item.loadKg ?? 0);
    const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    const currentAverage = average(currentReps);
    const priorAverage = average(priorReps);
    const load = Math.max(...currentLoads);
    const reachedTopRange = currentReps.length > 0 && currentReps.every((reps) => reps >= 12);
    if (reachedTopRange && load > 0) {
      recommendations.push({
        exerciseId,
        action: 'SMALL_LOAD_INCREASE',
        suggestedLoadKg: Math.round(load * 1.025 * 10) / 10,
        reason: 'You completed all logged sets at 12+ reps in consecutive sessions. Consider a small 2.5% increase only if technique remains controlled.',
      });
    } else if (currentAverage >= priorAverage && currentAverage > 0) {
      recommendations.push({
        exerciseId,
        action: 'ADD_ONE_REP',
        suggestedLoadKg: load || null,
        reason: 'Performance was stable or improved across two completed sessions. Consider adding one repetition while keeping the same load.',
      });
    } else {
      recommendations.push({
        exerciseId,
        action: 'HOLD',
        suggestedLoadKg: load || null,
        reason: 'Keep the current load and focus on consistent technique before progressing.',
      });
    }
  }
  return recommendations;
}
