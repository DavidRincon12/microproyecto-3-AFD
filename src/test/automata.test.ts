import { describe, expect, it } from 'vitest';
import { fromJson } from '../core/model';
import { acceptsNfa, expectSameAutomaton } from './automata';

const nfa = fromJson({
  states: ['q0', 'q1', 'q2'],
  alphabet: ['a'],
  initial: 'q0',
  finals: ['q2'],
  transitions: [
    ['q0', 'ε', 'q1'],
    ['q1', 'a', 'q2'],
  ],
});

describe('acceptsNfa', () => {
  it('acepta una cadena que llega a un final pasando por ε', () => {
    expect(acceptsNfa(nfa, 'a')).toBe(true);
  });

  it('rechaza la cadena vacía si la clausura del inicial no tiene finales', () => {
    expect(acceptsNfa(nfa, '')).toBe(false);
  });

  it('rechaza una cadena sin transiciones disponibles', () => {
    expect(acceptsNfa(nfa, 'aa')).toBe(false);
  });
});

describe('expectSameAutomaton', () => {
  it('acepta las mismas transiciones en otro orden', () => {
    expectSameAutomaton(nfa, {
      states: ['q2', 'q1', 'q0'],
      alphabet: ['a'],
      initial: 'q0',
      finals: ['q2'],
      transitions: [
        ['q1', 'a', 'q2'],
        ['q0', 'ε', 'q1'],
      ],
    });
  });

  it('falla si cambia un estado final', () => {
    expect(() =>
      expectSameAutomaton(nfa, {
        states: ['q0', 'q1', 'q2'],
        alphabet: ['a'],
        initial: 'q0',
        finals: ['q1'],
        transitions: [
          ['q0', 'ε', 'q1'],
          ['q1', 'a', 'q2'],
        ],
      }),
    ).toThrow();
  });
});
