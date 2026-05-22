import {
  normalizeErrors,
  normalizeFirstError,
} from '../../src/internal/errors.js';

describe('error normalization', () => {
  it('returns the first public error from nested error values', () => {
    expect(normalizeFirstError([null, undefined, ['Nested']])).toBe('Nested');
    expect(normalizeFirstError([])).toBeUndefined();
    expect(normalizeFirstError(false)).toBeUndefined();
  });

  it('normalizes common error shapes to strings', () => {
    expect(normalizeFirstError(new Error('Exploded'))).toBe('Exploded');
    expect(normalizeFirstError({ message: 'Message property' })).toBe(
      'Message property',
    );
    expect(normalizeFirstError({ code: 'invalid' })).toBe('{"code":"invalid"}');
    expect(normalizeFirstError(404)).toBe('404');
  });

  it('normalizes form error collections', () => {
    expect(normalizeErrors('Form error')).toEqual(['Form error']);
    expect(normalizeErrors(undefined)).toEqual([]);
    expect(normalizeErrors([undefined, 'First', ['Second']])).toEqual([
      'First',
      'Second',
    ]);
  });
});
