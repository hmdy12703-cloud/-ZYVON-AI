import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { NutritionService } from '../src/nutrition/nutrition.service';
import { AdminService } from '../src/admin/admin.service';
import { PrismaService } from '../src/prisma/prisma.service';

test('persists nutrition logs per user and supports admin exercise publishing', async () => {
  const prisma = new PrismaClient();
  const nutrition = new NutritionService(prisma as unknown as PrismaService);
  const admin = new AdminService(prisma as unknown as PrismaService);
  const suffix = randomUUID();
  let ownerId: string | undefined;
  let otherId: string | undefined;
  let exerciseId: string | undefined;

  try {
    const owner = await prisma.user.create({
      data: { email: `owner-${suffix}@zyvon.test`, passwordHash: 'integration-test-hash' },
      select: { id: true },
    });
    ownerId = owner.id;
    const other = await prisma.user.create({
      data: { email: `other-${suffix}@zyvon.test`, passwordHash: 'integration-test-hash' },
      select: { id: true },
    });
    otherId = other.id;

    await nutrition.create(owner.id, { calories: 620, proteinGrams: 32, notes: 'Integration meal' });
    const ownerLogs = await nutrition.list(owner.id);
    const otherLogs = await nutrition.list(other.id);
    assert.equal(ownerLogs.length, 1);
    assert.equal(ownerLogs[0]?.calories, 620);
    assert.equal(otherLogs.length, 0);

    const exercise = await admin.createExercise({
      slug: `integration-exercise-${suffix}`,
      nameAr: 'تمرين اختبار',
      nameEn: 'Integration test exercise',
      descriptionAr: 'وصف للاختبار',
      descriptionEn: 'Description for integration test',
      instructionsAr: 'تعليمات الاختبار',
      instructionsEn: 'Test instructions',
      primaryMuscles: ['Legs'],
      equipment: [],
      difficulty: 'BEGINNER',
      safetyNotesAr: 'توقف عند الألم',
      safetyNotesEn: 'Stop if painful',
    });
    exerciseId = exercise.id;
    assert.equal(exercise.status, 'DRAFT');

    const published = await admin.updateExerciseStatus(exercise.id, { status: 'PUBLISHED' });
    assert.equal(published.status, 'PUBLISHED');
    const listed = await admin.listExercises();
    assert.ok(listed.some((item) => item.id === exercise.id));
  } finally {
    if (exerciseId) await prisma.exercise.delete({ where: { id: exerciseId } }).catch(() => undefined);
    if (ownerId) await prisma.user.delete({ where: { id: ownerId } }).catch(() => undefined);
    if (otherId) await prisma.user.delete({ where: { id: otherId } }).catch(() => undefined);
    await prisma.$disconnect();
  }
});
