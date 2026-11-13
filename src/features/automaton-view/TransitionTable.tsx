import { toJson, type Automaton, type StateId } from '../../core/model';

/** Provisional de la fase 0: el Desarrollador 2 lo reemplaza por la tabla de transición. */
export function TransitionTable(props: { automaton: Automaton; highlight?: readonly StateId[] }) {
  return <pre>{JSON.stringify(toJson(props.automaton), null, 2)}</pre>;
}
