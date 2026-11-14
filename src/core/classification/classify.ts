import { EPSILON, targets, type Automaton, type StageResult, type Step } from '../model';

export interface ClassificationResult extends StageResult {
  /** Sin ε y con a lo sumo un destino por (estado, símbolo). */
  deterministic: boolean;
  /** Todo (estado, símbolo) tiene transición. */
  complete: boolean;
}

/**
 * Clasifica un autómata finito como AFD o AFND e identifica motivos de no determinismo
 * o incompletitud según las reglas de clase (RF-05).
 */
export function classify(automaton: Automaton): ClassificationResult {
  const nonDeterministicReasons: Step[] = [];
  const missingTransitions: { from: string; symbol: string }[] = [];

  // 1. Revisar transiciones ε y múltiples destinos por (estado, símbolo)
  for (const state of automaton.states) {
    // Transiciones ε
    const epsTargets = targets(automaton, state, EPSILON);
    if (epsTargets.size > 0) {
      nonDeterministicReasons.push({
        title: `Transición ε desde ${state}`,
        detail: `El estado ${state} tiene ${epsTargets.size} transición(es) espontánea(s) ε hacia {${[...epsTargets].sort().join(', ')}}.`,
        highlight: [state, ...epsTargets],
      });
    }

    // Transiciones por símbolo del alfabeto
    for (const sym of automaton.alphabet) {
      const symTargets = targets(automaton, state, sym);
      if (symTargets.size > 1) {
        nonDeterministicReasons.push({
          title: `No determinismo en (${state}, ${sym})`,
          detail: `δ(${state}, ${sym}) = {${[...symTargets].sort().join(', ')}}: el símbolo '${sym}' tiene múltiples destinos.`,
          highlight: [state, ...symTargets],
        });
      } else if (symTargets.size === 0) {
        missingTransitions.push({ from: state, symbol: sym });
      }
    }
  }

  const deterministic = nonDeterministicReasons.length === 0;
  const complete = missingTransitions.length === 0;

  const steps: Step[] = [];

  if (!deterministic) {
    steps.push(...nonDeterministicReasons);
  } else {
    steps.push({
      title: 'Determinismo verificado',
      detail:
        'No contiene transiciones con ε y cada par (estado, símbolo) tiene a lo sumo una transición.',
    });
  }

  if (deterministic && !complete) {
    const listMissing = missingTransitions
      .slice(0, 5)
      .map((t) => `(${t.from}, ${t.symbol})`)
      .join(', ');
    const more = missingTransitions.length > 5 ? ` y ${missingTransitions.length - 5} más` : '';
    steps.push({
      title: 'Autómata determinista incompleto',
      detail: `Faltan ${missingTransitions.length} transición(es) como ${listMissing}${more}. La fase de minimización lo completará con el estado sumidero 'error'.`,
      highlight: Array.from(new Set(missingTransitions.map((t) => t.from))),
    });
  } else if (deterministic && complete) {
    steps.push({
      title: 'Completitud verificada',
      detail: 'El autómata está completamente definido para cada símbolo del alfabeto.',
    });
  }

  let summary = '';
  if (!deterministic) {
    summary = `El autómata no es determinista por ${nonDeterministicReasons.length} motivo(s) y requiere conversión a AFD.`;
  } else if (!complete) {
    summary = 'El autómata es determinista pero incompleto (se completará con el estado de error).';
  } else {
    summary = 'El autómata es determinista y completo.';
  }

  return {
    stage: 'classification',
    title: 'Clasificación del autómata',
    summary,
    automaton,
    steps,
    deterministic,
    complete,
  };
}
