import { expect } from 'vitest';
import {
  EPSILON,
  targets,
  toJson,
  type Automaton,
  type AutomatonJson,
  type StateId,
} from '../core/model';

/** Compara dos autómatas como conjuntos: el orden de estados y transiciones no importa. */
export function expectSameAutomaton(actual: Automaton, expected: AutomatonJson): void {
  const normalize = (json: AutomatonJson) => ({
    states: [...json.states].sort(),
    alphabet: [...json.alphabet].sort(),
    initial: json.initial,
    finals: [...json.finals].sort(),
    transitions: json.transitions.map((t) => t.join(' ')).sort(),
  });
  expect(normalize(toJson(actual))).toEqual(normalize(expected));
}

function closure(automaton: Automaton, from: Iterable<StateId>): Set<StateId> {
  const reached = new Set(from);
  const pending = [...reached];
  for (let state = pending.pop(); state !== undefined; state = pending.pop()) {
    for (const next of targets(automaton, state, EPSILON)) {
      if (!reached.has(next)) {
        reached.add(next);
        pending.push(next);
      }
    }
  }
  return reached;
}

/** Decide si un AFND-ε acepta la cadena, para probar autómatas sin depender de otras etapas. */
export function acceptsNfa(automaton: Automaton, word: string): boolean {
  let current = closure(automaton, [automaton.initial]);
  for (const symbol of word) {
    current = closure(
      automaton,
      [...current].flatMap((state) => [...targets(automaton, state, symbol)]),
    );
  }
  return [...current].some((state) => automaton.finals.has(state));
}
