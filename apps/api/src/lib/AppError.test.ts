import { describe, expect, it } from 'vitest';

import { AppError } from './AppError';

describe('AppError', () => {
  it('creates error with code and status', () => {
    const err = new AppError('NOT_FOUND', 404, 'Resource not found');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Resource not found');
  });

  it('defaults message to code when not provided', () => {
    const err = new AppError('UNAUTHORIZED', 401);
    expect(err.message).toBe('UNAUTHORIZED');
  });

  it('is instance of Error', () => {
    const err = new AppError('TEST', 500);
    expect(err).toBeInstanceOf(Error);
  });
});
