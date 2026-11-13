import type { Automaton } from '../../core/model';

/** Provisional de la fase 0: el Desarrollador 2 lo reemplaza por el simulador de cadenas. */
export function Simulator(props: { automaton: Automaton }) {
  return (
    <section aria-label="Simulador">
      <p>Simulador pendiente para un AFD de {props.automaton.states.size} estados.</p>
    </section>
  );
}
