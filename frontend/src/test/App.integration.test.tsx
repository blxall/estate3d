import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '../App';

const fetchMock = vi.fn();

afterEach(() => {
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

describe('App API integration', () => {
  it('loads properties from backend and creates a property from the form', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'prop_api',
              title: 'API объект',
              property_type: 'apartment',
              city: 'Москва',
              area_m2: '70',
              status: 'ready',
              public_slug: 'api-slug',
              is_public: true,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'prop_created',
          title: 'Новый объект',
          property_type: 'apartment',
          city: 'Сочи',
          area_m2: '44',
          status: 'draft',
          public_slug: 'created-slug',
          is_public: false,
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByText('API объект')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/название/i), { target: { value: 'Новый объект' } });
    fireEvent.change(screen.getByLabelText(/город/i), { target: { value: 'Сочи' } });
    fireEvent.change(screen.getByLabelText(/площадь/i), { target: { value: '44' } });
    fireEvent.click(screen.getByRole('button', { name: /^создать$/i }));

    await waitFor(() => expect(screen.getByText('Новый объект')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith('/api/properties');
    expect(fetchMock).toHaveBeenCalledWith('/api/properties', expect.objectContaining({ method: 'POST' }));
  });
});
