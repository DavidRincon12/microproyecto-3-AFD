import { useState } from 'react';
import type { Automaton, StageResult, StateId, Table } from '../../core/model';
import type { PipelineResult } from '../../core/pipeline';
import { AutomatonDiagram, TransitionTable } from '../automaton-view';
import styles from './PipelineView.module.css';

function StepTable(props: { table: Table }) {
  return (
    <div className={styles.desplazable}>
      <table>
        <thead>
          <tr>
            {props.table.headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.table.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AutomatonPanel(props: {
  label: string;
  automaton: Automaton;
  highlight?: readonly StateId[];
}) {
  return (
    <section aria-label={props.label} className={styles.automata}>
      <h3>{props.label}</h3>
      <TransitionTable automaton={props.automaton} highlight={props.highlight} />
      <AutomatonDiagram automaton={props.automaton} highlight={props.highlight} />
    </section>
  );
}

function Origin(props: { origin: ReadonlyMap<StateId, ReadonlySet<StateId>> }) {
  return (
    <details className={styles.origen}>
      <summary>Correspondencia con la etapa anterior</summary>
      <ul>
        {[...props.origin].map(([state, sources]) => (
          <li key={state}>{`${state} proviene de {${[...sources].join(', ')}}`}</li>
        ))}
      </ul>
    </details>
  );
}

function StagePanel(props: { stage: StageResult; minimal: Automaton; compare: boolean }) {
  const { stage } = props;
  const [selected, setSelected] = useState<number>();
  const highlight = selected === undefined ? undefined : stage.steps[selected]?.highlight;
  return (
    <>
      <h2>{stage.title}</h2>
      <p className={styles.resumen}>{stage.summary}</p>
      <div className={props.compare ? styles.comparacion : undefined}>
        <AutomatonPanel
          label="Autómata de la etapa"
          automaton={stage.automaton}
          highlight={highlight}
        />
        {props.compare && <AutomatonPanel label="AFD mínimo" automaton={props.minimal} />}
      </div>
      {stage.automaton.origin && <Origin origin={stage.automaton.origin} />}
      {stage.steps.length > 0 && (
        <ol aria-label="Pasos" className={styles.pasos}>
          {stage.steps.map((step, i) => (
            <li key={i}>
              <button
                type="button"
                aria-pressed={selected === i}
                onClick={() => setSelected(selected === i ? undefined : i)}
              >
                {step.title}
              </button>
              <p>{step.detail}</p>
              {step.table && <StepTable table={step.table} />}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

/** Una pestaña por etapa (RF-13), con sus pasos (RF-10) y la comparación con el AFD mínimo. */
export function PipelineView(props: { result: PipelineResult }) {
  const [current, setCurrent] = useState(0);
  const [compare, setCompare] = useState(false);
  const { stages, minimal } = props.result;
  const stage = stages[Math.min(current, stages.length - 1)];

  return (
    <section aria-label="Etapas" className={styles.vista}>
      <div role="tablist" aria-label="Etapas del proceso" className={styles.pestanas}>
        {stages.map((item, i) => (
          <button
            key={item.stage}
            id={`etapa-${item.stage}`}
            type="button"
            role="tab"
            aria-selected={i === current}
            aria-controls="etapa-panel"
            onClick={() => setCurrent(i)}
          >
            <span className={styles.numero} aria-hidden="true">
              {i + 1}
            </span>{' '}
            {item.title}
          </button>
        ))}
      </div>
      <label className={styles.comparar}>
        <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
        Comparar con el AFD mínimo
      </label>
      <div role="tabpanel" id="etapa-panel" aria-labelledby={`etapa-${stage.stage}`}>
        <StagePanel key={stage.stage} stage={stage} minimal={minimal} compare={compare} />
      </div>
    </section>
  );
}
