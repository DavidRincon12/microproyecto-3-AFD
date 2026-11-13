import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fromJson, type Automaton, type StageResult, type StateId } from '../../core/model';
import type { PipelineResult } from '../../core/pipeline';
import { PipelineView } from './index';

// La tabla y el diagrama son del Desarrollador 2: aquí solo importa qué recibe cada uno.
vi.mock('../automaton-view', () => {
  const fake =
    (testId: string) => (props: { automaton: Automaton; highlight?: readonly StateId[] }) => (
      <div
        data-testid={testId}
        data-estados={[...props.automaton.states].join(',')}
        data-resaltados={props.highlight?.join(',') ?? ''}
      />
    );
  return { TransitionTable: fake('tabla'), AutomatonDiagram: fake('diagrama') };
});

const small = (states: string[]) =>
  fromJson({ states, alphabet: ['0'], initial: states[0], finals: [], transitions: [] });
const dfa: Automaton = {
  ...small(['A', 'AC']),
  origin: new Map([
    ['A', new Set(['A'])],
    ['AC', new Set(['A', 'C'])],
  ]),
};
const minimal = small(['A', '(B,E)']);
const stage = (
  partial: Partial<StageResult> & Pick<StageResult, 'stage' | 'title'>,
): StageResult => ({
  summary: `Resumen de ${partial.title}`,
  automaton: small(['q0', 'q1']),
  steps: [{ title: `Paso de ${partial.title}`, detail: 'Detalle.' }],
  ...partial,
});
const result: PipelineResult = {
  stages: [
    stage({ stage: 'construction', title: 'Construcción del AFND-ε (Thompson)' }),
    stage({ stage: 'classification', title: 'Clasificación' }),
    stage({
      stage: 'determinization',
      title: 'Conversión AFND → AFD',
      automaton: dfa,
      steps: [
        {
          title: 'Estado AC',
          detail: 'Se calcula a dónde va AC.',
          highlight: ['AC'],
          table: { headers: ['Símbolo', 'Resultado'], rows: [['0', 'B']] },
        },
      ],
    }),
    stage({ stage: 'reachability', title: 'Eliminación de estados inaccesibles', steps: [] }),
    stage({ stage: 'minimization', title: 'Minimización (tabla de pares)', automaton: minimal }),
  ],
  minimal,
};

const openStage = (title: string) => userEvent.click(screen.getByRole('tab', { name: title }));

describe('PipelineView', () => {
  it('muestra una pestaña por etapa y la última es la minimización', () => {
    render(<PipelineView result={result} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(tabs[4]).toHaveTextContent('Minimización (tabla de pares)');
  });

  it('muestra el resumen de la etapa elegida', async () => {
    render(<PipelineView result={result} />);
    await openStage('Clasificación');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Resumen de Clasificación');
  });

  it('muestra la correspondencia de los estados con la etapa anterior', async () => {
    render(<PipelineView result={result} />);
    await openStage('Conversión AFND → AFD');
    expect(screen.getByText('AC proviene de {A, C}')).toBeInTheDocument();
  });

  it('muestra los pasos con su tabla intermedia', async () => {
    render(<PipelineView result={result} />);
    await openStage('Conversión AFND → AFD');
    const steps = screen.getByRole('list', { name: 'Pasos' });
    expect(within(steps).getByRole('cell', { name: 'B' })).toBeInTheDocument();
  });

  it('resalta en el diagrama los estados del paso elegido', async () => {
    render(<PipelineView result={result} />);
    await openStage('Conversión AFND → AFD');
    await userEvent.click(screen.getByRole('button', { name: 'Estado AC' }));
    expect(screen.getByRole('button', { name: 'Estado AC' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getAllByTestId('diagrama')[0]).toHaveAttribute('data-resaltados', 'AC');
  });

  it('compara la etapa con el AFD mínimo', async () => {
    render(<PipelineView result={result} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Comparar con el AFD mínimo' }));
    const comparison = screen.getByRole('region', { name: 'AFD mínimo' });
    expect(within(comparison).getByTestId('tabla')).toHaveAttribute('data-estados', 'A,(B,E)');
  });

  it('no muestra una lista vacía en una etapa sin pasos', async () => {
    render(<PipelineView result={result} />);
    await openStage('Eliminación de estados inaccesibles');
    expect(screen.queryByRole('list', { name: 'Pasos' })).not.toBeInTheDocument();
  });
});
