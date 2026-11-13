import { ValidationError } from './errors';

export const EPSILON = 'ε';
export const ERROR_STATE = 'error';
/** Caracteres que usa la sintaxis de las expresiones o del formulario. */
export const RESERVED_SYMBOLS: ReadonlySet<string> = new Set([
  EPSILON,
  '|',
  '*',
  '+',
  '?',
  '(',
  ')',
  ',',
  ' ',
]);

export type StateId = string;
/** Un símbolo del alfabeto: exactamente un carácter. ε no pertenece al alfabeto. */
export type Sym = string;

/** Autómata finito general. Un AFD es el caso sin ε y con a lo sumo un destino por (estado, símbolo). */
export interface Automaton {
  readonly states: ReadonlySet<StateId>;
  readonly alphabet: ReadonlySet<Sym>;
  readonly initial: StateId;
  readonly finals: ReadonlySet<StateId>;
  /** δ: Q × (Σ ∪ {ε}) → P(Q). Una transición que no existe no tiene clave. */
  readonly delta: ReadonlyMap<StateId, ReadonlyMap<Sym, ReadonlySet<StateId>>>;
  /** Estado de este autómata → estados de la etapa anterior de los que proviene. */
  readonly origin?: ReadonlyMap<StateId, ReadonlySet<StateId>>;
}

export interface AutomatonJson {
  states: StateId[];
  alphabet: Sym[];
  initial: StateId;
  finals: StateId[];
  /** [origen, símbolo o 'ε', destino]. */
  transitions: [StateId, Sym, StateId][];
}

const NO_TARGETS: ReadonlySet<StateId> = new Set();

/** Motivo por el que un texto no puede ser símbolo del alfabeto, o undefined si puede. */
export function symbolProblem(symbol: string): string | undefined {
  const length = [...symbol].length;
  if (length === 0) return 'Hay un símbolo vacío en el alfabeto.';
  if (RESERVED_SYMBOLS.has(symbol)) {
    return `"${symbol}" es un símbolo reservado y no puede formar parte del alfabeto.`;
  }
  if (length > 1) return `Cada símbolo debe tener un solo carácter, y "${symbol}" tiene ${length}.`;
  return undefined;
}

export function repeatedSymbolMessage(symbol: Sym): string {
  return `El símbolo "${symbol}" está repetido en el alfabeto. Escribe cada símbolo una sola vez.`;
}

function validate(json: AutomatonJson): void {
  if (json.states.length === 0) {
    throw new ValidationError('El autómata debe tener al menos un estado.', 'states');
  }
  const states = new Set<StateId>();
  for (const state of json.states) {
    if (states.has(state)) {
      throw new ValidationError(
        `El estado "${state}" está repetido. Escribe cada estado una sola vez.`,
        'states',
      );
    }
    states.add(state);
  }
  if (json.alphabet.length === 0) {
    throw new ValidationError('El alfabeto está vacío.', 'alphabet');
  }
  const alphabet = new Set<Sym>();
  for (const symbol of json.alphabet) {
    const problem = symbolProblem(symbol);
    if (problem) throw new ValidationError(problem, 'alphabet');
    if (alphabet.has(symbol)) throw new ValidationError(repeatedSymbolMessage(symbol), 'alphabet');
    alphabet.add(symbol);
  }
  if (!states.has(json.initial)) {
    throw new ValidationError(
      `El estado inicial "${json.initial}" no está en la lista de estados.`,
      'initial',
    );
  }
  for (const final of json.finals) {
    if (!states.has(final)) {
      throw new ValidationError(
        `El estado final "${final}" no está en la lista de estados.`,
        'finals',
      );
    }
  }
  for (const [from, symbol, to] of json.transitions) {
    const label = `La transición (${from}, ${symbol}, ${to})`;
    for (const state of [from, to]) {
      if (!states.has(state)) {
        throw new ValidationError(
          `${label} usa el estado "${state}", que no está en la lista de estados.`,
          'transitions',
        );
      }
    }
    if (symbol !== EPSILON && !alphabet.has(symbol)) {
      throw new ValidationError(
        `${label} usa el símbolo "${symbol}", que no está en el alfabeto.`,
        'transitions',
      );
    }
  }
}

/** Convierte el formato JSON en un autómata; lanza ValidationError si es inconsistente. */
export function fromJson(json: AutomatonJson): Automaton {
  validate(json);
  const delta = new Map<StateId, Map<Sym, Set<StateId>>>();
  for (const [from, symbol, to] of json.transitions) {
    const bySymbol = delta.get(from) ?? new Map<Sym, Set<StateId>>();
    delta.set(from, bySymbol);
    const destinations = bySymbol.get(symbol) ?? new Set<StateId>();
    bySymbol.set(symbol, destinations);
    destinations.add(to);
  }
  return {
    states: new Set(json.states),
    alphabet: new Set(json.alphabet),
    initial: json.initial,
    finals: new Set(json.finals),
    delta,
  };
}

export function toJson(automaton: Automaton): AutomatonJson {
  const transitions: [StateId, Sym, StateId][] = [];
  for (const [from, bySymbol] of automaton.delta) {
    for (const [symbol, destinations] of bySymbol) {
      for (const to of destinations) transitions.push([from, symbol, to]);
    }
  }
  return {
    states: [...automaton.states],
    alphabet: [...automaton.alphabet],
    initial: automaton.initial,
    finals: [...automaton.finals],
    transitions,
  };
}

/** Destinos de δ(from, symbol); conjunto vacío si no hay transición. */
export function targets(automaton: Automaton, from: StateId, symbol: Sym): ReadonlySet<StateId> {
  return automaton.delta.get(from)?.get(symbol) ?? NO_TARGETS;
}
