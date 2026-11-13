import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

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
    expect(screen.getByLabelText('Alfabeto')).toBeInTheDocument();
  });

  it('cambia al formulario del autómata al elegir la Modalidad B', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('tab', { name: 'Modalidad B: autómata' }));
    expect(screen.getByRole('tab', { name: 'Modalidad B: autómata' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.queryByLabelText('Alfabeto')).not.toBeInTheDocument();
  });

  it('anuncia un error inesperado del proceso sin romper la página', async () => {
    render(<App />);
    await userEvent.type(screen.getByLabelText('Alfabeto'), 'a,b');
    await userEvent.type(screen.getByLabelText('Expresión regular'), 'ab');
    await userEvent.click(screen.getByRole('button', { name: 'Construir' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado');
  });
});
