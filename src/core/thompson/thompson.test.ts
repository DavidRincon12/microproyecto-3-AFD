import { describe, expect, it } from 'vitest';
import { acceptsNfa } from '../../test/automata';
import { toJson } from '../model';
import { parseRegex } from '../regex';
import { thompson } from './index';

const build = (regex: string, alphabet = ['a', 'b']) =>
  thompson(parseRegex(regex, new Set(alphabet)), new Set(alphabet));

describe('thompson: estructura', () => {
  it.each([
    ['a', 2, 1],
    ['ab', 4, 3],
    ['a|b', 6, 6],
    ['a*', 4, 5],
    ['ε', 2, 1],
  ])('%j produce %i estados y %i transiciones', (regex, states, transitions) => {
    const json = toJson(build(regex).automaton);
    expect(json.states).toHaveLength(states);
    expect(json.transitions).toHaveLength(transitions);
  });

  it('nombra los estados q0, q1… en el orden en que se crean', () => {
    const json = toJson(build('a|b').automaton);
    expect(json.states).toEqual(['q0', 'q1', 'q2', 'q3', 'q4', 'q5']);
    expect(json.initial).toBe('q4');
    expect(json.finals).toEqual(['q5']);
  });

  it('produce un solo estado final', () => {
    expect(build('(a|b)*abb').automaton.finals.size).toBe(1);
  });

  it('conserva el alfabeto recibido', () => {
    expect([...build('a', ['a', 'b']).automaton.alphabet]).toEqual(['a', 'b']);
  });
});

describe('thompson: lenguaje', () => {
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

describe('thompson: explicación', () => {
  it('genera la etapa de construcción con un paso por nodo de la expresión', () => {
    const stage = build('a|b');
    expect(stage.stage).toBe('construction');
    expect(stage.title).toBe('Construcción del AFND-ε (Thompson)');
    expect(stage.steps).toHaveLength(3);
  });

  it('explica la unión con los estados que crea', () => {
    const union = build('a|b').steps[2];
    expect(union.title).toBe('Unión de a y b');
    expect(union.detail).toContain('q4');
    expect(union.detail).toContain('q5');
  });

  it('resume el autómata construido', () => {
    expect(build('a').summary).toBe('AFND-ε con 2 estados: inicial q0 y final q1.');
  });
});
