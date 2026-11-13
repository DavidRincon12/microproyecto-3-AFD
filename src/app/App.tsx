import { useState } from 'react';
import { ValidationError } from '../core/model';
import { runPipeline, type PipelineInput, type PipelineResult } from '../core/pipeline';
import { AutomatonForm } from '../features/automaton-input';
import { LanguageForm } from '../features/language-input';
import { PipelineView } from '../features/pipeline-view';
import { Simulator } from '../features/simulation';

type Mode = PipelineInput['mode'];

const MODES: { mode: Mode; label: string }[] = [
  { mode: 'language', label: 'Modalidad A: lenguaje' },
  { mode: 'automaton', label: 'Modalidad B: autómata' },
];

export function App() {
  const [mode, setMode] = useState<Mode>('language');
  const [result, setResult] = useState<PipelineResult>();
  const [error, setError] = useState<ValidationError>();

  function run(input: PipelineInput) {
    try {
      setResult(runPipeline(input));
      setError(undefined);
    } catch (e) {
      setResult(undefined);
      // Un fallo que no es de entrada se informa en vez de tumbar la página.
      setError(
        e instanceof ValidationError
          ? e
          : new ValidationError(`Ocurrió un error inesperado: ${String(e)}`, 'general'),
      );
    }
  }

  function changeMode(next: Mode) {
    setMode(next);
    setResult(undefined);
    setError(undefined);
  }

  return (
    <main>
      <h1>Autómatas finitos: construcción, determinización y minimización</h1>
      <div role="tablist" aria-label="Modalidad de entrada">
        {MODES.map((item) => (
          <button
            key={item.mode}
            type="button"
            role="tab"
            aria-selected={mode === item.mode}
            onClick={() => changeMode(item.mode)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {error?.field === 'general' && <p role="alert">{error.message}</p>}
      {mode === 'language' ? (
        <LanguageForm error={error} onSubmit={(input) => run({ mode: 'language', ...input })} />
      ) : (
        <AutomatonForm
          error={error}
          onSubmit={(automaton) => run({ mode: 'automaton', automaton })}
        />
      )}
      {result && <PipelineView result={result} />}
      {result && <Simulator automaton={result.minimal} />}
    </main>
  );
}
