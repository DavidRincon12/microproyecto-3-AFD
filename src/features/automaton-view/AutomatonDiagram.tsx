import type { Automaton, StateId } from '../../core/model';

/** Provisional de la fase 0: el Desarrollador 2 lo reemplaza por el diagrama de Graphviz. */
export function AutomatonDiagram(props: { automaton: Automaton; highlight?: readonly StateId[] }) {
  return (
    <p>
      Diagrama pendiente ({props.automaton.states.size} estados
      {props.highlight?.length ? `, resaltados: ${props.highlight.join(', ')}` : ''}).
    </p>
  );
}
