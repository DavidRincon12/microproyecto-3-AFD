import {
  EPSILON,
  ERROR_STATE,
  ValidationError,
  fromJson,
  subsetName,
  targets,
  type Automaton,
  type StageResult,
  type StateId,
  type Step,
  type Sym,
} from '../model';
import { epsilonClosure } from './epsilonClosure';

/** Por encima de este tamaño la explosión de subconjuntos congelaría la interfaz. */
const MAX_STATES = 200;

/**
 * Construcción por subconjuntos con clausura-ε, con la notación de clase.
 * Lanza ValidationError(field 'general') si el AFD supera MAX_STATES estados.
 */
export function determinize(nfa: Automaton): StageResult {
  const order = [...nfa.states];
  const alphabet = [...nfa.alphabet];
  const hasEpsilon = [...nfa.delta.values()].some((bySymbol) => bySymbol.has(EPSILON));
  const sorted = (set: ReadonlySet<StateId>) => order.filter((state) => set.has(state));
  const asSet = (set: ReadonlySet<StateId>) => (set.size ? `{${sorted(set).join(', ')}}` : '∅');
  const asName = (set: ReadonlySet<StateId>) => (set.size ? sorted(set).join('') : '∅');

  const nameByKey = new Map<string, StateId>();
  const usedNames = new Set<StateId>();
  const subsets: ReadonlySet<StateId>[] = [];
  const names: StateId[] = [];

  function register(subset: ReadonlySet<StateId>): { name: StateId; isNew: boolean } {
    const key = sorted(subset).join('\u0000');
    const known = nameByKey.get(key);
    if (known !== undefined) return { name: known, isNew: false };
    if (subsets.length === MAX_STATES) {
      throw new ValidationError(
        `La conversión generaría más de ${MAX_STATES} estados. Simplifica la expresión o el autómata.`,
        'general',
      );
    }
    let name = subsetName(subset, order);
    // Un subconjunto de un estado conserva su nombre; los demás no pueden pisar otro nombre.
    if (subset.size !== 1 && (nfa.states.has(name) || usedNames.has(name))) {
      name = `{${sorted(subset).join(',')}}`;
    }
    nameByKey.set(key, name);
    usedNames.add(name);
    subsets.push(subset);
    names.push(name);
    return { name, isNew: true };
  }

  const steps: Step[] = [];
  const start = register(epsilonClosure(nfa, [nfa.initial])).name;
  if (hasEpsilon) {
    steps.push({
      title: `Clausura-ε de {${nfa.initial}}`,
      detail: `El estado inicial del AFD es la clausura-ε del inicial del AFND, ${asSet(subsets[0])}, y se llama ${start}.`,
      highlight: [start],
    });
  }

  const headers = [
    'Símbolo',
    'Desde cada estado',
    'Unión',
    ...(hasEpsilon ? ['Clausura-ε'] : []),
    'Resultado',
  ];
  const transitions: [StateId, Sym, StateId][] = [];
  for (let i = 0; i < subsets.length; i++) {
    const subset = subsets[i];
    const from = names[i];
    const rows = alphabet.map((symbol) => {
      const union = new Set(sorted(subset).flatMap((state) => [...targets(nfa, state, symbol)]));
      const closed = hasEpsilon ? epsilonClosure(nfa, union) : union;
      const { name, isNew } = register(closed);
      transitions.push([from, symbol, name]);
      const parts = sorted(subset).map(
        (state) => `${state},${symbol}→${asName(targets(nfa, state, symbol))}`,
      );
      return [
        symbol,
        parts.join(' · ') || '—',
        asSet(union),
        ...(hasEpsilon ? [asSet(closed)] : []),
        isNew ? `${name} (nuevo)` : name,
      ];
    });
    steps.push({
      title: `Estado ${from}`,
      detail:
        subset.size === 0
          ? `El estado ${ERROR_STATE} representa el conjunto vacío: con cualquier símbolo vuelve a sí mismo.`
          : `Se calcula a dónde va ${from} = ${asSet(subset)} con cada símbolo, uniendo los destinos de sus estados${hasEpsilon ? ' y aplicando la clausura-ε' : ''}.`,
      table: { headers, rows },
      highlight: [from],
    });
  }

  const finals = names.filter((_, i) => sorted(subsets[i]).some((state) => nfa.finals.has(state)));
  const automaton = fromJson({ states: names, alphabet, initial: start, finals, transitions });
  steps.push({
    title: 'Tabla de transición del AFD',
    detail: finals.length
      ? `Son finales los estados que contienen algún final del AFND: ${finals.join(', ')}.`
      : 'Ningún estado contiene un final del AFND, así que el AFD no tiene estados finales.',
    table: {
      headers: ['Estado', ...alphabet],
      rows: names.map((state) => [
        state,
        ...alphabet.map((symbol) => [...targets(automaton, state, symbol)].join(',')),
      ]),
    },
  });

  return {
    stage: 'determinization',
    title: 'Conversión AFND → AFD',
    summary: `El AFD tiene ${names.length} estados${subsets.some((subset) => subset.size === 0) ? ', incluido el estado error' : ''}.`,
    automaton: { ...automaton, origin: new Map(names.map((name, i) => [name, subsets[i]])) },
    steps,
  };
}
