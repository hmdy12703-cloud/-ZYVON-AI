import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProfileDto } from '../src/profile/dto/update-profile.dto';
import { ListExercisesDto } from '../src/exercises/dto/list-exercises.dto';

test('accepts a valid fitness profile payload', async () => {
  const dto = plainToInstance(UpdateProfileDto, {
    displayName: 'Athlete',
    heightCm: 173,
    weightKg: 98,
    trainingDaysPerWeek: 4,
    sessionMinutes: 45,
    equipment: ['DUMBBELLS', 'MAT'],
  });
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  assert.equal(errors.length, 0);
});

test('rejects invalid measurements and unexpected sensitive fields', async () => {
  const dto = plainToInstance(UpdateProfileDto, {
    heightCm: 70,
    role: 'ADMIN',
  });
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  assert.ok(errors.some((error) => error.property === 'heightCm'));
  assert.ok(errors.some((error) => error.property === 'role'));
});

test('converts and validates exercise catalog pagination query values', async () => {
  const dto = plainToInstance(ListExercisesDto, { page: '2', limit: '15', q: 'squat' });
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  assert.equal(errors.length, 0);
  assert.equal(dto.page, 2);
  assert.equal(dto.limit, 15);
});

test('rejects an excessive exercise catalog page size', async () => {
  const dto = plainToInstance(ListExercisesDto, { page: '1', limit: '1000' });
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  assert.ok(errors.some((error) => error.property === 'limit'));
});


test('rejects null repetitions in workout set payloads', async () => {
  const { AddWorkoutSetDto } = await import('../src/workouts/dto/add-workout-set.dto');
  const dto = plainToInstance(AddWorkoutSetDto, {
    exerciseId: '00000000-0000-4000-8000-000000000000',
    setNumber: 1,
    reps: null,
  });
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  assert.ok(errors.some((error) => error.property === 'reps'));
});


test('accepts bounded post-workout effort and optional feedback', async () => {
  const { CompleteWorkoutDto } = await import('../src/workouts/dto/complete-workout.dto');
  const dto = plainToInstance(CompleteWorkoutDto, { perceivedEffort: 7, feedback: 'No pain, normal fatigue' });
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  assert.equal(errors.length, 0);
});

test('rejects out-of-range post-workout effort and oversized feedback', async () => {
  const { CompleteWorkoutDto } = await import('../src/workouts/dto/complete-workout.dto');
  const dto = plainToInstance(CompleteWorkoutDto, { perceivedEffort: 11, feedback: 'x'.repeat(1001) });
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  assert.ok(errors.some((error) => error.property === 'perceivedEffort'));
  assert.ok(errors.some((error) => error.property === 'feedback'));
});


test('accepts an optional training plan day UUID when starting a workout', async () => {
  const { StartWorkoutDto } = await import('../src/workouts/dto/start-workout.dto');
  const dto = plainToInstance(StartWorkoutDto, {
    trainingPlanId: '00000000-0000-4000-8000-000000000001',
    planDayId: '00000000-0000-4000-8000-000000000002',
  });
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  assert.equal(errors.length, 0);
});
