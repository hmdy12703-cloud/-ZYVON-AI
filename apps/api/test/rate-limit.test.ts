import test from 'node:test';
import assert from 'node:assert/strict';
import type { NextFunction, Request, Response } from 'express';
import { createIpRateLimit } from '../src/security/ip-rate-limit';

function makeRequest(ip: string) {
  return { ip, socket: { remoteAddress: ip } } as Request;
}

function makeResponse() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let body: unknown;
  const response = {
    setHeader(name: string, value: string) { headers[name] = value; return this; },
    status(code: number) { statusCode = code; return this; },
    json(value: unknown) { body = value; return this; },
  } as unknown as Response;
  return { response, headers, get statusCode() { return statusCode; }, get body() { return body; } };
}

test('allows requests up to the configured per-IP limit', () => {
  const middleware = createIpRateLimit({ windowMs: 60_000, maxRequests: 2, message: 'Too many attempts' });
  let nextCalls = 0;
  const next = (() => { nextCalls += 1; }) as NextFunction;

  for (let index = 0; index < 2; index += 1) {
    middleware(makeRequest('192.0.2.1'), makeResponse().response, next);
  }

  assert.equal(nextCalls, 2);
});

test('blocks requests above the limit and provides a retry delay', () => {
  const middleware = createIpRateLimit({ windowMs: 60_000, maxRequests: 1, message: 'Too many attempts' }, () => 1_000);
  let nextCalls = 0;
  const next = (() => { nextCalls += 1; }) as NextFunction;

  middleware(makeRequest('192.0.2.2'), makeResponse().response, next);
  assert.equal(nextCalls, 1);
  const blocked = makeResponse();
  middleware(makeRequest('192.0.2.2'), blocked.response, next);

  assert.equal(nextCalls, 1);
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.headers['Retry-After'], '60');
  assert.equal(blocked.headers['RateLimit-Remaining'], '0');
  assert.deepEqual(blocked.body, {
    statusCode: 429,
    message: 'Too many attempts',
    retryAfterSeconds: 60,
  });
});

test('tracks different client IP addresses independently', () => {
  const middleware = createIpRateLimit({ windowMs: 60_000, maxRequests: 1, message: 'Too many attempts' });
  let nextCalls = 0;
  const next = (() => { nextCalls += 1; }) as NextFunction;

  middleware(makeRequest('192.0.2.3'), makeResponse().response, next);
  middleware(makeRequest('192.0.2.4'), makeResponse().response, next);

  assert.equal(nextCalls, 2);
});

test('resets a client bucket after its time window', () => {
  let currentTime = 10_000;
  const middleware = createIpRateLimit({ windowMs: 1_000, maxRequests: 1, message: 'Too many attempts' }, () => currentTime);
  let nextCalls = 0;
  const next = (() => { nextCalls += 1; }) as NextFunction;

  middleware(makeRequest('192.0.2.5'), makeResponse().response, next);
  const blocked = makeResponse();
  middleware(makeRequest('192.0.2.5'), blocked.response, next);
  assert.equal(blocked.statusCode, 429);

  currentTime += 1_001;
  middleware(makeRequest('192.0.2.5'), makeResponse().response, next);
  assert.equal(nextCalls, 2);
});
