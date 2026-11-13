export type WorkoutProgressSession = {
  id: string;
  completedAt: Date | string | null;
  sets: Array<{ reps: number | null; loadKg: number | null; completed: boolean }>;
};

export function summarizeWorkoutProgress(sessions: WorkoutProgressSession[]) {
  return sessions.map((session) => {
    const completedSets = session.sets.filter((set) => set.completed);
    const volumeKg = completedSets.reduce(
      (total, set) => total + (set.reps ?? 0) * (set.loadKg ?? 0),
      0,
    );
    return {
      id: session.id,
      completedAt: session.completedAt,
      completedSets: completedSets.length,
      volumeKg: Math.round(volumeKg * 10) / 10,
    };
  });
}
