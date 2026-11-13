import { describe, expect, it } from 'vitest';
import { acceptsNfa, expectSameAutomaton } from '../../test/automata';
import { ValidationError, fromJson, toJson, type AutomatonJson } from '../model';
import { parseRegex } from '../regex';
import { thompson } from '../thompson';
import { determinize } from './index';

// Ejemplo de clase con A, B, C (presentación de conversión AFND-AFD).
const claseAbc: AutomatonJson = {
  states: ['A', 'B', 'C'],
  alphabet: ['0', '1'],
  initial: 'A',
  finals: ['C'],
  transitions: [
    ['A', '0', 'B'],
    ['A', '1', 'A'],
    ['A', '1', 'C'],
    ['B', '0', 'C'],
    ['C', '1', 'B'],
  ],
};

// Ejemplo de clase con q0, q1, q2; los símbolos a1 y a2 se renombran a a y b.
const claseQ: AutomatonJson = {
  states: ['q0', 'q1', 'q2'],
  alphabet: ['a', 'b'],
  initial: 'q0',
  finals: ['q2'],
  transitions: [
    ['q0', 'a', 'q1'],
    ['q0', 'b', 'q2'],
    ['q1', 'b', 'q0'],
    ['q1', 'b', 'q2'],
    ['q2', 'a', 'q2'],
    ['q2', 'b', 'q2'],
  ],
};

const fromRegex = (regex: string, alphabet: string[]) =>
  thompson(parseRegex(regex, new Set(alphabet)), new Set(alphabet)).automaton;

describe('determinize: ejemplos de clase', () => {
  it('convierte el ejemplo A, B, C con su estado error', () => {
    expectSameAutomaton(determinize(fromJson(claseAbc)).automaton, {
      states: ['A', 'B', 'AC', 'C', 'error', 'ABC', 'BC'],
      alphabet: ['0', '1'],
      initial: 'A',
      finals: ['AC', 'C', 'ABC', 'BC'],
      transitions: [
        ['A', '0', 'B'],
        ['A', '1', 'AC'],
        ['B', '0', 'C'],
        ['B', '1', 'error'],
        ['AC', '0', 'B'],
        ['AC', '1', 'ABC'],
        ['C', '0', 'error'],
        ['C', '1', 'B'],
        ['error', '0', 'error'],
        ['error', '1', 'error'],
        ['ABC', '0', 'BC'],
        ['ABC', '1', 'ABC'],
        ['BC', '0', 'C'],
        ['BC', '1', 'B'],
      ],
    });
  });

  it('convierte el ejemplo q0, q1, q2', () => {
    expectSameAutomaton(determinize(fromJson(claseQ)).automaton, {
      states: ['q0', 'q1', 'q2', 'error', 'q0q2', 'q1q2'],
      alphabet: ['a', 'b'],
      initial: 'q0',
      finals: ['q2', 'q0q2', 'q1q2'],
      transitions: [
        ['q0', 'a', 'q1'],
        ['q0', 'b', 'q2'],
        ['q1', 'a', 'error'],
        ['q1', 'b', 'q0q2'],
        ['q2', 'a', 'q2'],
        ['q2', 'b', 'q2'],
        ['error', 'a', 'error'],
        ['error', 'b', 'error'],
        ['q0q2', 'a', 'q1q2'],
        ['q0q2', 'b', 'q2'],
        ['q1q2', 'a', 'q2'],
        ['q1q2', 'b', 'q0q2'],
      ],
    });
  });

  it('guarda en origin el subconjunto de cada estado', () => {
    const origin = determinize(fromJson(claseAbc)).automaton.origin;
    expect(origin?.get('AC')).toEqual(new Set(['A', 'C']));
  });
});

describe('determinize: casos borde', () => {
  it('deja con los mismos nombres un autómata que ya es determinista', () => {
    const dfa: AutomatonJson = {
      states: ['A', 'B'],
      alphabet: ['0'],
      initial: 'A',
      finals: ['B'],
      transitions: [
        ['A', '0', 'B'],
        ['B', '0', 'A'],
      ],
    };
    expectSameAutomaton(determinize(fromJson(dfa)).automaton, dfa);
  });

  it('convierte un estado sin transiciones en ese estado más error', () => {
    const single = fromJson({
      states: ['q0'],
      alphabet: ['a'],
      initial: 'q0',
      finals: [],
      transitions: [],
    });
    expect(toJson(determinize(single).automaton).states).toEqual(['q0', 'error']);
  });

  it('usa llaves cuando la concatenación coincide con el nombre de otro estado', () => {
    const json = toJson(
      determinize(
        fromJson({
          states: ['A', 'B', 'AB'],
          alphabet: ['a', 'b'],
          initial: 'A',
          finals: ['AB'],
          transitions: [
            ['A', 'a', 'A'],
            ['A', 'a', 'B'],
            ['A', 'b', 'AB'],
          ],
        }),
      ).automaton,
    );
    expect(json.states).toContain('{A,B}');
    expect(json.states).toContain('AB');
  });

  it('produce un AFD equivalente a partir de un AFND-ε de Thompson', () => {
    const dfa = determinize(fromRegex('(a|b)*abb', ['a', 'b'])).automaton;
    for (const state of dfa.states) {
      for (const symbol of dfa.alphabet) expect(dfa.delta.get(state)?.get(symbol)?.size).toBe(1);
    }
    for (const word of ['abb', 'aabb', 'babb']) expect(acceptsNfa(dfa, word)).toBe(true);
    for (const word of ['', 'ab', 'abba']) expect(acceptsNfa(dfa, word)).toBe(false);
  });

  it('se detiene con un error claro si el AFD supera 200 estados', () => {
    const nfa = fromRegex('(a|b)*a(a|b)(a|b)(a|b)(a|b)(a|b)(a|b)(a|b)', ['a', 'b']);
    const attempt = () => determinize(nfa);
    expect(attempt).toThrow(ValidationError);
    expect(attempt).toThrow('más de 200 estados');
  });
});

describe('determinize: explicación', () => {
  it('genera la etapa con un paso por estado procesado y la tabla final', () => {
    const stage = determinize(fromJson(claseAbc));
    expect(stage.stage).toBe('determinization');
    expect(stage.title).toBe('Conversión AFND → AFD');
    expect(stage.steps).toHaveLength(8);
    expect(stage.summary).toBe('El AFD tiene 7 estados, incluido el estado error.');
  });

  it('explica cada símbolo como en clase', () => {
    const stepAC = determinize(fromJson(claseAbc)).steps.find((step) => step.title === 'Estado AC');
    expect(stepAC?.table?.headers).toEqual(['Símbolo', 'Desde cada estado', 'Unión', 'Resultado']);
    expect(stepAC?.table?.rows).toContainEqual(['1', 'A,1→AC · C,1→B', '{A, B, C}', 'ABC (nuevo)']);
    expect(stepAC?.table?.rows).toContainEqual(['0', 'A,0→B · C,0→∅', '{B}', 'B']);
  });

  it('empieza por la clausura-ε del inicial cuando hay transiciones ε', () => {
    const stage = determinize(fromRegex('ab', ['a', 'b']));
    expect(stage.steps[0].title).toBe('Clausura-ε de {q0}');
    expect(stage.steps[1].table?.headers).toContain('Clausura-ε');
  });
});
