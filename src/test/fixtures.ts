import type { AutomatonJson } from '../core/model';

/** Ejemplo de prueba guardado en src/core/__fixtures__/. */
export interface Fixture {
  description: string;
  source: string;
  automaton?: AutomatonJson;
  alphabet?: string;
  regex?: string;
  expected: {
    deterministic?: boolean;
    dfa?: AutomatonJson;
    minimal?: AutomatonJson;
    minimalStates?: number;
    accepts?: string[];
    rejects?: string[];
  };
}
