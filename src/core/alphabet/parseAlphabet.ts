import { ValidationError, repeatedSymbolMessage, symbolProblem, type Sym } from '../model';

const EMPTY_ALPHABET =
  'El alfabeto está vacío. Escribe los símbolos separados por comas, por ejemplo a,b.';

/** 'a, b,0' → ['a', 'b', '0']. Lanza ValidationError(field 'alphabet') con la posición del símbolo. */
export function parseAlphabet(text: string): Sym[] {
  if (text.trim() === '') throw new ValidationError(EMPTY_ALPHABET, 'alphabet');
  const symbols: Sym[] = [];
  let offset = 0; // en caracteres, no en unidades de código, para que ñ cuente como uno
  for (const part of text.split(',')) {
    const symbol = part.trim();
    const position = offset + [...part].length - [...part.trimStart()].length + 1;
    const problem = symbolProblem(symbol);
    if (problem) throw new ValidationError(problem, 'alphabet', position);
    if (symbols.includes(symbol)) {
      throw new ValidationError(repeatedSymbolMessage(symbol), 'alphabet', position);
    }
    symbols.push(symbol);
    offset += [...part].length + 1;
  }
  return symbols;
}
