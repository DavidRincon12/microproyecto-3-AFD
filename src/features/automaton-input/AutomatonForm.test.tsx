import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AutomatonForm } from './index';

describe('AutomatonForm (provisional)', () => {
  it('explica en español que el texto no es JSON válido', async () => {
    const onSubmit = vi.fn();
    render(<AutomatonForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Autómata en JSON'), 'no es json');
    await userEvent.click(screen.getByRole('button', { name: 'Procesar' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'El texto no es un JSON válido. Revisa las comas, las comillas y las llaves.',
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
