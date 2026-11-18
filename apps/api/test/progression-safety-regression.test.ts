import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProgressionRecommendations } from '../src/plans/progression';

test('does not suggest a load increase from one high-rep session alone', () => {
  const sessions = [
    { sets: [{ exerciseId: 'squat', reps: 8, loadKg: 40, completed: true }] },
    { sets: [{ exerciseId: 'squat', reps: 15, loadKg: 40, completed: true }] },
  ];
  assert.equal(buildProgressionRecommendations(sessions)[0]?.action, 'ADD_ONE_REP');
});

test('does not suggest a load increase when the load changed between sessions', () => {
  const sessions = [
    { sets: [{ exerciseId: 'squat', reps: 15, loadKg: 30, completed: true }] },
    { sets: [{ exerciseId: 'squat', reps: 15, loadKg: 40, completed: true }] },
  ];
  assert.notEqual(buildProgressionRecommendations(sessions)[0]?.action, 'SMALL_LOAD_INCREASE');
});

test('blocks progression for Arabic muscle strain feedback', () => {
  const sessions = [
    { feedback: 'أشعر بشد عضلي في الظهر', sets: [{ exerciseId: 'row', reps: 15, loadKg: 20, completed: true }] },
    { sets: [{ exerciseId: 'row', reps: 15, loadKg: 20, completed: true }] },
  ];
  assert.deepEqual(buildProgressionRecommendations(sessions), []);
});
