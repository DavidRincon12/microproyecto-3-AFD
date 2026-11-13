import { useState, type FormEvent } from 'react';
import { ValidationError, fromJson, type Automaton, type AutomatonJson } from '../../core/model';

/** Provisional de la fase 0: el Desarrollador 2 lo reemplaza por el formulario con cuadrícula. */
export function AutomatonForm(props: {
  onSubmit: (automaton: Automaton) => void;
  error?: ValidationError;
}) {
  const [text, setText] = useState('');
  const [localError, setLocalError] = useState<string>();

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      props.onSubmit(fromJson(JSON.parse(text) as AutomatonJson));
      setLocalError(undefined);
    } catch (error) {
      if (!(error instanceof ValidationError) && !(error instanceof SyntaxError)) throw error;
      setLocalError(error.message);
    }
  }

  const message =
    localError ?? (props.error?.field !== 'general' ? props.error?.message : undefined);
  return (
    <form onSubmit={submit}>
      <label>
        Autómata en JSON
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} />
      </label>
      {message && <p role="alert">{message}</p>}
      <button type="submit">Procesar</button>
    </form>
  );
}
