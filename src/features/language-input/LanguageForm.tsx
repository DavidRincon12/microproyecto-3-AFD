import { useRef, useState, type FormEvent, type ReactNode, type Ref } from 'react';
import { LAMBDA, type InputField, type ValidationError } from '../../core/model';
import styles from './LanguageForm.module.css';

interface Example {
  description: string;
  alphabet: string;
  regex: string;
}

const EXAMPLES = Object.values(
  import.meta.glob<Example>('../../core/__fixtures__/er-*.json', {
    eager: true,
    import: 'default',
  }),
).sort((a, b) => {
  const aIsNumeric = /^[0-9, ]+$/.test(a.alphabet);
  const bIsNumeric = /^[0-9, ]+$/.test(b.alphabet);
  if (aIsNumeric && !bIsNumeric) return -1;
  if (!aIsNumeric && bIsNumeric) return 1;
  return a.description.localeCompare(b.description);
});
const OPERATORS = [LAMBDA, '|', '*', '+', '?', '(', ')'];
const REGEX_HELP =
  'Unión |, concatenación sin operador, * cero o más, + una o más, ? opcional, ( ) agrupación y λ cadena vacía. Los operadores *, + y ? se aplican antes que la concatenación, y esta antes que |.';

/** El texto con el carácter de la posición indicada (desde 1) señalado. */
function Marked(props: { text: string; position?: number }) {
  const chars = [...props.text];
  const index = (props.position ?? 0) - 1;
  if (index < 0 || index >= chars.length) return null;
  return (
    <code className={styles.marcado} aria-hidden="true">
      {chars.slice(0, index).join('')}
      <mark>{chars[index]}</mark>
      {chars.slice(index + 1).join('')}
    </code>
  );
}

function Field({
  field,
  label,
  help,
  value,
  submitted,
  onChange,
  error: received,
  ref,
  className,
  placeholder,
  children,
}: {
  field: InputField;
  label: string;
  help: string;
  value: string;
  /** Texto enviado: la marca de posición solo vale mientras el campo no cambie. */
  submitted: string;
  onChange: (value: string) => void;
  error?: ValidationError;
  ref?: Ref<HTMLInputElement>;
  className?: string;
  placeholder?: string;
  children?: ReactNode;
}) {
  const id = `lenguaje-${field}`;
  const error = received?.field === field ? received : undefined;
  return (
    <div className={styles.campo}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        ref={ref}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-ayuda${error ? ` ${id}-error` : ''}`}
        autoComplete="off"
        spellCheck={false}
      />
      {children}
      <p id={`${id}-ayuda`} className={styles.ayuda}>
        {help}
      </p>
      {error && value === submitted && <Marked text={value} position={error.position} />}
      {error && (
        <p id={`${id}-error`} role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

export function LanguageForm(props: {
  onSubmit: (input: { alphabet: string; regex: string }) => void;
  error?: ValidationError;
}) {
  const [alphabet, setAlphabet] = useState('');
  const [regex, setRegex] = useState('');
  const [submitted, setSubmitted] = useState({ alphabet: '', regex: '' });
  const regexInput = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted({ alphabet, regex });
    props.onSubmit({ alphabet, regex });
  }

  function insert(operator: string) {
    const input = regexInput.current;
    const start = input?.selectionStart ?? regex.length;
    const end = input?.selectionEnd ?? regex.length;
    setRegex(regex.slice(0, start) + operator + regex.slice(end));
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + operator.length, start + operator.length);
    });
  }

  function loadExample(description: string) {
    const example = EXAMPLES.find((item) => item.description === description);
    if (!example) return;
    setAlphabet(example.alphabet);
    setRegex(example.regex);
  }

  return (
    <form className={styles.formulario} onSubmit={submit} noValidate>
      <div className={styles.campo}>
        <label htmlFor="lenguaje-ejemplo">Cargar ejemplo</label>
        <select id="lenguaje-ejemplo" defaultValue="" onChange={(e) => loadExample(e.target.value)}>
          <option value="" disabled>
            Elige un ejemplo
          </option>
          {EXAMPLES.map((example) => (
            <option key={example.description} value={example.description}>
              {example.description}
            </option>
          ))}
        </select>
      </div>
      <Field
        field="alphabet"
        label="Alfabeto"
        help="Símbolos de un solo carácter separados por comas, por ejemplo 0,1."
        placeholder="0,1"
        value={alphabet}
        submitted={submitted.alphabet}
        onChange={setAlphabet}
        error={props.error}
      />
      <Field
        field="regex"
        label="Expresión regular"
        help={REGEX_HELP}
        placeholder="(0|1)*011"
        value={regex}
        submitted={submitted.regex}
        onChange={setRegex}
        error={props.error}
        ref={regexInput}
        className={styles.expresion}
      >
        <div className={styles.operadores} role="group" aria-label="Operadores">
          {OPERATORS.map((operator) => (
            <button
              key={operator}
              type="button"
              aria-label={`Insertar ${operator}`}
              onClick={() => insert(operator)}
            >
              {operator}
            </button>
          ))}
        </div>
        <details className={styles.guia}>
          <summary className={styles.guiaSummary}>
            💡 ¿Cómo escribir tu lenguaje? Ver ejemplos y patrones frecuentes
          </summary>
          <ul className={styles.guiaLista}>
            <li>
              <strong>Termina en 011:</strong> <code>(0|1)*011</code> (o sobre a,b:{' '}
              <code>(a|b)*abb</code>)
            </li>
            <li>
              <strong>Comienza en 0:</strong> <code>0(0|1)*</code>
            </li>
            <li>
              <strong>Contiene la subcadena 101:</strong> <code>(0|1)*101(0|1)*</code>
            </li>
            <li>
              <strong>Ceros seguidos de unos:</strong> <code>0+1+</code> (o <code>0*1*</code> si se
              permite cero)
            </li>
            <li>
              <strong>Longitud par:</strong> <code>((0|1)(0|1))*</code>
            </li>
            <li>
              <strong>Cadena vacía:</strong> pulsa el botón <code>λ</code> o escribe <code>λ</code>
            </li>
          </ul>
        </details>
      </Field>
      <button type="submit" className={styles.enviar}>
        Construir
      </button>
    </form>
  );
}
