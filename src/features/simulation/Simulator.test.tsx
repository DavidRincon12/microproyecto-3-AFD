import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { type AutomatonJson, fromJson } from '../../core/model';
import { Simulator } from './index';

import minClase6Fixture from '../../core/__fixtures__/min-clase-6-estados.json';

describe('Simulator (RF-12)', () => {
  const dfa = fromJson(minClase6Fixture.expected.minimal as AutomatonJson);

  it('evalúa una cadena aceptada mostrando el veredicto en texto', async () => {
    render(<Simulator automaton={dfa} />);

    const input = screen.getByLabelText(/Cadena a evaluar/i);
    await userEvent.type(input, '00');
    await userEvent.click(screen.getByRole('button', { name: /Simular/i }));

    expect(screen.getByText(/Veredicto: Aceptada/i)).toBeInTheDocument();
    expect(screen.getByText(/El recorrido finalizó en el estado 'D'/i)).toBeInTheDocument();
  });

  it('evalúa una cadena rechazada mostrando el veredicto en texto', async () => {
    render(<Simulator automaton={dfa} />);

    const input = screen.getByLabelText(/Cadena a evaluar/i);
    await userEvent.type(input, '0');
    await userEvent.click(screen.getByRole('button', { name: /Simular/i }));

    expect(screen.getByText(/Veredicto: Rechazada/i)).toBeInTheDocument();
  });

  it('evalúa la cadena vacía indicándola como cadena vacía (ε)', async () => {
    render(<Simulator automaton={dfa} />);

    await userEvent.click(screen.getByRole('button', { name: /Simular/i }));

    expect(screen.getByText(/Veredicto: Rechazada/i)).toBeInTheDocument();
    expect(screen.getAllByText(/cadena vacía \(ε\)/i).length).toBeGreaterThanOrEqual(1);
  });

  it('muestra un mensaje de error accesible si se ingresa un símbolo ajeno al alfabeto', async () => {
    render(<Simulator automaton={dfa} />);

    const input = screen.getByLabelText(/Cadena a evaluar/i);
    await userEvent.type(input, '0x1');
    await userEvent.click(screen.getByRole('button', { name: /Simular/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      /El símbolo 'x'.*no pertenece al alfabeto/i,
    );
  });

  it('permite avanzar y retroceder pasos en el recorrido de la cadena', async () => {
    render(<Simulator automaton={dfa} />);

    const input = screen.getByLabelText(/Cadena a evaluar/i);
    await userEvent.type(input, '00');
    await userEvent.click(screen.getByRole('button', { name: /Simular/i }));

    const prevBtn = screen.getByRole('button', { name: /Paso anterior/i });
    const nextBtn = screen.getByRole('button', { name: /Paso siguiente/i });

    expect(screen.getByText(/Paso 2 de 2/i)).toBeInTheDocument();

    await userEvent.click(prevBtn);
    expect(screen.getByText(/Paso 1 de 2/i)).toBeInTheDocument();

    await userEvent.click(nextBtn);
    expect(screen.getByText(/Paso 2 de 2/i)).toBeInTheDocument();
  });
});
