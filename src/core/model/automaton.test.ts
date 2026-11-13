import { describe, expect, it } from 'vitest';
import {
  EPSILON,
  ValidationError,
  fromJson,
  targets,
  toJson,
  type AutomatonJson,
  type InputField,
} from './index';

const example: AutomatonJson = {
  states: ['A', 'B', 'C'],
  alphabet: ['0', '1'],
  initial: 'A',
  finals: ['C'],
  transitions: [
    ['A', '0', 'B'],
    ['A', '1', 'A'],
    ['A', '1', 'C'],
    ['B', 'ε', 'C'],
  ],
};

function validationErrorOf(json: AutomatonJson): ValidationError {
  try {
    fromJson(json);
  } catch (error) {
    if (error instanceof ValidationError) return error;
    throw error;
  }
  throw new Error('fromJson no lanzó ValidationError');
}

function expectInvalid(json: AutomatonJson, field: InputField, fragment: string) {
  const error = validationErrorOf(json);
  expect(error.field).toBe(field);
  expect(error.message).toContain(fragment);
}

describe('fromJson y toJson', () => {
  it('convierte el ejemplo de los contratos y lo devuelve igual', () => {
    expect(toJson(fromJson(example))).toEqual(example);
  });

  it('representa δ con conjuntos de destinos, incluida ε', () => {
    const automaton = fromJson(example);
    expect([...targets(automaton, 'A', '1')]).toEqual(['A', 'C']);
    expect([...targets(automaton, 'B', EPSILON)]).toEqual(['C']);
  });

  it('devuelve el conjunto vacío cuando no hay transición', () => {
    expect(targets(fromJson(example), 'C', '0').size).toBe(0);
  });

  it('rechaza un autómata sin estados', () => {
    expectInvalid({ ...example, states: [] }, 'states', 'al menos un estado');
  });

  it('rechaza estados repetidos', () => {
    expectInvalid({ ...example, states: ['A', 'B', 'A', 'C'] }, 'states', '"A" está repetido');
  });

  it('rechaza un alfabeto vacío', () => {
    expectInvalid({ ...example, alphabet: [], transitions: [] }, 'alphabet', 'vacío');
  });

  it('rechaza un símbolo reservado en el alfabeto', () => {
    expectInvalid({ ...example, alphabet: ['0', '*'] }, 'alphabet', 'reservado');
  });

  it('rechaza un símbolo de dos caracteres en el alfabeto', () => {
    expectInvalid({ ...example, alphabet: ['0', 'a1'] }, 'alphabet', 'un solo carácter');
  });

  it('rechaza un símbolo repetido en el alfabeto', () => {
    expectInvalid({ ...example, alphabet: ['0', '1', '0'] }, 'alphabet', '"0" está repetido');
  });

  it('rechaza un estado inicial que no existe', () => {
    expectInvalid({ ...example, initial: 'Z' }, 'initial', '"Z"');
  });

  it('rechaza un estado final que no existe', () => {
    expectInvalid({ ...example, finals: ['C', 'Z'] }, 'finals', '"Z"');
  });

  it('rechaza una transición hacia un estado que no existe', () => {
    expectInvalid({ ...example, transitions: [['A', '0', 'Z']] }, 'transitions', 'el estado "Z"');
  });

  it('rechaza una transición con un símbolo fuera del alfabeto que no es ε', () => {
    expectInvalid({ ...example, transitions: [['A', 'c', 'B']] }, 'transitions', 'el símbolo "c"');
  });
});
