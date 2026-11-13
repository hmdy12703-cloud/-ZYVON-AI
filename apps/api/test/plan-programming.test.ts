import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPlanDays, type PlanCandidate, type PlanProfile } from '../src/plans/plan-programming';

const exercises: PlanCandidate[] = [
  { id: '1', nameAr: 'ضغط', nameEn: 'Push-up', difficulty: 'BEGINNER', equipment: [] },
  { id: '2', nameAr: 'قرفصاء', nameEn: 'Squat', difficulty: 'BEGINNER', equipment: ['bodyweight'] },
  { id: '3', nameAr: 'اندفاع', nameEn: 'Lunge', difficulty: 'INTERMEDIATE', equipment: [] },
  { id: '4', nameAr: 'ضغط صدر', nameEn: 'Bench press', difficulty: 'ADVANCED', equipment: ['barbell', 'bench'] },
  { id: '5', nameAr: 'سحب', nameEn: 'Row', difficulty: 'INTERMEDIATE', equipment: ['dumbbell'] },
  { id: '6', nameAr: 'جسر الحوض', nameEn: 'Glute bridge', difficulty: 'BEGINNER', equipment: [] },
];

function profile(overrides: Partial<PlanProfile> = {}): PlanProfile {
  return {
    goal: 'MUSCLE_GAIN',
    experienceLevel: 'BEGINNER',
    trainingDaysPerWeek: 3,
    sessionMinutes: 45,
    equipment: [],
    preferredLanguage: 'ar',
    safetyNotes: null,
    ...overrides,
  };
}

test('builds the requested number of days and respects beginner level', () => {
  const days = buildPlanDays(profile(), exercises);
  assert.equal(days.length, 3);
  assert.ok(days.every((day) => day.exercises.length > 0));
  assert.ok(days.flatMap((day) => day.exercises).every((item) =>
    ['1', '2', '6'].includes(item.exerciseId),
  ));
});

test('filters exercises by available equipment', () => {
  const days = buildPlanDays(profile({
    experienceLevel: 'ADVANCED',
    equipment: ['dumbbell'],
    trainingDaysPerWeek: 1,
  }), exercises);
  const ids = days[0]!.exercises.map((item) => item.exerciseId);
  assert.ok(ids.includes('1'));
  assert.ok(ids.includes('2'));
  assert.ok(ids.includes('3'));
  assert.ok(ids.includes('5'));
  assert.ok(!ids.includes('4'));
});

test('applies goal-specific strength prescriptions and session limits', () => {
  const days = buildPlanDays(profile({
    goal: 'STRENGTH',
    experienceLevel: 'ADVANCED',
    trainingDaysPerWeek: 2,
    sessionMinutes: 20,
  }), exercises);
  assert.equal(days.length, 2);
  assert.ok(days.every((day) => day.exercises.length <= 2));
  assert.ok(days.flatMap((day) => day.exercises).every((item) =>
    item.sets === 4 && item.repsMin === 4 && item.repsMax === 6 && item.restSeconds === 120,
  ));
});

test('adds a conservative safety reminder when profile safety notes exist', () => {
  const days = buildPlanDays(profile({ safetyNotes: 'Avoid painful overhead movement' }), exercises);
  assert.ok(days.every((day) => day.notes.includes('ملاحظات سلامة')));
});

test('rejects a catalog with too few suitable exercises', () => {
  assert.throws(
    () => buildPlanDays(profile({ equipment: ['treadmill'] }), exercises.filter((item) => Array.isArray(item.equipment) && item.equipment.length > 0)),
    /NOT_ENOUGH_SUITABLE_EXERCISES/,
  );
});

test('normalizes common English and Arabic equipment aliases', () => {
  const days = buildPlanDays(profile({
    experienceLevel: 'ADVANCED',
    equipment: ['دمبلز', 'عقلة'],
    trainingDaysPerWeek: 1,
  }), [
    ...exercises.filter((item) => ['1', '2', '3', '6'].includes(item.id)),
    { id: '7', nameAr: 'سحب دمبل', nameEn: 'Dumbbell row', difficulty: 'INTERMEDIATE', equipment: ['dumbbells'] },
    { id: '8', nameAr: 'عقلة', nameEn: 'Pull-up', difficulty: 'INTERMEDIATE', equipment: ['pull up bar'] },
  ]);
  const ids = days[0]!.exercises.map((item) => item.exerciseId);
  assert.ok(ids.includes('7'));
  assert.ok(ids.includes('8'));
});

test('does not treat partial equipment names as a match', () => {
  const candidates: PlanCandidate[] = [
    { id: 'a', nameAr: 'تمرين أ', nameEn: 'Exercise A', difficulty: 'BEGINNER', equipment: ['bar'] },
    { id: 'b', nameAr: 'تمرين ب', nameEn: 'Exercise B', difficulty: 'BEGINNER', equipment: ['barbell'] },
    { id: 'c', nameAr: 'تمرين ج', nameEn: 'Exercise C', difficulty: 'BEGINNER', equipment: ['barbell'] },
  ];
  assert.throws(
    () => buildPlanDays(profile({ equipment: ['bar'] }), candidates),
    /NOT_ENOUGH_SUITABLE_EXERCISES/,
  );
});
