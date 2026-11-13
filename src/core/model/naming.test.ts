import { describe, expect, it } from 'vitest';
import { ERROR_STATE, mergedName, subsetName } from './index';

describe('subsetName', () => {
  it('concatena los estados en el orden del autómata original', () => {
    expect(subsetName(['q2', 'q0'], ['q0', 'q1', 'q2'])).toBe('q0q2');
  });

  it('nombra error al subconjunto vacío', () => {
    expect(subsetName([], ['q0'])).toBe(ERROR_STATE);
  });

  it('conserva el nombre de un subconjunto de un estado', () => {
    expect(subsetName(['B'], ['A', 'B'])).toBe('B');
  });
});

describe('mergedName', () => {
  it('une un grupo entre paréntesis y en el orden original', () => {
    expect(mergedName(['E', 'B'], ['A', 'B', 'C', 'D', 'E'])).toBe('(B,E)');
  });

  it('conserva el nombre de un grupo de un estado', () => {
    expect(mergedName(['A'], ['A', 'B'])).toBe('A');
  });
});
