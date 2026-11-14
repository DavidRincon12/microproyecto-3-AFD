import { targets, ValidationError, type Automaton, type StateId, type Sym } from '../model';

export interface SimulationStep {
  from: StateId;
  symbol: Sym;
  to: StateId;
}

export interface SimulationResult {
  word: string;
  accepted: boolean;
  path: SimulationStep[]; // solo las transiciones recorridas
  finalState: StateId; // último estado alcanzado
  reason: string; // 'Termina en D, que es estado final.'
}

/**
 * Simula el recorrido de una cadena en un AFD (RF-12).
 * Lanza ValidationError(field 'word', position) si la cadena contiene símbolos ajenos al alfabeto.
 */
export function simulate(dfa: Automaton, word: string): SimulationResult {
  const characters = [...word];
  const path: SimulationStep[] = [];
  let currentState: StateId = dfa.initial;

  // 1. Validar que todos los caracteres pertenecen al alfabeto
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    if (!dfa.alphabet.has(char)) {
      throw new ValidationError(
        `El símbolo '${char}' en la posición ${i + 1} no pertenece al alfabeto {${[...dfa.alphabet].sort().join(', ')}}.`,
        'word',
        i + 1,
      );
    }
  }

  // 2. Caso especial: cadena vacía
  if (characters.length === 0) {
    const accepted = dfa.finals.has(dfa.initial);
    return {
      word,
      accepted,
      path: [],
      finalState: dfa.initial,
      reason: accepted
        ? `La cadena vacía (ε) es aceptada porque el estado inicial '${dfa.initial}' es de aceptación.`
        : `La cadena vacía (ε) es rechazada porque el estado inicial '${dfa.initial}' no es de aceptación.`,
    };
  }

  // 3. Recorrido paso a paso
  for (let i = 0; i < characters.length; i++) {
    const sym = characters[i];
    const dests = targets(dfa, currentState, sym);

    if (dests.size === 0) {
      return {
        word,
        accepted: false,
        path,
        finalState: currentState,
        reason: `Rechazada: No existe transición definida desde el estado '${currentState}' con el símbolo '${sym}' (procesando el carácter ${i + 1}).`,
      };
    }

    const nextState = [...dests][0];
    path.push({
      from: currentState,
      symbol: sym,
      to: nextState,
    });
    currentState = nextState;
  }

  const isFinal = dfa.finals.has(currentState);
  const reason = isFinal
    ? `Aceptada: El recorrido finalizó en el estado '${currentState}', el cual es un estado de aceptación.`
    : `Rechazada: El recorrido finalizó en el estado '${currentState}', el cual no es un estado de aceptación.`;

  return {
    word,
    accepted: isFinal,
    path,
    finalState: currentState,
    reason,
  };
}
