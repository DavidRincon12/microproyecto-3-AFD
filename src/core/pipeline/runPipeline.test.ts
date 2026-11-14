import { describe, expect, it } from 'vitest';
import { fromJson, ValidationError, type AutomatonJson } from '../model';
import { simulate } from '../simulation';
import { runPipeline } from './runPipeline';

import minClase6Fixture from '../__fixtures__/min-clase-6-estados.json';

describe('runPipeline (RF-10, RF-13)', () => {
  it('ejecuta las 5 etapas en orden para (a|b)*abb y produce un AFD mínimo de 4 estados', () => {
    const result = runPipeline({
      mode: 'language',
      alphabet: 'a,b',
      regex: '(a|b)*abb',
    });

    expect(result.stages.length).toBe(5);
    expect(result.stages.map((s) => s.stage)).toEqual([
      'construction',
      'classification',
      'determinization',
      'reachability',
      'minimization',
    ]);

    expect(result.minimal.states.size).toBe(4);

    // Cadenas aceptadas y rechazadas
    expect(simulate(result.minimal, 'abb').accepted).toBe(true);
    expect(simulate(result.minimal, 'aabb').accepted).toBe(true);
    expect(simulate(result.minimal, 'babb').accepted).toBe(true);
    expect(simulate(result.minimal, 'ababb').accepted).toBe(true);

    expect(simulate(result.minimal, '').accepted).toBe(false);
    expect(simulate(result.minimal, 'ab').accepted).toBe(false);
    expect(simulate(result.minimal, 'abba').accepted).toBe(false);
    expect(simulate(result.minimal, 'bbb').accepted).toBe(false);
  });

  it('omite la determinización con pasos si el autómata de la Modalidad B ya es determinista', () => {
    const automaton = fromJson(minClase6Fixture.automaton as AutomatonJson);
    const result = runPipeline({
      mode: 'automaton',
      automaton,
    });

    expect(result.stages.length).toBe(5);
    expect(result.stages.map((s) => s.stage)).toEqual([
      'input',
      'classification',
      'determinization',
      'reachability',
      'minimization',
    ]);

    const detStage = result.stages.find((s) => s.stage === 'determinization')!;
    expect(detStage.steps.length).toBe(0);
    expect(detStage.summary).toContain('ya es determinista');
    expect([...result.minimal.states]).toEqual(['A', '(B,E)', '(C,F)', 'D']);
  });

  it('propaga ValidationError si la expresión regular no es válida', () => {
    expect(() =>
      runPipeline({
        mode: 'language',
        alphabet: 'a,b',
        regex: '(a|b*abb',
      }),
    ).toThrow(ValidationError);
  });
});
