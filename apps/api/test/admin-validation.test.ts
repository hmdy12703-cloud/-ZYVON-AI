import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateExerciseDto } from '../src/admin/dto/create-exercise.dto';
import { UpdateExerciseStatusDto } from '../src/admin/dto/update-exercise-status.dto';

test('accepts a complete bilingual exercise draft', async () => {
  const dto = plainToInstance(CreateExerciseDto, {
    slug: 'bodyweight-squat',
    nameAr: 'قرفصاء وزن الجسم',
    nameEn: 'Bodyweight squat',
    descriptionAr: 'تمرين أساسي للرجلين',
    descriptionEn: 'A basic lower-body exercise',
    instructionsAr: 'قف ثم انزل بتحكم',
    instructionsEn: 'Stand and lower with control',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    equipment: [],
    difficulty: 'BEGINNER',
    safetyNotesAr: 'توقف إذا شعرت بألم حاد',
    safetyNotesEn: 'Stop if you feel sharp pain',
  });
  assert.equal((await validate(dto, { whitelist: true, forbidNonWhitelisted: true })).length, 0);
});

test('rejects unsafe exercise slugs and unsupported status values', async () => {
  const dto = plainToInstance(CreateExerciseDto, { slug: '../admin', nameAr: 'x' });
  assert.ok((await validate(dto)).length > 0);
  const status = plainToInstance(UpdateExerciseStatusDto, { status: 'LIVE' });
  assert.ok((await validate(status)).length > 0);
});
