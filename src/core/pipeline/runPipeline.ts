import { parseAlphabet } from '../alphabet';
import { classify } from '../classification';
import { determinize } from '../determinization';
import { minimize } from '../minimization';
import type { Automaton, StageResult } from '../model';
import { removeUnreachable } from '../reachability';
import { parseRegex } from '../regex';
import { thompson } from '../thompson';

export type PipelineInput =
  | { mode: 'language'; alphabet: string; regex: string }
  | { mode: 'automaton'; automaton: Automaton };

export interface PipelineResult {
  /** En orden; la última es la minimización. */
  stages: StageResult[];
  /** Igual a stages[stages.length - 1].automaton. */
  minimal: Automaton;
}

/**
 * Orquestador principal del proceso de transformación y explicación de autómatas (RF-10, RF-13).
 * Encadena las etapas correspondientes según la modalidad de entrada y genera el AFD mínimo.
 */
export function runPipeline(input: PipelineInput): PipelineResult {
  const stages: StageResult[] = [];
  let currentAutomaton: Automaton;

  if (input.mode === 'language') {
    // 1. Etapa de Construcción (Thompson)
    const alphabetList = parseAlphabet(input.alphabet);
    const alphabetSet = new Set(alphabetList);
    const ast = parseRegex(input.regex, alphabetSet);
    const constructionResult = thompson(ast, alphabetSet);

    stages.push(constructionResult);
    currentAutomaton = constructionResult.automaton;
  } else {
    // Modalidad B: Etapa de Entrada del Autómata
    const inputStage: StageResult = {
      stage: 'input',
      title: 'Autómata ingresado',
      summary: 'Autómata registrado manualmente para análisis y transformación.',
      automaton: input.automaton,
      steps: [],
    };
    stages.push(inputStage);
    currentAutomaton = input.automaton;
  }

  // 2. Etapa de Clasificación
  const classificationResult = classify(currentAutomaton);
  stages.push(classificationResult);

  // 3. Etapa de Determinización (AFND → AFD)
  let determinizationResult: StageResult;
  if (classificationResult.deterministic) {
    determinizationResult = {
      stage: 'determinization',
      title: 'Conversión AFND → AFD',
      summary:
        'El autómata ya es determinista, así que no requiere conversión y se continúa con la minimización.',
      automaton: currentAutomaton,
      steps: [],
    };
  } else {
    determinizationResult = determinize(currentAutomaton);
  }
  stages.push(determinizationResult);
  currentAutomaton = determinizationResult.automaton;

  // 4. Etapa de Eliminación de Inaccesibles
  const reachabilityResult = removeUnreachable(currentAutomaton);
  stages.push(reachabilityResult);
  currentAutomaton = reachabilityResult.automaton;

  // 5. Etapa de Minimización (Tabla de pares)
  const minimizationResult = minimize(currentAutomaton);
  stages.push(minimizationResult);

  return {
    stages,
    minimal: minimizationResult.automaton,
  };
}
