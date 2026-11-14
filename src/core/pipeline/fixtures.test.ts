import { describe, expect, it } from 'vitest';
import type { Fixture } from '../../test/fixtures';
import type { ClassificationResult } from '../classification';
import { fromJson } from '../model';
import { simulate } from '../simulation';
import { runPipeline } from './index';

// Cada ejemplo resuelto a mano debe coincidir con lo que produce el proceso completo.
const fixtures = import.meta.glob<Fixture>('../__fixtures__/*.json', {
  eager: true,
  import: 'default',
});

describe.each(Object.entries(fixtures))('%s', (_path, fixture) => {
  const result = runPipeline(
    fixture.automaton
      ? { mode: 'automaton', automaton: fromJson(fixture.automaton) }
      : { mode: 'language', alphabet: fixture.alphabet ?? '', regex: fixture.regex ?? '' },
  );
  const expectedStates = fixture.expected.minimalStates ?? fixture.expected.minimal?.states.length;

  const { deterministic } = fixture.expected;
  if (deterministic !== undefined) {
    it(`se clasifica como ${deterministic ? 'AFD' : 'AFND'}`, () => {
      const classification = result.stages.find((stage) => stage.stage === 'classification');
      expect((classification as ClassificationResult).deterministic).toBe(deterministic);
    });
  }

  if (expectedStates !== undefined) {
    it('produce el AFD mínimo esperado', () => {
      expect(result.minimal.states.size).toBe(expectedStates);
    });
  }

  it.each(fixture.expected.accepts ?? [])('acepta %j', (word) => {
    expect(simulate(result.minimal, word).accepted).toBe(true);
  });

  it.each(fixture.expected.rejects ?? [])('rechaza %j', (word) => {
    expect(simulate(result.minimal, word).accepted).toBe(false);
  });
});
