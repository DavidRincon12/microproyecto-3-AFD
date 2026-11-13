import { NotImplementedError, type Automaton, type StageResult } from '../model';

/** Construcción por subconjuntos con clausura-ε. Etapa 'determinization'.
 *  Lanza ValidationError(field 'general') si el AFD supera 200 estados. */
export function determinize(_automaton: Automaton): StageResult {
  throw new NotImplementedError('determinize');
}
