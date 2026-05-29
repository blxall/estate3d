import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '../App';

const fetchMock = vi.fn();

const demoPayload = {
  id: 'dev_demo_premium',
  name: 'Estate3D Skyline',
  city: 'Москва',
  hero: {
    tagline: 'ЖК → корпус → этаж → квартира → окно',
    headline: 'Интерактивный выбор квартиры в 3D',
    lead: 'Демо-сцена для premium viewer',
  },
  viewer_config: { default_state: 'development_overview', accent_color: '#d7b56d' },
  buildings: [
    {
      id: 'building_a',
      name: 'Корпус A',
      floors_count: 16,
      model: { kind: 'procedural_tower', width: 18, depth: 12, floor_height: 3.25 },
      floors: Array.from({ length: 16 }, (_, index) => ({
        id: `floor_${index + 1}`,
        level: index + 1,
        label: `${index + 1} этаж`,
        elevation: (index + 1) * 3.25,
        units:
          index + 1 === 8
            ? [
                {
                  id: 'unit_8_1',
                  number: '81',
                  area_m2: 58.7,
                  rooms_count: 2,
                  price: 'от 24.8 млн ₽',
                  status: 'available',
                  plan_polygon: [],
                  rooms: [{ id: 'room_living', name: 'Гостиная-кухня', area_m2: 24.8, polygon: [] }],
                  viewpoints: [{ id: 'vp_living', room_id: 'room_living', label: 'Войти в гостиную', mode: 'walk', position: { x: 0, y: 0, z: 1.6 }, target: { x: 1, y: 1, z: 1.4 } }],
                  window_views: [{ id: 'window_city', room_id: 'room_living', label: 'Вид из окна на город', image_url: '/demo/window-views/unit_8_1-city.jpg', direction_degrees: 118 }],
                },
              ]
            : [],
      })),
    },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

describe('Premium development viewer route', () => {
  it('loads demo development and lets user drill from building to floor to unit and window view', async () => {
    window.history.pushState({}, '', '/developments/demo-premium/viewer');
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => demoPayload });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByText('Estate3D Skyline')).toBeInTheDocument();
    expect(screen.getByText('ЖК → корпус → этаж → квартира → окно')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/developments/demo-premium/viewer');

    fireEvent.click(screen.getByRole('button', { name: /8 этаж/i }));
    expect(await screen.findByText(/Камера поднимается на 8 этаж/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /квартира 81/i }));
    await waitFor(() => expect(screen.getAllByText(/Top-down план квартиры 81/i).length).toBeGreaterThan(0));
    expect(screen.getByText('Гостиная-кухня')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /вид из окна/i }));
    expect(await screen.findByText(/Панорама из окна/i)).toBeInTheDocument();
  });
});
