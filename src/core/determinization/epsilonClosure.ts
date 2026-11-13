import { NotImplementedError, type Automaton, type StateId } from '../model';

export function epsilonClosure(
  _automaton: Automaton,
  _from: Iterable<StateId>,
): ReadonlySet<StateId> {
  throw new NotImplementedError('epsilonClosure');
}
