import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateNutritionLogDto } from '../src/nutrition/dto/create-nutrition-log.dto';

test('accepts nutrition values within supported ranges', async () => {
  const dto = plainToInstance(CreateNutritionLogDto, {
    calories: 550,
    proteinGrams: 35.5,
    carbsGrams: 60,
    fatGrams: 18,
    notes: 'Lunch',
  });
  assert.equal((await validate(dto, { whitelist: true, forbidNonWhitelisted: true })).length, 0);
});

test('rejects negative and implausibly high nutrition values', async () => {
  const dto = plainToInstance(CreateNutritionLogDto, {
    calories: -1,
    proteinGrams: 1200,
    extra: 'not allowed',
  });
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  assert.ok(errors.some((error) => error.property === 'calories'));
  assert.ok(errors.some((error) => error.property === 'proteinGrams'));
  assert.ok(errors.some((error) => error.property === 'extra'));
});
