import { EPSILON, targets, type Automaton, type StateId, type Sym } from '../../core/model';
import styles from './TransitionTable.module.css';

export function TransitionTable(props: { automaton: Automaton; highlight?: readonly StateId[] }) {
  const { automaton, highlight } = props;
  const highlightSet = new Set(highlight ?? []);

  // Verificar si existen transiciones con EPSILON
  let hasEpsilon = false;
  for (const s of automaton.states) {
    if (targets(automaton, s, EPSILON).size > 0) {
      hasEpsilon = true;
      break;
    }
  }

  const columns: Sym[] = [...automaton.alphabet];
  if (hasEpsilon) {
    columns.push(EPSILON);
  }

  const orderedStates = [...automaton.states];

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <caption className={styles.caption}>Tabla de Transición del Autómata</caption>
        <thead>
          <tr>
            <th scope="col" className={styles.thHeader}>
              Estado
            </th>
            {columns.map((sym) => (
              <th key={sym} scope="col" className={styles.thHeader}>
                {sym}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orderedStates.map((state) => {
            const isInitial = state === automaton.initial;
            const isFinal = automaton.finals.has(state);
            const isHighlighted = highlightSet.has(state);

            let prefix = '';
            if (isInitial && isFinal) prefix = '→* ';
            else if (isInitial) prefix = '→ ';
            else if (isFinal) prefix = '* ';

            return (
              <tr key={state} className={isHighlighted ? styles.highlightRow : undefined}>
                <th scope="row" className={styles.stateRowHeader}>
                  <span className={styles.indicator}>{prefix}</span>
                  {state}
                </th>
                {columns.map((sym) => {
                  const dests = targets(automaton, state, sym);
                  if (dests.size === 0) {
                    return (
                      <td key={sym} className={styles.emptyCell}>
                        —
                      </td>
                    );
                  }
                  return <td key={sym}>{[...dests].sort().join(', ')}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendMarker}>→</span> Estado inicial
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendMarker}>*</span> Estado final / aceptación
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendMarker}>—</span> Sin transición definida
        </div>
      </div>
    </div>
  );
}
