import { useState, type FormEvent } from 'react';
import type { ValidationError } from '../../core/model';

/** Provisional de la fase 0: el formulario definitivo es la tarea 2.2 del Desarrollador 1. */
export function LanguageForm(props: {
  onSubmit: (input: { alphabet: string; regex: string }) => void;
  error?: ValidationError;
}) {
  const [alphabet, setAlphabet] = useState('');
  const [regex, setRegex] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    props.onSubmit({ alphabet, regex });
  }

  return (
    <form onSubmit={submit}>
      <label>
        Alfabeto
        <input value={alphabet} onChange={(e) => setAlphabet(e.target.value)} />
      </label>
      <label>
        Expresión regular
        <input value={regex} onChange={(e) => setRegex(e.target.value)} />
      </label>
      {props.error && props.error.field !== 'general' && <p role="alert">{props.error.message}</p>}
      <button type="submit">Construir</button>
    </form>
  );
}
