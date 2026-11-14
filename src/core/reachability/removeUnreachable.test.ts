import { describe, expect, it } from 'vitest';
import { fromJson, type AutomatonJson } from '../model';
import { removeUnreachable } from './removeUnreachable';

import afdInaccesiblesFixture from '../__fixtures__/afd-con-inaccesibles.json';
import minClase6Fixture from '../__fixtures__/min-clase-6-estados.json';

describe('removeUnreachable (RF-07)', () => {
  it('elimina exactamente los estados inaccesibles D y E en afd-con-inaccesibles', () => {
    const automaton = fromJson(afdInaccesiblesFixture.automaton as AutomatonJson);
    const result = removeUnreachable(automaton);

    expect(result.automaton.states.has('D')).toBe(false);
    expect(result.automaton.states.has('E')).toBe(false);
    expect([...result.automaton.states]).toEqual(['A', 'B', 'C']);
    expect([...result.automaton.finals]).toEqual(['C']);
    expect(result.summary).toContain('Se eliminaron 2 estado(s) inaccesible(s)');
  });

  it('no modifica un autómata donde todos los estados son accesibles', () => {
    const automaton = fromJson(minClase6Fixture.automaton as AutomatonJson);
    const result = removeUnreachable(automaton);

    expect([...result.automaton.states]).toEqual([...automaton.states]);
    expect(result.summary).toContain('Todos los estados son accesibles');
  });

  it('deja el autómata sin estados finales si el único final era inaccesible', () => {
    const automaton = fromJson({
      states: ['q0', 'q1', 'q_final_inaccesible'],
      alphabet: ['0'],
      initial: 'q0',
      finals: ['q_final_inaccesible'],
      transitions: [['q0', '0', 'q1']],
    });
    const result = removeUnreachable(automaton);

    expect(result.automaton.finals.size).toBe(0);
    expect(result.automaton.states.has('q_final_inaccesible')).toBe(false);
  });

  it('no cambia un autómata de un solo estado', () => {
    const automaton = fromJson({
      states: ['q0'],
      alphabet: ['0', '1'],
      initial: 'q0',
      finals: ['q0'],
      transitions: [
        ['q0', '0', 'q0'],
        ['q0', '1', 'q0'],
      ],
    });
    const result = removeUnreachable(automaton);

    expect([...result.automaton.states]).toEqual(['q0']);
    expect(result.automaton.finals.has('q0')).toBe(true);
  });
});
