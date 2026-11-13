import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ForbiddenException } from '@nestjs/common';
import { AdminGuard } from '../src/admin/admin.guard';

function context(user?: { role: 'USER' | 'ADMIN' }) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as never;
}

test('allows authenticated administrators', () => {
  const guard = new AdminGuard();
  assert.equal(guard.canActivate(context({ role: 'ADMIN' })), true);
});

test('blocks regular users and missing identities', () => {
  const guard = new AdminGuard();
  assert.throws(() => guard.canActivate(context({ role: 'USER' })), ForbiddenException);
  assert.throws(() => guard.canActivate(context()), ForbiddenException);
});
