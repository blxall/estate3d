import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CreatePropertyForm } from '../components/CreatePropertyForm';

describe('CreatePropertyForm', () => {
  it('submits required MVP property fields', () => {
    const onSubmit = vi.fn();
    render(<CreatePropertyForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/название/i), { target: { value: 'Квартира у парка' } });
    fireEvent.change(screen.getByLabelText(/тип объекта/i), { target: { value: 'apartment' } });
    fireEvent.change(screen.getByLabelText(/город/i), { target: { value: 'Москва' } });
    fireEvent.change(screen.getByLabelText(/площадь/i), { target: { value: '54.5' } });
    fireEvent.click(screen.getByRole('button', { name: /создать/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Квартира у парка',
      property_type: 'apartment',
      city: 'Москва',
      area_m2: '54.5',
    });
  });
});
