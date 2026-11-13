import { ERROR_STATE, type StateId } from './automaton';

/** Concatena en el orden de `order`; el conjunto vacío da ERROR_STATE. {q2, q0} → 'q0q2'. */
export function subsetName(subset: Iterable<StateId>, order: readonly StateId[]): StateId {
  const members = new Set(subset);
  if (members.size === 0) return ERROR_STATE;
  return order.filter((state) => members.has(state)).join('');
}

/** Un estado conserva su nombre; varios dan '(B,E)' en el orden de `order`. */
export function mergedName(group: Iterable<StateId>, order: readonly StateId[]): StateId {
  const members = new Set(group);
  const ordered = order.filter((state) => members.has(state));
  return ordered.length === 1 ? ordered[0] : `(${ordered.join(',')})`;
}
