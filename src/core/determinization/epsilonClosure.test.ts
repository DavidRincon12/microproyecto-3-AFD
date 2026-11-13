import { describe, expect, it } from 'vitest';
import { fromJson, type AutomatonJson } from '../model';
import { epsilonClosure } from './index';

const automaton = (transitions: AutomatonJson['transitions']) =>
  fromJson({ states: ['q0', 'q1', 'q2'], alphabet: ['a'], initial: 'q0', finals: [], transitions });

describe('epsilonClosure', () => {
  it('devuelve el mismo estado si no tiene transiciones ε', () => {
    expect([...epsilonClosure(automaton([['q0', 'a', 'q1']]), ['q0'])]).toEqual(['q0']);
  });

  it('sigue cadenas de transiciones ε', () => {
    const a = automaton([
      ['q0', 'ε', 'q1'],
      ['q1', 'ε', 'q2'],
    ]);
    expect(new Set(epsilonClosure(a, ['q0']))).toEqual(new Set(['q0', 'q1', 'q2']));
  });

  it('termina aunque haya un ciclo de ε', () => {
    const a = automaton([
      ['q0', 'ε', 'q1'],
      ['q1', 'ε', 'q0'],
    ]);
    expect(new Set(epsilonClosure(a, ['q0']))).toEqual(new Set(['q0', 'q1']));
  });

  it('une las clausuras de varios estados de partida', () => {
    const a = automaton([['q1', 'ε', 'q2']]);
    expect(new Set(epsilonClosure(a, ['q0', 'q1']))).toEqual(new Set(['q0', 'q1', 'q2']));
  });
});
