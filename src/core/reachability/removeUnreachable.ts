import { NotImplementedError, type Automaton, type StageResult } from '../model';

/** Quita los estados que no se alcanzan desde el inicial. Etapa 'reachability'. */
export function removeUnreachable(_automaton: Automaton): StageResult {
  throw new NotImplementedError('removeUnreachable');
}
