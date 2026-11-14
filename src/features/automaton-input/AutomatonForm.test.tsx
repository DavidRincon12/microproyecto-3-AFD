import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AutomatonForm } from './index';

describe('AutomatonForm (RF-04)', () => {
  it('explica en español que el texto no es JSON válido en modo JSON', async () => {
    const onSubmit = vi.fn();
    render(<AutomatonForm onSubmit={onSubmit} />);

    // Cambiar a modo JSON
    await userEvent.click(
      screen.getByRole('button', { name: /Modo avanzado: Pegar autómata en JSON/i }),
    );

    const textarea = screen.getByLabelText(/Autómata en JSON/i);
    await userEvent.type(textarea, 'no es json');
    await userEvent.click(screen.getByRole('button', { name: /Procesar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El texto no es un JSON válido. Revisa las comas, las comillas y las llaves.',
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('procesa y envía un autómata válido usando el formulario de cuadrícula', async () => {
    const onSubmit = vi.fn();
    render(<AutomatonForm onSubmit={onSubmit} />);

    // El formulario ya tiene cargado un autómata por defecto
    await userEvent.click(screen.getByRole('button', { name: /Procesar Autómata/i }));

    expect(onSubmit).toHaveBeenCalled();
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.states.size).toBeGreaterThanOrEqual(2);
  });

  it('valida que no se use el nombre reservado error para un estado', async () => {
    const onSubmit = vi.fn();
    render(<AutomatonForm onSubmit={onSubmit} />);

    const statesInput = screen.getByLabelText(/Conjunto de Estados/i);
    await userEvent.clear(statesInput);
    await userEvent.type(statesInput, 'A, error');

    await userEvent.click(screen.getByRole('button', { name: /Procesar Autómata/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El nombre "error" está reservado para el estado sumidero',
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('valida que no haya estados repetidos', async () => {
    const onSubmit = vi.fn();
    render(<AutomatonForm onSubmit={onSubmit} />);

    const statesInput = screen.getByLabelText(/Conjunto de Estados/i);
    await userEvent.clear(statesInput);
    await userEvent.type(statesInput, 'A, B, A');

    await userEvent.click(screen.getByRole('button', { name: /Procesar Autómata/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('está repetido');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('carga correctamente un ejemplo desde el selector', async () => {
    const onSubmit = vi.fn();
    render(<AutomatonForm onSubmit={onSubmit} />);

    const select = screen.getByLabelText(/Cargar ejemplo de clase/i);
    await userEvent.selectOptions(select, 'afndQ');

    const statesInput = screen.getByLabelText(/Conjunto de Estados/i);
    expect(statesInput).toHaveValue('q0, q1, q2');
  });
});
