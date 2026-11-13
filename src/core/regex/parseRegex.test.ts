import { describe, expect, it } from 'vitest';
import { ValidationError } from '../model';
import { parseRegex, type RegexNode } from './index';

const ab = new Set(['a', 'b']);
const abc = new Set(['a', 'b', 'c']);
const s = (value: string): RegexNode => ({ kind: 'symbol', value });
const cat = (left: RegexNode, right: RegexNode): RegexNode => ({ kind: 'concat', left, right });
const or = (left: RegexNode, right: RegexNode): RegexNode => ({ kind: 'union', left, right });
const star = (child: RegexNode): RegexNode => ({ kind: 'star', child });

function errorOf(text: string, alphabet: ReadonlySet<string> = ab): ValidationError {
  try {
    parseRegex(text, alphabet);
  } catch (error) {
    if (error instanceof ValidationError) return error;
    throw error;
  }
  throw new Error('parseRegex no lanzó ValidationError');
}

describe('parseRegex: estructura', () => {
  it('da a la concatenación más precedencia que a la unión', () => {
    expect(parseRegex('ab|c', abc)).toEqual(or(cat(s('a'), s('b')), s('c')));
  });

  it('aplica la estrella solo al símbolo anterior', () => {
    expect(parseRegex('ab*', ab)).toEqual(cat(s('a'), star(s('b'))));
  });

  it('agrupa con paréntesis y concatena de izquierda a derecha', () => {
    expect(parseRegex('(a|b)*abb', ab)).toEqual(
      cat(cat(cat(star(or(s('a'), s('b'))), s('a')), s('b')), s('b')),
    );
  });

  it('ignora los espacios', () => {
    expect(parseRegex('a b', ab)).toEqual(parseRegex('ab', ab));
  });

  it('acepta operadores repetidos', () => {
    expect(parseRegex('a**', ab)).toEqual(star(star(s('a'))));
  });

  it('reconoce más, opcional y ε', () => {
    expect(parseRegex('a+b?ε', ab)).toEqual(
      cat(cat({ kind: 'plus', child: s('a') }, { kind: 'optional', child: s('b') }), {
        kind: 'epsilon',
      }),
    );
  });

  it('acepta símbolos con tilde o ñ', () => {
    expect(parseRegex('ñ*', new Set(['ñ']))).toEqual(star(s('ñ')));
  });
});

describe('parseRegex: errores', () => {
  it.each(['', '   '])('rechaza la expresión vacía %j', (text) => {
    const error = errorOf(text);
    expect(error.field).toBe('regex');
    expect(error.message).toContain('vacía');
  });

  it.each([
    ['(ab', 1, 'Falta cerrar el paréntesis'],
    ['a ( b', 3, 'Falta cerrar el paréntesis'],
    ['ab)', 3, 'no tiene uno que lo abra'],
    ['()', 1, 'vacíos'],
    ['*a', 1, 'no tiene una expresión'],
    ['a|', 2, 'después de "|"'],
    ['|a', 1, 'antes de "|"'],
    ['a||b', 3, 'antes de "|"'],
    ['(a|)', 4, 'antes de ")"'],
    ['abc', 3, 'no pertenece al alfabeto {a, b}'],
    ['ñc', 2, 'no pertenece al alfabeto'],
  ])('%j falla en la posición %i', (text, position, fragment) => {
    const error = errorOf(text as string, text === 'ñc' ? new Set(['ñ']) : ab);
    expect(error.field).toBe('regex');
    expect(error.position).toBe(position);
    expect(error.message).toContain(fragment);
  });
});
