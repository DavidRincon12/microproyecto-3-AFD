import { NotImplementedError, type Automaton, type StateId, type Sym } from '../model';

export interface SimulationStep {
  from: StateId;
  symbol: Sym;
  to: StateId;
}

export interface SimulationResult {
  word: string;
  accepted: boolean;
  /** Solo las transiciones recorridas. */
  path: SimulationStep[];
  /** Último estado alcanzado. */
  finalState: StateId;
  reason: string;
}

/** La cadena vacía se acepta si el inicial es final. Lanza ValidationError(field 'word')
 *  si la cadena usa un símbolo fuera del alfabeto. */
export function simulate(_dfa: Automaton, _word: string): SimulationResult {
  throw new NotImplementedError('simulate');
}
