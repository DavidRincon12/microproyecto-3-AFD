import { describe, expect, it } from 'vitest';
import { fromJson, ValidationError, type AutomatonJson } from '../model';
import { simulate } from './simulate';

import afdIncompletoFixture from '../__fixtures__/afd-incompleto.json';
import minClase6Fixture from '../__fixtures__/min-clase-6-estados.json';

describe('simulate (RF-12)', () => {
  const dfa = fromJson(minClase6Fixture.automaton as AutomatonJson);

  it('acepta las cadenas esperadas de min-clase-6-estados', () => {
    for (const word of minClase6Fixture.expected.accepts) {
      const res = simulate(dfa, word);
      expect(res.accepted).toBe(true);
      expect(res.path.length).toBe(word.length);
    }
  });

  it('rechaza las cadenas esperadas de min-clase-6-estados', () => {
    for (const word of minClase6Fixture.expected.rejects) {
      const res = simulate(dfa, word);
      expect(res.accepted).toBe(false);
    }
  });

  it('rechaza la cadena vacía si el estado inicial no es final', () => {
    const res = simulate(dfa, '');
    expect(res.accepted).toBe(false);
    expect(res.path.length).toBe(0);
    expect(res.reason).toContain('inicial');
  });

  it('acepta la cadena vacía si el estado inicial es final', () => {
    const dfaInitialFinal = fromJson({
      states: ['q0', 'q1'],
      alphabet: ['0'],
      initial: 'q0',
      finals: ['q0'],
      transitions: [['q0', '0', 'q1']],
    });
    const res = simulate(dfaInitialFinal, '');
    expect(res.accepted).toBe(true);
  });

  it('lanza ValidationError con posición cuando un símbolo no está en el alfabeto', () => {
    expect(() => simulate(dfa, '0x1')).toThrow(ValidationError);
    try {
      simulate(dfa, '0x1');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      const valErr = e as ValidationError;
      expect(valErr.field).toBe('word');
      expect(valErr.position).toBe(2);
    }
  });

  it('se detiene y rechaza con razón descriptiva cuando falta una transición en un AFD incompleto', () => {
    const incompleteDfa = fromJson(afdIncompletoFixture.automaton as AutomatonJson);
    const res = simulate(incompleteDfa, '1'); // A no tiene transición para 1
    expect(res.accepted).toBe(false);
    expect(res.reason).toContain('No existe transición');
    expect(res.path.length).toBe(0);
  });

  it('el recorrido en un AFD completo tiene tantas transiciones como caracteres', () => {
    const res = simulate(dfa, '00');
    expect(res.path).toEqual([
      { from: 'A', symbol: '0', to: 'B' },
      { from: 'B', symbol: '0', to: 'D' },
    ]);
    expect(res.finalState).toBe('D');
    expect(res.accepted).toBe(true);
  });
});
