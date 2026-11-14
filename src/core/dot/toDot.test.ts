import { describe, expect, it } from 'vitest';
import { fromJson, type AutomatonJson } from '../model';
import { toDot } from './toDot';

import minClase6Fixture from '../__fixtures__/min-clase-6-estados.json';

describe('toDot (RF-11)', () => {
  const dfa = fromJson(minClase6Fixture.automaton as AutomatonJson);

  it('asigna doublecircle a estados finales y conecta __inicio con el inicial', () => {
    const dot = toDot(dfa);

    expect(dot).toContain('"__inicio" [shape=point];');
    expect(dot).toContain('"__inicio" -> "A";');
    expect(dot).toContain('"D" [shape=doublecircle];');
  });

  it('agrupa símbolos con el mismo origen y destino en una sola arista', () => {
    const automaton = fromJson({
      states: ['q0', 'q1'],
      alphabet: ['0', '1'],
      initial: 'q0',
      finals: ['q1'],
      transitions: [
        ['q0', '0', 'q1'],
        ['q0', '1', 'q1'],
      ],
    });
    const dot = toDot(automaton);

    expect(dot).toContain('"q0" -> "q1" [label="0,1"];');
    expect(dot.match(/"q0" -> "q1"/g)?.length).toBe(1);
  });

  it('escapa y coloca entre comillas nombres con caracteres especiales como (B,E)', () => {
    const automaton = fromJson({
      states: ['A', '(B,E)'],
      alphabet: ['0'],
      initial: 'A',
      finals: ['(B,E)'],
      transitions: [['A', '0', '(B,E)']],
    });
    const dot = toDot(automaton);

    expect(dot).toContain('"(B,E)" [shape=doublecircle];');
    expect(dot).toContain('"A" -> "(B,E)" [label="0"];');
  });

  it('aplica estilo de resaltado fillcolor a los estados especificados en highlight', () => {
    const dot = toDot(dfa, ['B', 'D']);

    expect(dot).toContain('"B" [style=filled, fillcolor="#bae6fd", penwidth=2];');
    expect(dot).toContain(
      '"D" [shape=doublecircle, style=filled, fillcolor="#bae6fd", penwidth=2];',
    );
    expect(dot).not.toContain('"A" [style=filled');
  });

  it('produce exactamente el mismo texto para la misma entrada (determinismo)', () => {
    const dot1 = toDot(dfa);
    const dot2 = toDot(dfa);
    expect(dot1).toBe(dot2);
  });
});
