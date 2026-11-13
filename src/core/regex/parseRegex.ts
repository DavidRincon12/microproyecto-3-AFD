import { EPSILON, ValidationError, type Sym } from '../model';
import type { RegexNode } from './ast';

interface Token {
  char: string;
  /** Posición en el texto original, en caracteres y desde 1. */
  position: number;
}

const POSTFIX: Record<string, 'star' | 'plus' | 'optional'> = {
  '*': 'star',
  '+': 'plus',
  '?': 'optional',
};
const CANNOT_START_ATOM = new Set(['|', ')', '*', '+', '?']);
/** Acota la profundidad del árbol para que el análisis y Thompson no agoten la pila. */
const MAX_LENGTH = 200;

/**
 * Analizador descendente recursivo de la gramática:
 *   union = concat { "|" concat } ; concat = repeat { repeat } ;
 *   repeat = atom { "*" | "+" | "?" } ; atom = símbolo | "ε" | "(" union ")"
 * Lanza ValidationError(field 'regex', position).
 */
export function parseRegex(text: string, alphabet: ReadonlySet<Sym>): RegexNode {
  const tokens: Token[] = [...text]
    .map((char, i) => ({ char, position: i + 1 }))
    .filter((token) => token.char.trim() !== '');
  if (tokens.length === 0) {
    throw new ValidationError(
      'La expresión regular está vacía. Escribe una expresión, por ejemplo (a|b)*abb.',
      'regex',
    );
  }
  if (tokens.length > MAX_LENGTH) {
    throw new ValidationError(
      `La expresión tiene ${tokens.length} caracteres y el máximo es ${MAX_LENGTH}. Simplifícala.`,
      'regex',
    );
  }
  let index = 0;
  const peek = (): Token | undefined => tokens[index];
  const fail = (message: string, position: number): never => {
    throw new ValidationError(message, 'regex', position);
  };

  function union(): RegexNode {
    let node = concat();
    while (peek()?.char === '|') {
      index++;
      node = { kind: 'union', left: node, right: concat() };
    }
    return node;
  }

  function concat(): RegexNode {
    let node = repeat();
    for (let next = peek(); next && !CANNOT_START_ATOM.has(next.char); next = peek()) {
      node = { kind: 'concat', left: node, right: repeat() };
    }
    return node;
  }

  function repeat(): RegexNode {
    let node = atom();
    for (let next = peek(); next && POSTFIX[next.char]; next = peek()) {
      index++;
      node = { kind: POSTFIX[next.char], child: node };
    }
    return node;
  }

  function atom(): RegexNode {
    const token = peek();
    if (token === undefined) {
      const previous = tokens[index - 1];
      return fail(
        `Falta una expresión después de "${previous.char}" (posición ${previous.position}).`,
        previous.position,
      );
    }
    const { char, position } = token;
    if (char === '(') {
      index++;
      if (peek()?.char === ')')
        fail(`Los paréntesis de la posición ${position} están vacíos.`, position);
      const inner = union();
      if (peek()?.char !== ')')
        fail(`Falta cerrar el paréntesis abierto en la posición ${position}.`, position);
      index++;
      return inner;
    }
    if (char === '|' || char === ')') {
      return fail(`Falta una expresión antes de "${char}" (posición ${position}).`, position);
    }
    if (POSTFIX[char]) {
      return fail(
        `"${char}" no tiene una expresión a la que aplicarse (posición ${position}).`,
        position,
      );
    }
    index++;
    if (char === EPSILON) return { kind: 'epsilon' };
    if (alphabet.has(char)) return { kind: 'symbol', value: char };
    return fail(
      `"${char}" (posición ${position}) no pertenece al alfabeto {${[...alphabet].join(', ')}}.`,
      position,
    );
  }

  const ast = union();
  const extra = peek(); // lo único que union deja sin consumir es un ")" sobrante
  if (extra)
    fail(
      `El paréntesis de la posición ${extra.position} no tiene uno que lo abra.`,
      extra.position,
    );
  return ast;
}
