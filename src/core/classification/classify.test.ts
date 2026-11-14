import { describe, expect, it } from 'vitest';
import { fromJson, type AutomatonJson } from '../model';
import { classify } from './classify';

import afdIncompletoFixture from '../__fixtures__/afd-incompleto.json';
import afndAbcFixture from '../__fixtures__/afnd-clase-abc.json';
import minClase6Fixture from '../__fixtures__/min-clase-6-estados.json';

describe('classify (RF-05)', () => {
  it('clasifica min-clase-6-estados como determinista y completo', () => {
    const automaton = fromJson(minClase6Fixture.automaton as AutomatonJson);
    const result = classify(automaton);

    expect(result.deterministic).toBe(true);
    expect(result.complete).toBe(true);
    expect(result.summary).toContain('determinista y completo');
    expect(result.stage).toBe('classification');
    expect(result.automaton).toBe(automaton);
  });

  it('clasifica afnd-clase-abc como no determinista con detalle en delta(A, 1)', () => {
    const automaton = fromJson(afndAbcFixture.automaton as AutomatonJson);
    const result = classify(automaton);

    expect(result.deterministic).toBe(false);
    expect(result.summary).toContain('no es determinista');
    const hasA1 = result.steps.some(
      (s) => s.detail.includes('A') && s.detail.includes('1') && s.detail.includes('C'),
    );
    expect(hasA1).toBe(true);
  });

  it('clasifica como no determinista un autómata con transiciones epsilon', () => {
    const automaton = fromJson({
      states: ['q0', 'q1'],
      alphabet: ['a'],
      initial: 'q0',
      finals: ['q1'],
      transitions: [['q0', 'ε', 'q1']],
    });
    const result = classify(automaton);

    expect(result.deterministic).toBe(false);
    expect(result.steps.some((s) => s.detail.includes('ε'))).toBe(true);
  });

  it('clasifica afd-incompleto como determinista pero no completo', () => {
    const automaton = fromJson(afdIncompletoFixture.automaton as AutomatonJson);
    const result = classify(automaton);

    expect(result.deterministic).toBe(true);
    expect(result.complete).toBe(false);
    expect(result.steps.some((s) => s.detail.includes('error'))).toBe(true);
  });

  it('reporta múltiples motivos de no determinismo cuando existen varios', () => {
    const automaton = fromJson({
      states: ['q0', 'q1'],
      alphabet: ['a', 'b'],
      initial: 'q0',
      finals: ['q1'],
      transitions: [
        ['q0', 'a', 'q0'],
        ['q0', 'a', 'q1'],
        ['q0', 'ε', 'q1'],
      ],
    });
    const result = classify(automaton);

    expect(result.deterministic).toBe(false);
    expect(result.steps.length).toBeGreaterThanOrEqual(2);
  });
});
