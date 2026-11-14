import {
  EPSILON,
  targets,
  type Automaton,
  type StageResult,
  type StateId,
  type Step,
  type Sym,
} from '../model';

/**
 * Elimina los estados inaccesibles desde el estado inicial mediante BFS (RF-07).
 */
export function removeUnreachable(automaton: Automaton): StageResult {
  const accessible = new Set<StateId>([automaton.initial]);
  let currentLevel = new Set<StateId>([automaton.initial]);
  const steps: Step[] = [];
  let levelIndex = 0;

  // Recorrido BFS por niveles
  while (currentLevel.size > 0) {
    const nextLevel = new Set<StateId>();
    const levelTransitions: string[] = [];

    for (const state of currentLevel) {
      // Símbolos del alfabeto + EPSILON
      const symbolsToCheck: Sym[] = [...automaton.alphabet, EPSILON];

      for (const sym of symbolsToCheck) {
        const dests = targets(automaton, state, sym);
        for (const dest of dests) {
          levelTransitions.push(`${state} —${sym}→ ${dest}`);
          if (!accessible.has(dest)) {
            accessible.add(dest);
            nextLevel.add(dest);
          }
        }
      }
    }

    if (levelIndex === 0) {
      steps.push({
        title: `Nivel 0: Estado inicial`,
        detail: `Se inicia el análisis de accesibilidad desde el estado inicial '${automaton.initial}'.`,
        highlight: [automaton.initial],
      });
    } else if (levelTransitions.length > 0) {
      steps.push({
        title: `Nivel ${levelIndex}: Estados alcanzables`,
        detail: `Se alcanzan nuevos estados en este nivel: {${[...nextLevel].sort().join(', ') || 'ninguno nuevo'}}. Transiciones exploradas: ${levelTransitions.slice(0, 6).join(', ')}${levelTransitions.length > 6 ? '...' : ''}.`,
        highlight: [...nextLevel],
      });
    }

    currentLevel = nextLevel;
    levelIndex++;
  }

  // Identificar inaccesibles
  const unreachableStates = [...automaton.states].filter((s) => !accessible.has(s));

  if (unreachableStates.length === 0) {
    steps.push({
      title: 'Todos los estados son accesibles',
      detail:
        'El recorrido comprobó que todos los estados del autómata son accesibles desde el estado inicial.',
    });
  } else {
    steps.push({
      title: 'Eliminación de estados inaccesibles',
      detail: `Se eliminan ${unreachableStates.length} estado(s) inaccesible(s): {${unreachableStates.join(', ')}} y todas sus transiciones.`,
      highlight: unreachableStates,
    });
  }

  // Construir nuevo autómata filtrado preservando el orden original
  const newStates = new Set<StateId>([...automaton.states].filter((s) => accessible.has(s)));
  const newFinals = new Set<StateId>([...automaton.finals].filter((s) => accessible.has(s)));

  const newDelta = new Map<StateId, Map<Sym, Set<StateId>>>();
  for (const state of newStates) {
    const stateMap = automaton.delta.get(state);
    if (!stateMap) continue;

    const newSymMap = new Map<Sym, Set<StateId>>();
    for (const [sym, dests] of stateMap) {
      const filteredDests = new Set<StateId>([...dests].filter((d) => accessible.has(d)));
      if (filteredDests.size > 0) {
        newSymMap.set(sym, filteredDests);
      }
    }
    if (newSymMap.size > 0) {
      newDelta.set(state, newSymMap);
    }
  }

  // Filtrar origin si existe
  let newOrigin: Map<StateId, ReadonlySet<StateId>> | undefined;
  if (automaton.origin) {
    newOrigin = new Map<StateId, ReadonlySet<StateId>>();
    for (const [state, origs] of automaton.origin) {
      if (accessible.has(state)) {
        newOrigin.set(state, origs);
      }
    }
  }

  const cleanedAutomaton: Automaton = {
    states: newStates,
    alphabet: automaton.alphabet,
    initial: automaton.initial,
    finals: newFinals,
    delta: newDelta,
    origin: newOrigin,
  };

  const summary =
    unreachableStates.length === 0
      ? 'Todos los estados son accesibles desde el inicial; el autómata no requiere cambios.'
      : `Se eliminaron ${unreachableStates.length} estado(s) inaccesible(s) ({${unreachableStates.join(', ')}}).`;

  return {
    stage: 'reachability',
    title: 'Eliminación de estados inaccesibles',
    summary,
    automaton: cleanedAutomaton,
    steps,
  };
}
