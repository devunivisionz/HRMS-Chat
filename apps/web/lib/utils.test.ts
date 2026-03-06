import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles conditional classes', () => {
    expect(cn('a', true && 'b', false && 'c')).toBe('a b');
  });

  it('handles tailwind merges', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('filters out falsy values', () => {
    expect(cn('a', null, undefined, false, 'b')).toBe('a b');
  });
});
