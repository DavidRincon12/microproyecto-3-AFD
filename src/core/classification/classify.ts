import { NotImplementedError, type Automaton, type StageResult } from '../model';

export interface ClassificationResult extends StageResult {
  /** Sin ε y con a lo sumo un destino por (estado, símbolo). */
  deterministic: boolean;
  /** Todo (estado, símbolo) tiene transición. */
  complete: boolean;
}

/** Etapa 'classification'. El autómata de la etapa es el mismo que recibe. */
export function classify(_automaton: Automaton): ClassificationResult {
  throw new NotImplementedError('classify');
}
