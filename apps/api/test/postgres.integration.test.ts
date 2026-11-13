import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { FitnessGoal, PrismaClient } from '@prisma/client';

test('PostgreSQL persists a user-owned training plan and completed workout', async () => {
  const prisma = new PrismaClient();
  const email = `integration-${randomUUID()}@zyvon.test`;
  let userId: string | undefined;

  try {
    await prisma.$connect();
    const user = await prisma.user.create({
      data: { email, passwordHash: 'integration-test-only-hash' },
      select: { id: true },
    });
    userId = user.id;

    const plan = await prisma.trainingPlan.create({
      data: {
        userId,
        title: 'Integration test plan',
        goal: FitnessGoal.GENERAL,
      },
      select: { id: true, userId: true },
    });
    assert.equal(plan.userId, userId);

    const workout = await prisma.workoutSession.create({
      data: { userId, trainingPlanId: plan.id },
      select: { id: true, status: true, trainingPlanId: true },
    });
    assert.equal(workout.status, 'IN_PROGRESS');
    assert.equal(workout.trainingPlanId, plan.id);

    await prisma.workoutSession.update({
      where: { id: workout.id },
      data: { status: 'COMPLETED', completedAt: new Date(), perceivedEffort: 6, feedback: 'Integration test complete' },
    });

    const persisted = await prisma.workoutSession.findFirst({
      where: { id: workout.id, userId },
      select: { status: true, perceivedEffort: true, feedback: true, trainingPlanId: true },
    });
    assert.deepEqual(persisted, {
      status: 'COMPLETED',
      perceivedEffort: 6,
      feedback: 'Integration test complete',
      trainingPlanId: plan.id,
    });
  } finally {
    if (userId) await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  }
});
