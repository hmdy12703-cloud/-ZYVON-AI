import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CoachMessageDto } from '../src/coach/dto/coach-message.dto';

test('accepts a non-empty coach question within the length limit', async () => {
  const dto = plainToInstance(CoachMessageDto, { message: 'How should I warm up?' });
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  assert.equal(errors.length, 0);
});

test('rejects empty, oversized, and unexpected coach payload fields', async () => {
  const empty = plainToInstance(CoachMessageDto, { message: ' ' });
  const whitespace = plainToInstance(CoachMessageDto, { message: '   ' });
  const oversized = plainToInstance(CoachMessageDto, { message: 'x'.repeat(1001) });
  const unexpected = plainToInstance(CoachMessageDto, { message: 'hello', userId: 'another-user' });
  assert.ok((await validate(empty)).length > 0);
  assert.ok((await validate(whitespace)).length > 0);
  assert.ok((await validate(oversized)).length > 0);
  assert.ok((await validate(unexpected, { whitelist: true, forbidNonWhitelisted: true })).length > 0);
});
