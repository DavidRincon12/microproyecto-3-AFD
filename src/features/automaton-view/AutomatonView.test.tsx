import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { fromJson, type AutomatonJson } from '../../core/model';
import { AutomatonDiagram, TransitionTable } from './index';

import minClase6Fixture from '../../core/__fixtures__/min-clase-6-estados.json';

// Mock de @viz-js/viz para pruebas
vi.mock('@viz-js/viz', () => ({
  instance: vi.fn().mockResolvedValue({
    renderSVGElement: vi.fn().mockImplementation((dot: string) => {
      const svg = document.createElement('svg');
      svg.setAttribute('data-dot', dot);
      return svg;
    }),
  }),
}));

describe('AutomatonView (RF-11)', () => {
  const dfa = fromJson(minClase6Fixture.expected.minimal as AutomatonJson);

  it('renderiza la tabla de transición formal con flecha y asterisco', () => {
    render(<TransitionTable automaton={dfa} />);

    expect(screen.getByText('Tabla de Transición del Autómata')).toBeInTheDocument();
    expect(screen.getAllByText(/→/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/\*/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('(B,E)').length).toBeGreaterThanOrEqual(1);
  });

  it('no muestra la columna epsilon si no hay transiciones epsilon', () => {
    render(<TransitionTable automaton={dfa} />);
    expect(screen.queryByRole('columnheader', { name: 'ε' })).not.toBeInTheDocument();
  });

  it('muestra la columna epsilon y destinos múltiples si es un AFND con epsilon', () => {
    const nfa = fromJson({
      states: ['q0', 'q1'],
      alphabet: ['0'],
      initial: 'q0',
      finals: ['q1'],
      transitions: [
        ['q0', '0', 'q0'],
        ['q0', '0', 'q1'],
        ['q0', 'ε', 'q1'],
      ],
    });
    render(<TransitionTable automaton={nfa} />);

    expect(screen.getByRole('columnheader', { name: 'ε' })).toBeInTheDocument();
    expect(screen.getByText('q0, q1')).toBeInTheDocument();
  });

  it('renderiza el contenedor del diagrama con role img y aria-label', async () => {
    render(<AutomatonDiagram automaton={dfa} />);
    const imgContainer = screen.getByRole('img', {
      name: `Diagrama de transición con ${dfa.states.size} estados`,
    });
    expect(imgContainer).toBeInTheDocument();
  });
});
