import { describe, expect, it } from 'vitest';
import { fromJson, type AutomatonJson } from '../model';
import { minimize } from './minimize';

import afdFusionFixture from '../__fixtures__/afd-fusion-transitiva.json';
import afdIncompletoFixture from '../__fixtures__/afd-incompleto.json';
import afdYaMinimoFixture from '../__fixtures__/afd-ya-minimo.json';
import minClase6Fixture from '../__fixtures__/min-clase-6-estados.json';

describe('minimize (RF-09)', () => {
  it('minimiza min-clase-6-estados fusionando (B,E) y (C,F)', () => {
    const dfa = fromJson(minClase6Fixture.automaton as AutomatonJson);
    const result = minimize(dfa);

    expect([...result.automaton.states]).toEqual(['A', '(B,E)', '(C,F)', 'D']);
    expect(result.automaton.initial).toBe('A');
    expect([...result.automaton.finals]).toEqual(['D']);
    expect(result.summary).toContain('minimizó');
  });

  it('conserva los estados en afd-ya-minimo', () => {
    const dfa = fromJson(afdYaMinimoFixture.automaton as AutomatonJson);
    const result = minimize(dfa);

    expect([...result.automaton.states]).toEqual(['q0', 'q1']);
    expect(result.summary).toContain('ya era mínimo');
  });

  it('completa con error en afd-incompleto y produce autómata completo', () => {
    const dfa = fromJson(afdIncompletoFixture.automaton as AutomatonJson);
    const result = minimize(dfa);

    expect(result.steps[0].title).toContain('error');
    // Todos los estados deben tener transiciones para 0 y 1
    for (const s of result.automaton.states) {
      for (const a of result.automaton.alphabet) {
        expect(result.automaton.delta.get(s)?.get(a)?.size).toBe(1);
      }
    }
  });

  it('fusiona transitivamente tres estados en afd-fusion-transitiva', () => {
    const dfa = fromJson(afdFusionFixture.automaton as AutomatonJson);
    const result = minimize(dfa);

    const hasGroup3 = [...result.automaton.states].some(
      (s) => s.includes('B') && s.includes('E') && s.includes('G'),
    );
    expect(hasGroup3).toBe(true);
  });

  it('reduce a un solo estado un AFD completo con todos los estados finales', () => {
    const dfa = fromJson({
      states: ['A', 'B'],
      alphabet: ['0'],
      initial: 'A',
      finals: ['A', 'B'],
      transitions: [
        ['A', '0', 'B'],
        ['B', '0', 'A'],
      ],
    });
    const result = minimize(dfa);

    expect(result.automaton.states.size).toBe(1);
    expect(result.automaton.finals.size).toBe(1);
  });

  it('preserva origin con los estados originales de cada grupo', () => {
    const dfa = fromJson(minClase6Fixture.automaton as AutomatonJson);
    const result = minimize(dfa);

    const origin = result.automaton.origin;
    expect(origin).toBeDefined();
    expect(origin?.get('(B,E)')).toEqual(new Set(['B', 'E']));
    expect(origin?.get('(C,F)')).toEqual(new Set(['C', 'F']));
    expect(origin?.get('A')).toEqual(new Set(['A']));
    expect(origin?.get('D')).toEqual(new Set(['D']));
  });
});
