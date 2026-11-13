import { EPSILON, targets, type Automaton, type StateId } from '../model';

/** Estados alcanzables desde `from` solo con transiciones ε, incluidos los de partida. */
export function epsilonClosure(
  automaton: Automaton,
  from: Iterable<StateId>,
): ReadonlySet<StateId> {
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
