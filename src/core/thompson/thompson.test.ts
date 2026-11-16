import { describe, expect, it } from 'vitest';
import { acceptsNfa } from '../../test/automata';
import { toJson } from '../model';
import { parseRegex } from '../regex';
import { thompson } from './index';

const build = (regex: string, alphabet = ['a', 'b']) =>
  thompson(parseRegex(regex, new Set(alphabet)), new Set(alphabet));

describe('construcción de autómata (posiciones sin transiciones vacías): estructura', () => {
  it.each([
    ['a', 2, 1],
    ['ab', 3, 2],
    ['a|b', 3, 2],
    ['a*', 2, 2],
    ['ε', 1, 0],
  ])('%j produce %i estados y %i transiciones', (regex, states, transitions) => {
    const json = toJson(build(regex).automaton);
    expect(json.states).toHaveLength(states);
    expect(json.transitions).toHaveLength(transitions);
  });

  it('nombra los estados con letras mayúsculas iniciando en A', () => {
    const json = toJson(build('a|b').automaton);
    expect(json.states).toEqual(['A', 'B', 'C']);
    expect(json.initial).toBe('A');
    expect(json.finals).toEqual(['B', 'C']);
  });

  it('no contiene ninguna transición vacía (sin ε ni λ)', () => {
    const json = toJson(build('(a|b)*abb').automaton);
    for (const [, sym] of json.transitions) {
      expect(sym).not.toBe('ε');
      expect(sym).not.toBe('λ');
    }
  });

  it('produce un solo estado final para (a|b)*abb', () => {
    expect(build('(a|b)*abb').automaton.finals.size).toBe(1);
  });

  it('conserva el alfabeto recibido', () => {
    expect([...build('a', ['a', 'b']).automaton.alphabet]).toEqual(['a', 'b']);
  });
});

describe('construcción de autómata: lenguaje', () => {
  it.each([
    ['(a|b)*abb', ['abb', 'aabb', 'babb'], ['', 'ab', 'abba']],
    ['ε', [''], ['a']],
    ['(a*)*', ['', 'aaa'], ['b']],
    ['a+', ['a', 'aa'], ['']],
    ['a?', ['', 'a'], ['aa']],
  ])('%j acepta %j y rechaza %j', (regex, accepted, rejected) => {
    const nfa = build(regex as string).automaton;
    for (const word of accepted as string[]) expect(acceptsNfa(nfa, word)).toBe(true);
    for (const word of rejected as string[]) expect(acceptsNfa(nfa, word)).toBe(false);
  });
});

describe('construcción de autómata: explicación', () => {
  it('genera la etapa de construcción con los pasos del método de posiciones', () => {
    const stage = build('a|b');
    expect(stage.stage).toBe('construction');
    expect(stage.title).toBe('Construcción del AFND (Autómata de Posiciones)');
    expect(stage.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('explica las posiciones y los estados asignados', () => {
    const step = build('a|b').steps[0];
    expect(step.title).toContain('posiciones');
    expect(step.table?.headers).toContain('Estado asignado');
  });

  it('resume el autómata construido sin transiciones vacías', () => {
    expect(build('a').summary).toContain('sin transiciones vacías');
  });
});
