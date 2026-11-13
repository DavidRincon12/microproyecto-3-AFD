import { NotImplementedError, type Automaton, type StageResult } from '../model';

export type PipelineInput =
  | { mode: 'language'; alphabet: string; regex: string }
  | { mode: 'automaton'; automaton: Automaton };

export interface PipelineResult {
  /** En orden; la última es la minimización. */
  stages: StageResult[];
  /** Igual a stages[stages.length - 1].automaton. */
  minimal: Automaton;
}

export function runPipeline(_input: PipelineInput): PipelineResult {
  throw new NotImplementedError('runPipeline');
}
