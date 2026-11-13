import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '../../core/model';
import { LanguageForm } from './index';

describe('LanguageForm', () => {
  it('envía el alfabeto y la expresión escritos', async () => {
    const onSubmit = vi.fn();
    render(<LanguageForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Alfabeto'), 'a,b');
    await userEvent.type(screen.getByLabelText('Expresión regular'), 'ab');
    await userEvent.click(screen.getByRole('button', { name: 'Construir' }));
    expect(onSubmit).toHaveBeenCalledWith({ alphabet: 'a,b', regex: 'ab' });
  });

  it('muestra el error de la expresión junto a la expresión y no junto al alfabeto', () => {
    const error = new ValidationError(
      'Falta cerrar el paréntesis abierto en la posición 1.',
      'regex',
      1,
    );
    render(<LanguageForm onSubmit={vi.fn()} error={error} />);
    const regex = screen.getByLabelText('Expresión regular');
    expect(regex).toHaveAttribute('aria-invalid', 'true');
    expect(regex).toHaveAccessibleDescription(
      expect.stringContaining('Falta cerrar el paréntesis'),
    );
    expect(screen.getByLabelText('Alfabeto')).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('señala el carácter de la posición del error', async () => {
    const onSubmit = vi.fn();
    const { rerender } = render(<LanguageForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Expresión regular'), 'abc');
    const error = new ValidationError(
      '"c" (posición 3) no pertenece al alfabeto {a, b}.',
      'regex',
      3,
    );
    rerender(<LanguageForm onSubmit={onSubmit} error={error} />);
    expect(screen.getByText('c', { selector: 'mark' })).toBeInTheDocument();
  });

  it('inserta ε donde está el cursor', async () => {
    render(<LanguageForm onSubmit={vi.fn()} />);
    const regex = screen.getByLabelText<HTMLInputElement>('Expresión regular');
    await userEvent.type(regex, 'ab');
    regex.setSelectionRange(1, 1);
    await userEvent.click(screen.getByRole('button', { name: 'Insertar ε' }));
    expect(regex).toHaveValue('aεb');
  });

  it('carga un ejemplo en ambos campos', async () => {
    render(<LanguageForm onSubmit={vi.fn()} />);
    await userEvent.selectOptions(
      screen.getByLabelText('Cargar ejemplo'),
      'Cadenas sobre {a, b} que terminan en abb',
    );
    expect(screen.getByLabelText('Alfabeto')).toHaveValue('a,b');
    expect(screen.getByLabelText('Expresión regular')).toHaveValue('(a|b)*abb');
  });
});
