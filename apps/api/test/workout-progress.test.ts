import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeWorkoutProgress } from '../src/workouts/workout-progress';

test('summarizes only completed sets and calculates training volume', () => {
  const result = summarizeWorkoutProgress([{
    id: 'session-1',
    completedAt: '2026-11-13T10:00:00.000Z',
    sets: [
      { reps: 10, loadKg: 20, completed: true },
      { reps: 8, loadKg: 25, completed: true },
      { reps: 12, loadKg: 20, completed: false },
      { reps: 10, loadKg: null, completed: true },
    ],
  }]);
  assert.deepEqual(result, [{
    id: 'session-1',
    completedAt: '2026-11-13T10:00:00.000Z',
    completedSets: 3,
    volumeKg: 400,
  }]);
});

test('returns zero volume for bodyweight or duration-only sets', () => {
  const result = summarizeWorkoutProgress([{
    id: 'session-2',
    completedAt: null,
    sets: [{ reps: null, loadKg: null, completed: true }],
  }]);
  assert.equal(result[0].completedSets, 1);
  assert.equal(result[0].volumeKg, 0);
});
