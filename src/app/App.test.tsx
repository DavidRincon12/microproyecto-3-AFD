import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '../core/model';
import { runPipeline } from '../core/pipeline';
import { App } from './App';

// App solo orquesta: se inyectan fallos en su borde con el núcleo para probar cómo los muestra.
vi.mock('../core/pipeline', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../core/pipeline')>()),
  runPipeline: vi.fn(),
}));

async function buildLanguage() {
  await userEvent.type(screen.getByLabelText('Alfabeto'), 'a,b');
  await userEvent.type(screen.getByLabelText('Expresión regular'), 'ab');
  await userEvent.click(screen.getByRole('button', { name: 'Construir' }));
}

describe('App', () => {
  it('muestra el título de la aplicación', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Autómatas finitos: construcción, determinización y minimización',
      }),
    ).toBeInTheDocument();
  });

  it('empieza en la Modalidad A con el formulario del lenguaje', () => {
    render(<App />);
    expect(screen.getByRole('tab', { name: 'Modalidad A: lenguaje' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByLabelText('Expresión regular')).toBeInTheDocument();
  });

  it('cambia al formulario del autómata al elegir la Modalidad B', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('tab', { name: 'Modalidad B: autómata' }));
    expect(screen.getByRole('tab', { name: 'Modalidad B: autómata' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.queryByLabelText('Expresión regular')).not.toBeInTheDocument();
  });

  it('muestra un error de entrada junto a su campo', async () => {
    vi.mocked(runPipeline).mockImplementation(() => {
      throw new ValidationError('Falta cerrar el paréntesis abierto en la posición 1.', 'regex', 1);
    });
    render(<App />);
    await buildLanguage();
    expect(screen.getByLabelText('Expresión regular')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Falta cerrar el paréntesis');
  });

  it('anuncia un error inesperado del proceso sin romper la página', async () => {
    vi.mocked(runPipeline).mockImplementation(() => {
      throw new Error('fallo interno');
    });
    render(<App />);
    await buildLanguage();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ocurrió un error inesperado: Error: fallo interno',
    );
  });
});
