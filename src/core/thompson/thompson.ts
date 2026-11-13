import { EPSILON, fromJson, type StageResult, type StateId, type Step, type Sym } from '../model';
import type { RegexNode } from '../regex';

interface Fragment {
  start: StateId;
  end: StateId;
}

const PRECEDENCE: Record<RegexNode['kind'], number> = {
  union: 0,
  concat: 1,
  star: 2,
  plus: 2,
  optional: 2,
  symbol: 3,
  epsilon: 3,
};
const POSTFIX_SIGN = { star: '*', plus: '+', optional: '?' } as const;

/** Texto de una subexpresión, con los paréntesis mínimos, para los títulos de los pasos. */
function show(node: RegexNode): string {
  const wrap = (child: RegexNode, minimum: number) =>
    PRECEDENCE[child.kind] < minimum ? `(${show(child)})` : show(child);
  switch (node.kind) {
    case 'symbol':
      return node.value;
    case 'epsilon':
      return EPSILON;
    case 'union':
      return `${show(node.left)}|${show(node.right)}`;
    case 'concat':
      return `${wrap(node.left, 1)}${wrap(node.right, 1)}`;
    default:
      return `${wrap(node.child, 2)}${POSTFIX_SIGN[node.kind]}`;
  }
}

/** AFND-ε con un solo estado final, construido fragmento por fragmento en postorden. */
export function thompson(ast: RegexNode, alphabet: ReadonlySet<Sym>): StageResult {
  const states: StateId[] = [];
  const transitions: [StateId, Sym, StateId][] = [];
  const steps: Step[] = [];
  const newState = (): StateId => {
    const state = `q${states.length}`;
    states.push(state);
    return state;
  };
  const link = (from: StateId, symbol: Sym, to: StateId) => transitions.push([from, symbol, to]);
  const explain = (title: string, detail: string, fragment: Fragment) =>
    steps.push({ title, detail, highlight: [fragment.start, fragment.end] });

  function build(node: RegexNode): Fragment {
    switch (node.kind) {
      case 'symbol':
      case 'epsilon': {
        const symbol = node.kind === 'symbol' ? node.value : EPSILON;
        const fragment = { start: newState(), end: newState() };
        link(fragment.start, symbol, fragment.end);
        explain(
          `Fragmento de ${symbol}`,
          `Se crean ${fragment.start} y ${fragment.end}, unidos por una transición con ${symbol}.`,
          fragment,
        );
        return fragment;
      }
      case 'concat': {
        const left = build(node.left);
        const right = build(node.right);
        link(left.end, EPSILON, right.start);
        const fragment = { start: left.start, end: right.end };
        explain(
          `Concatenación de ${show(node.left)} y ${show(node.right)}`,
          `El final de la primera parte, ${left.end}, va con ε al inicio de la segunda, ${right.start}.`,
          fragment,
        );
        return fragment;
      }
      case 'union': {
        const left = build(node.left);
        const right = build(node.right);
        const fragment = { start: newState(), end: newState() };
        link(fragment.start, EPSILON, left.start);
        link(fragment.start, EPSILON, right.start);
        link(left.end, EPSILON, fragment.end);
        link(right.end, EPSILON, fragment.end);
        explain(
          `Unión de ${show(node.left)} y ${show(node.right)}`,
          `Nuevo inicial ${fragment.start} con ε hacia ${left.start} y ${right.start}; ` +
            `${left.end} y ${right.end} van con ε al nuevo final ${fragment.end}.`,
          fragment,
        );
        return fragment;
      }
      default: {
        const inner = build(node.child);
        const fragment = { start: newState(), end: newState() };
        link(fragment.start, EPSILON, inner.start);
        if (node.kind !== 'plus') link(fragment.start, EPSILON, fragment.end);
        if (node.kind !== 'optional') link(inner.end, EPSILON, inner.start);
        link(inner.end, EPSILON, fragment.end);
        const meaning = {
          star: 'cero o más veces: se puede saltar el fragmento y repetirlo',
          plus: 'una o más veces: se debe pasar al menos una vez y se puede repetir',
          optional: 'cero o una vez: se puede saltar el fragmento, pero no repetirlo',
        }[node.kind];
        const operation = { star: 'Estrella', plus: 'Cierre positivo', optional: 'Opcional' }[
          node.kind
        ];
        explain(
          `${operation} de ${show(node.child)}`,
          `Nuevo inicial ${fragment.start} y nuevo final ${fragment.end} alrededor de ` +
            `${inner.start}…${inner.end}, para recorrer ${show(node.child)} ${meaning}.`,
          fragment,
        );
        return fragment;
      }
    }
  }

  const { start, end } = build(ast);
  const automaton = fromJson({
    states,
    alphabet: [...alphabet],
    initial: start,
    finals: [end],
    transitions,
  });
  return {
    stage: 'construction',
    title: 'Construcción del AFND-ε (Thompson)',
    summary: `AFND-ε con ${states.length} estados: inicial ${start} y final ${end}.`,
    automaton,
    steps,
  };
}
