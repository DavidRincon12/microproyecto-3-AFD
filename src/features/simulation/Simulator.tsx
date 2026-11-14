import { useState, type FormEvent } from 'react';
import { type Automaton, ValidationError } from '../../core/model';
import { simulate, type SimulationResult } from '../../core/simulation';
import styles from './Simulator.module.css';

export function Simulator(props: { automaton: Automaton }) {
  const { automaton } = props;
  const [word, setWord] = useState('');
  const [result, setResult] = useState<SimulationResult>();
  const [error, setError] = useState<string>();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  function handleSimulate(event: FormEvent) {
    event.preventDefault();
    setError(undefined);

    try {
      const res = simulate(automaton, word);
      setResult(res);
      setCurrentStepIndex(res.path.length); // inicializar al final o al inicio
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(err.message);
        setResult(undefined);
        return;
      }
      throw err;
    }
  }

  const hasPath = result && result.path.length > 0;
  const activeState =
    result &&
    (currentStepIndex === 0
      ? automaton.initial
      : (result.path[currentStepIndex - 1]?.to ?? result.finalState));

  return (
    <section className={styles.simulatorContainer} aria-label="Simulador de cadenas">
      <h2 className={styles.title}>Simulador de Cadenas en el AFD Mínimo</h2>

      <form className={styles.form} onSubmit={handleSimulate}>
        <label htmlFor="chain-input" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
          Cadena a evaluar:
        </label>
        <div className={styles.inputRow}>
          <input
            id="chain-input"
            type="text"
            className={styles.input}
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Escribe una cadena (ej. 0100 o deja vacío para ε)..."
          />
          <button type="submit" className={styles.simulateBtn}>
            Simular
          </button>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)' }}>
          Alfabeto permitido: {'{'}
          {[...automaton.alphabet].sort().join(', ')}
          {'}'}. Para evaluar la cadena vacía, deja el campo en blanco.
        </span>

        {error && (
          <div role="alert" className={styles.alertError}>
            {error}
          </div>
        )}
      </form>

      {result && (
        <div
          className={`${styles.verdictBox} ${result.accepted ? styles.verdictAccepted : styles.verdictRejected}`}
        >
          <div className={styles.verdictTitle}>
            Veredicto: {result.accepted ? 'Aceptada' : 'Rechazada'}
          </div>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>{result.reason}</p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            Cadena evaluada:{' '}
            <strong>{result.word === '' ? 'cadena vacía (ε)' : `"${result.word}"`}</strong>
          </p>
          {activeState && (
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Estado en el paso seleccionado: <strong>{activeState}</strong>
            </p>
          )}

          {hasPath && (
            <>
              <div className={styles.stepperControls}>
                <button
                  type="button"
                  className={styles.stepBtn}
                  disabled={currentStepIndex <= 0}
                  onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                >
                  ◀ Paso anterior
                </button>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Paso {currentStepIndex} de {result.path.length}
                </span>
                <button
                  type="button"
                  className={styles.stepBtn}
                  disabled={currentStepIndex >= result.path.length}
                  onClick={() =>
                    setCurrentStepIndex((prev) => Math.min(result.path.length, prev + 1))
                  }
                >
                  Paso siguiente ▶
                </button>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.pathTable}>
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Estado actual</th>
                      <th scope="col">Símbolo leído</th>
                      <th scope="col">Siguiente estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.path.map((step, idx) => (
                      <tr
                        key={idx}
                        className={currentStepIndex === idx + 1 ? styles.activeStepRow : undefined}
                      >
                        <td>{idx + 1}</td>
                        <td>{step.from}</td>
                        <td>
                          <strong>{step.symbol}</strong>
                        </td>
                        <td>{step.to}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
