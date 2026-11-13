import { NotImplementedError, type Automaton, type StateId } from '../model';

/** Texto DOT de Graphviz: izquierda a derecha, finales en doble círculo, flecha al inicial,
 *  símbolos con el mismo destino agrupados en una etiqueta ('0,1'). */
export function toDot(_automaton: Automaton, _highlight?: readonly StateId[]): string {
  throw new NotImplementedError('toDot');
}
