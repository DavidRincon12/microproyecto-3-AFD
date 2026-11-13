import { describe, expect, it } from 'vitest';
import { ValidationError } from '../model';
import { parseAlphabet } from './index';

function errorOf(text: string): ValidationError {
  try {
    parseAlphabet(text);
  } catch (error) {
    if (error instanceof ValidationError) return error;
    throw error;
  }
  throw new Error('parseAlphabet no lanzó ValidationError');
}

describe('parseAlphabet', () => {
  it('separa los símbolos por comas', () => {
    expect(parseAlphabet('a,b')).toEqual(['a', 'b']);
  });

  it('ignora los espacios alrededor de cada símbolo', () => {
    expect(parseAlphabet(' a , b ,0 ')).toEqual(['a', 'b', '0']);
  });

  it('acepta letras con tilde y ñ como un solo carácter', () => {
    expect(parseAlphabet('ñ,á')).toEqual(['ñ', 'á']);
  });

  it.each(['', '   '])('rechaza el alfabeto vacío %j', (text) => {
    const error = errorOf(text);
    expect(error.field).toBe('alphabet');
    expect(error.message).toBe(
      'El alfabeto está vacío. Escribe los símbolos separados por comas, por ejemplo a,b.',
    );
  });

  it('rechaza un símbolo vacío entre dos comas e indica su posición', () => {
    const error = errorOf('a,,b');
    expect(error.message).toContain('vacío');
    expect(error.position).toBe(3);
  });

  it('rechaza un símbolo repetido e indica su posición', () => {
    const error = errorOf('a,b,a');
    expect(error.message).toContain('"a" está repetido');
    expect(error.position).toBe(5);
  });

  it('rechaza un símbolo de más de un carácter', () => {
    const error = errorOf('ab,c');
    expect(error.message).toContain('un solo carácter');
    expect(error.position).toBe(1);
  });

  it('cuenta la posición por caracteres y no por unidades de código', () => {
    expect(errorOf('ñ,ab').position).toBe(3);
  });

  it.each(['a,*', 'a,ε', 'a,('])('rechaza el símbolo reservado en %j', (text) => {
    const error = errorOf(text);
    expect(error.message).toContain('reservado');
    expect(error.position).toBe(3);
  });
});
