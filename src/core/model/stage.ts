import type { Automaton, StateId } from './automaton';

export type StageId =
  'construction' | 'input' | 'classification' | 'determinization' | 'reachability' | 'minimization';

export interface Table {
  headers: string[];
  rows: string[][];
}

/** Un paso de la explicación (RF-10). */
export interface Step {
  title: string;
  detail: string;
  table?: Table;
  highlight?: StateId[];
}

/** Resultado de una etapa (RF-13). */
export interface StageResult {
  stage: StageId;
  title: string;
  summary: string;
  automaton: Automaton;
  steps: Step[];
}
