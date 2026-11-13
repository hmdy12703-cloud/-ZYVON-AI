import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProgressionRecommendations } from '../src/plans/progression';

test('returns no progression until two completed sessions exist', () => {
  assert.deepEqual(buildProgressionRecommendations([{ sets: [] }]), []);
});

test('suggests a small load increase only after repeated high-rep sets', () => {
  const sessions = [
    { sets: [{ exerciseId: 'squat', reps: 12, loadKg: 40, completed: true }] },
    { sets: [{ exerciseId: 'squat', reps: 12, loadKg: 40, completed: true }] },
  ];
  assert.equal(buildProgressionRecommendations(sessions)[0]?.suggestedLoadKg, 41);
  assert.equal(buildProgressionRecommendations(sessions)[0]?.action, 'SMALL_LOAD_INCREASE');
});

test('blocks progression when pain or a very high effort score is reported', () => {
  const sessions = [
    { feedback: 'I felt pain in my knee', sets: [{ exerciseId: 'squat', reps: 15, loadKg: 40, completed: true }] },
    { sets: [{ exerciseId: 'squat', reps: 15, loadKg: 40, completed: true }] },
  ];
  assert.deepEqual(buildProgressionRecommendations(sessions), []);
});

test('holds load when performance falls', () => {
  const sessions = [
    { sets: [{ exerciseId: 'row', reps: 8, loadKg: 20, completed: true }] },
    { sets: [{ exerciseId: 'row', reps: 10, loadKg: 20, completed: true }] },
  ];
  assert.equal(buildProgressionRecommendations(sessions)[0]?.action, 'HOLD');
});

test('ignores incomplete sets', () => {
  const sessions = [
    { sets: [{ exerciseId: 'press', reps: 15, loadKg: 10, completed: false }] },
    { sets: [{ exerciseId: 'press', reps: 15, loadKg: 10, completed: true }] },
  ];
  assert.deepEqual(buildProgressionRecommendations(sessions), []);
});
