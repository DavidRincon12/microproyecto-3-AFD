import { useState, type ChangeEvent, type FormEvent } from 'react';
import { parseAlphabet } from '../../core/alphabet';
import {
  EPSILON,
  ERROR_STATE,
  fromJson,
  ValidationError,
  type Automaton,
  type AutomatonJson,
  type StateId,
  type Sym,
} from '../../core/model';
import styles from './AutomatonForm.module.css';

import afdFusionFixture from '../../core/__fixtures__/afd-fusion-transitiva.json';
import afdInaccesiblesFixture from '../../core/__fixtures__/afd-con-inaccesibles.json';
import afdIncompletoFixture from '../../core/__fixtures__/afd-incompleto.json';
import afdYaMinimoFixture from '../../core/__fixtures__/afd-ya-minimo.json';
import afnd7Fixture from '../../core/__fixtures__/afnd-clase-7-estados.json';
import afndAbcFixture from '../../core/__fixtures__/afnd-clase-abc.json';
import afndQFixture from '../../core/__fixtures__/afnd-clase-q.json';
import minClase6Fixture from '../../core/__fixtures__/min-clase-6-estados.json';

const EXAMPLES: Record<string, { label: string; json: AutomatonJson }> = {
  min6: {
    label: 'Ejercicio de minimización de 6 estados (Clase)',
    json: minClase6Fixture.automaton as AutomatonJson,
  },
  afndAbc: {
    label: 'AFND con A, B, C y transiciones incompletas',
    json: afndAbcFixture.automaton as AutomatonJson,
  },
  afndQ: {
    label: 'AFND con q0, q1, q2',
    json: afndQFixture.automaton as AutomatonJson,
  },
  afnd7: {
    label: 'AFND grande de 7 estados (A a G)',
    json: afnd7Fixture.automaton as AutomatonJson,
  },
  inaccesibles: {
    label: 'AFD con estados inaccesibles (D y E)',
    json: afdInaccesiblesFixture.automaton as AutomatonJson,
  },
  incompleto: {
    label: 'AFD incompleto (requiere estado de error)',
    json: afdIncompletoFixture.automaton as AutomatonJson,
  },
  yaMinimo: {
    label: 'AFD que ya es mínimo',
    json: afdYaMinimoFixture.automaton as AutomatonJson,
  },
  fusionTransitiva: {
    label: 'AFD con fusión transitiva (B, E, G)',
    json: afdFusionFixture.automaton as AutomatonJson,
  },
};

export function AutomatonForm(props: {
  onSubmit: (automaton: Automaton) => void;
  error?: ValidationError;
}) {
  const [statesInput, setStatesInput] = useState('A, B, C, D, E, F');
  const [alphabetInput, setAlphabetInput] = useState('0, 1');
  const [initialState, setInitialState] = useState<StateId>('A');
  const [finalStates, setFinalStates] = useState<Set<StateId>>(new Set(['D']));

  // key: "state:symbol" -> value: "B,C"
  const [gridTransitions, setGridTransitions] = useState<Record<string, string>>({
    'A:0': 'B',
    'A:1': 'C',
    'B:0': 'D',
    'B:1': 'E',
    'C:0': 'F',
    'C:1': 'B',
    'D:0': 'E',
    'D:1': 'C',
    'E:0': 'D',
    'E:1': 'E',
    'F:0': 'F',
    'F:1': 'B',
  });

  const [jsonText, setJsonText] = useState('');
  const [useJsonMode, setUseJsonMode] = useState(false);
  const [localError, setLocalError] = useState<{ field: string; message: string }>();

  // Parsear lista de estados actuales
  const parsedStates = statesInput
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Parsear lista de símbolos del alfabeto
  let parsedAlphabet: Sym[] = [];
  try {
    if (alphabetInput.trim().length > 0) {
      parsedAlphabet = parseAlphabet(alphabetInput);
    }
  } catch {
    // Si falla mientras escribe, se conserva el estado actual
  }

  function handleLoadExample(exampleKey: string) {
    if (!exampleKey || !EXAMPLES[exampleKey]) return;
    const example = EXAMPLES[exampleKey].json;

    setStatesInput(example.states.join(', '));
    setAlphabetInput(example.alphabet.join(', '));
    setInitialState(example.initial);
    setFinalStates(new Set(example.finals));

    const newGrid: Record<string, string> = {};
    for (const [from, sym, to] of example.transitions) {
      const key = `${from}:${sym}`;
      if (newGrid[key]) {
        newGrid[key] = `${newGrid[key]}, ${to}`;
      } else {
        newGrid[key] = to;
      }
    }
    setGridTransitions(newGrid);
    setJsonText(JSON.stringify(example, null, 2));
    setLocalError(undefined);
  }

  function handleFinalToggle(state: StateId) {
    setFinalStates((prev) => {
      const next = new Set(prev);
      if (next.has(state)) next.delete(state);
      else next.add(state);
      return next;
    });
  }

  function handleCellChange(state: StateId, symbol: Sym, value: string) {
    setGridTransitions((prev) => ({
      ...prev,
      [`${state}:${symbol}`]: value,
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLocalError(undefined);

    // Modo JSON directo
    if (useJsonMode) {
      try {
        const parsed = JSON.parse(jsonText) as AutomatonJson;
        const auto = fromJson(parsed);
        props.onSubmit(auto);
      } catch (err) {
        if (err instanceof SyntaxError) {
          setLocalError({
            field: 'general',
            message: 'El texto no es un JSON válido. Revisa las comas, las comillas y las llaves.',
          });
          return;
        }
        if (err instanceof ValidationError) {
          setLocalError({ field: err.field, message: err.message });
          return;
        }
        throw err;
      }
      return;
    }

    // Validación de nombres de estados (Sección 1.2)
    if (parsedStates.length === 0) {
      setLocalError({
        field: 'states',
        message: 'Debes ingresar al menos un estado para el autómata.',
      });
      return;
    }

    const stateSet = new Set<string>();
    const nameRegex = /^[a-zA-Z0-9_]+$/;

    for (const state of parsedStates) {
      if (!nameRegex.test(state)) {
        setLocalError({
          field: 'states',
          message: `El estado "${state}" contiene caracteres inválidos. Usa solo letras, dígitos y guión bajo.`,
        });
        return;
      }
      if (state.toLowerCase() === ERROR_STATE) {
        setLocalError({
          field: 'states',
          message: `El nombre "${ERROR_STATE}" está reservado para el estado sumidero y no se puede usar.`,
        });
        return;
      }
      if (stateSet.has(state)) {
        setLocalError({
          field: 'states',
          message: `El estado "${state}" está repetido. Escribe cada estado una sola vez.`,
        });
        return;
      }
      stateSet.add(state);
    }

    // Validación del alfabeto
    let alphabet: Sym[];
    try {
      alphabet = parseAlphabet(alphabetInput);
    } catch (err) {
      if (err instanceof ValidationError) {
        setLocalError({ field: 'alphabet', message: err.message });
        return;
      }
      throw err;
    }

    // Validación de estado inicial
    const initial = parsedStates.includes(initialState) ? initialState : parsedStates[0];

    // Validación de estados finales
    const finals = [...finalStates].filter((s) => stateSet.has(s));

    // Construcción de transiciones desde la cuadrícula
    const transitions: [StateId, Sym, StateId][] = [];
    const allSymbols = [...alphabet, EPSILON];

    for (const from of parsedStates) {
      for (const sym of allSymbols) {
        const val = gridTransitions[`${from}:${sym}`]?.trim();
        if (!val) continue;

        const targets = val
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
        for (const to of targets) {
          if (!stateSet.has(to)) {
            setLocalError({
              field: 'transitions',
              message: `En la fila ${from}, columna ${sym}, el estado "${to}" no existe. Revisa la lista de estados.`,
            });
            return;
          }
          transitions.push([from, sym, to]);
        }
      }
    }

    const automatonJson: AutomatonJson = {
      states: parsedStates,
      alphabet,
      initial,
      finals,
      transitions,
    };

    try {
      const automaton = fromJson(automatonJson);
      props.onSubmit(automaton);
    } catch (err) {
      if (err instanceof ValidationError) {
        setLocalError({ field: err.field, message: err.message });
        return;
      }
      throw err;
    }
  }

  const activeError =
    localError ??
    (props.error ? { field: props.error.field, message: props.error.message } : undefined);

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Modalidad B: Registro Manual de Autómata</legend>

        <div className={styles.fieldGroup}>
          <label htmlFor="example-selector" className={styles.fieldLabel}>
            Cargar ejemplo de clase predefinido:
          </label>
          <select
            id="example-selector"
            className={styles.exampleSelect}
            defaultValue=""
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleLoadExample(e.target.value)}
          >
            <option value="">-- Selecciona un ejemplo para cargar --</option>
            {Object.entries(EXAMPLES).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '0.25rem 0' }}>
          <button
            type="button"
            onClick={() => setUseJsonMode(!useJsonMode)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary, #0284c7)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            {useJsonMode
              ? '← Cambiar a formulario visual con cuadrícula'
              : 'Modo avanzado: Pegar autómata en JSON'}
          </button>
        </div>

        {useJsonMode ? (
          <div className={styles.fieldGroup}>
            <label htmlFor="automaton-json-area" className={styles.fieldLabel}>
              Autómata en JSON
            </label>
            <textarea
              id="automaton-json-area"
              aria-label="Autómata en JSON"
              className={styles.input}
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{\n  "states": ["A", "B"],\n  "alphabet": ["0", "1"],\n  "initial": "A",\n  "finals": ["B"],\n  "transitions": [["A", "0", "B"]]\n}'
            />
          </div>
        ) : (
          <>
            <div className={styles.fieldGroup}>
              <label htmlFor="states-input" className={styles.fieldLabel}>
                Conjunto de Estados (Q):
              </label>
              <input
                id="states-input"
                type="text"
                className={styles.input}
                value={statesInput}
                onChange={(e) => setStatesInput(e.target.value)}
                placeholder="A, B, C, D"
              />
              <span className={styles.helpText}>
                Nombres separados por comas (solo letras, números y guión bajo).
              </span>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="alphabet-input" className={styles.fieldLabel}>
                Alfabeto de Entrada (Σ):
              </label>
              <input
                id="alphabet-input"
                type="text"
                className={styles.input}
                value={alphabetInput}
                onChange={(e) => setAlphabetInput(e.target.value)}
                placeholder="0, 1"
              />
              <span className={styles.helpText}>Símbolos de un carácter separados por comas.</span>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="initial-select" className={styles.fieldLabel}>
                Estado Inicial (q0):
              </label>
              <select
                id="initial-select"
                className={styles.select}
                value={parsedStates.includes(initialState) ? initialState : parsedStates[0] || ''}
                onChange={(e) => setInitialState(e.target.value)}
              >
                {parsedStates.map((st, idx) => (
                  <option key={`${st}-${idx}`} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Estados Finales / Aceptación (F):</span>
              <div className={styles.checkboxGrid}>
                {parsedStates.map((st, idx) => (
                  <label key={`${st}-${idx}`} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={finalStates.has(st)}
                      onChange={() => handleFinalToggle(st)}
                    />
                    {st}
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Cuadrícula de Transiciones (δ):</span>
              <span className={styles.helpText}>
                Escribe el o los estados de destino separados por comas (ej. B, C) o déjalo vacío si
                no hay transición.
              </span>
              <div className={styles.tableWrapper}>
                <table className={styles.matrixTable}>
                  <thead>
                    <tr>
                      <th scope="col">Estado</th>
                      {parsedAlphabet.map((sym) => (
                        <th key={sym} scope="col">
                          {sym}
                        </th>
                      ))}
                      <th scope="col">{EPSILON}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedStates.map((st, idx) => (
                      <tr key={`${st}-${idx}`}>
                        <th scope="row">{st}</th>
                        {parsedAlphabet.map((sym) => (
                          <td key={sym}>
                            <input
                              type="text"
                              className={styles.cellInput}
                              value={gridTransitions[`${st}:${sym}`] || ''}
                              onChange={(e) => handleCellChange(st, sym, e.target.value)}
                              placeholder="—"
                            />
                          </td>
                        ))}
                        <td>
                          <input
                            type="text"
                            className={styles.cellInput}
                            value={gridTransitions[`${st}:${EPSILON}`] || ''}
                            onChange={(e) => handleCellChange(st, EPSILON, e.target.value)}
                            placeholder="—"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeError && (
          <div role="alert" className={styles.alertError}>
            {activeError.message}
          </div>
        )}

        <div className={styles.actions}>
          <button type="submit" className={styles.submitBtn}>
            Procesar Autómata
          </button>
        </div>
      </fieldset>
    </form>
  );
}
