import type { PipelineResult } from '../../core/pipeline';
import { TransitionTable } from '../automaton-view';

/** Provisional de la fase 0: la vista definitiva es la tarea 2.3 del Desarrollador 1. */
export function PipelineView(props: { result: PipelineResult }) {
  return (
    <section aria-label="Etapas">
      {props.result.stages.map((stage) => (
        <article key={stage.stage}>
          <h2>{stage.title}</h2>
          <p>{stage.summary}</p>
          <TransitionTable automaton={stage.automaton} />
        </article>
      ))}
    </section>
  );
}
