import { describe, expect, it } from 'vitest';
import { ERROR_STATE, indexToLetterState, mergedName, subsetName } from './index';

describe('indexToLetterState', () => {
  it('convierte los primeros 26 índices a letras mayúsculas de A a Z', () => {
    expect(indexToLetterState(0)).toBe('A');
    expect(indexToLetterState(1)).toBe('B');
    expect(indexToLetterState(25)).toBe('Z');
  });

  it('asigna sufijo numérico cuando supera los 26 estados', () => {
    expect(indexToLetterState(26)).toBe('A1');
    expect(indexToLetterState(27)).toBe('B1');
    expect(indexToLetterState(51)).toBe('Z1');
    expect(indexToLetterState(52)).toBe('A2');
  });
});

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
