import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
                  plan_polygon: [
                    { x: 0, y: 0, z: 0 },
                    { x: 5.8, y: 0, z: 0 },
                    { x: 5.8, y: 8.8, z: 0 },
                    { x: 0, y: 8.8, z: 0 },
                  ],
                  rooms: [
                    {
                      id: 'room_living',
                      name: 'Гостиная-кухня',
                      area_m2: 24.8,
                      polygon: [
                        { x: 0, y: 0, z: 0 },
                        { x: 5.2, y: 0, z: 0 },
                        { x: 5.2, y: 4.6, z: 0 },
                        { x: 0, y: 4.6, z: 0 },
                      ],
                    },
                  ],
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
  cleanup();
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

    fireEvent.click(await screen.findByRole('button', { name: /3D floor mesh: 8 этаж/i }));
    expect(await screen.findByText(/Камера поднимается на 8 этаж/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /3D unit mesh: квартира 81/i }));
    await waitFor(() => expect(screen.getAllByText(/Top-down план квартиры 81/i).length).toBeGreaterThan(0));
    expect(screen.getAllByText('Гостиная-кухня').length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: /вид из окна/i })[1]);
    await waitFor(() => expect(screen.getAllByText(/Панорама из окна/i).length).toBeGreaterThan(0));
  });

  it('drives explicit camera states, walk mode, room plan geometry, and lead CTA', async () => {
    window.history.pushState({}, '', '/developments/demo-premium/viewer');
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => demoPayload })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'lead_123',
          development_id: 'dev_demo_premium',
          development_name: 'Estate3D Skyline',
          building_id: 'building_a',
          floor_id: 'floor_8',
          unit_id: 'unit_8_1',
          unit_number: '81',
          viewer_state: 'window_view',
          contact_name: '',
          contact_phone: '',
          contact_email: '',
          message: '',
          status: 'new',
          created_at: '2026-05-29T00:00:00Z',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByText('State: development_overview')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: /3D floor mesh: 8 этаж/i }));
    expect(await screen.findByText('State: floor_focus')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /3D unit mesh: квартира 81/i }));
    expect(await screen.findByText('State: unit_top_down')).toBeInTheDocument();
    expect(screen.getByLabelText('Планировка квартиры 81')).toBeInTheDocument();
    expect(screen.getByText('Room polygon: 0,0 5.2,0 5.2,4.6 0,4.6')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /войти в гостиную/i }));
    expect(await screen.findByText('State: walk_mode')).toBeInTheDocument();
    expect(screen.getAllByText(/Walk mode: Войти в гостиную/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: /вид из окна/i })[1]);
    expect(await screen.findByText('State: window_view')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /оставить заявку/i }));
    expect(await screen.findByText(/Заявка отправлена: #lead_123/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith('/api/developments/demo-premium/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        building_id: 'building_a',
        floor_id: 'floor_8',
        unit_id: 'unit_8_1',
        viewer_state: 'window_view',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        message: 'Viewer lead from Estate3D premium demo',
      }),
    });
  });

  it('uses the R3F scene slice floor mesh bridge while keeping DOM fallback controls', async () => {
    window.history.pushState({}, '', '/developments/demo-premium/viewer');
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => demoPayload });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByText('Estate3D Skyline')).toBeInTheDocument();
    expect(await screen.findByLabelText('R3F scene slice for Корпус A')).toBeInTheDocument();
    expect(screen.getByText(/R3F-ready tower geometry/i)).toBeInTheDocument();
    expect(screen.getByLabelText('R3F building shell: Корпус A')).toBeInTheDocument();
    expect(screen.getByText('Camera frame: overview')).toBeInTheDocument();
    const meshFloor = screen.getByRole('button', { name: /3D floor mesh: 8 этаж/i });
    expect(meshFloor).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Backup floor control: 8 этаж/i })).toBeInTheDocument();

    fireEvent.mouseEnter(meshFloor);
    expect(await screen.findByText('Hover floor: 8 этаж')).toBeInTheDocument();
    fireEvent.click(meshFloor);

    expect(await screen.findByText('Selected mesh: 8 этаж')).toBeInTheDocument();
    expect(await screen.findByText('Camera frame: floor_8')).toBeInTheDocument();
    expect(await screen.findByText('Camera target: 0,2.6,0')).toBeInTheDocument();
    expect(await screen.findByText('Camera position: 3.8,5.35,5.6')).toBeInTheDocument();
    expect(await screen.findByText('Floor camera: 8 этаж')).toBeInTheDocument();
    expect(await screen.findByText('State: floor_focus')).toBeInTheDocument();
    expect(await screen.findByText(/Камера поднимается на 8 этаж/i)).toBeInTheDocument();
    await screen.findByRole('button', { name: /3D unit mesh: квартира 81/i });
    expect(screen.getAllByText(/Квартира\s+81/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /3D unit mesh: квартира 81/i })).toBeInTheDocument();
  });

  it('uses the R3F unit mesh bridge to enter unit top-down mode', async () => {
    window.history.pushState({}, '', '/developments/demo-premium/viewer');
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => demoPayload });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /3D floor mesh: 8 этаж/i }));
    const unitMesh = await screen.findByRole('button', { name: /3D unit mesh: квартира 81/i });
    expect(unitMesh).toBeInTheDocument();
    expect(screen.getByText('Unit footprints: 1')).toBeInTheDocument();
    expect(screen.getByText('Unit footprint: квартира 81 · available')).toBeInTheDocument();

    fireEvent.click(unitMesh);

    expect(await screen.findByText('State: unit_top_down')).toBeInTheDocument();
    expect(await screen.findByText('Camera frame: unit_8_1')).toBeInTheDocument();
    expect(await screen.findByText('Unit camera: квартира 81')).toBeInTheDocument();
    expect(await screen.findByLabelText('Планировка квартиры 81')).toBeInTheDocument();
  });

  it('uses the R3F room mesh bridge to enter walk mode from selected apartment', async () => {
    window.history.pushState({}, '', '/developments/demo-premium/viewer');
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => demoPayload });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /3D floor mesh: 8 этаж/i }));
    fireEvent.click(await screen.findByRole('button', { name: /3D unit mesh: квартира 81/i }));
    const roomMesh = await screen.findByRole('button', { name: /3D room mesh: Гостиная-кухня/i });
    expect(roomMesh).toBeInTheDocument();
    expect(screen.getByText('Room footprints: 1')).toBeInTheDocument();
    expect(screen.getByText('Room footprint: Гостиная-кухня · 24.8 м²')).toBeInTheDocument();

    fireEvent.click(roomMesh);

    expect(await screen.findByText('State: walk_mode')).toBeInTheDocument();
    expect(screen.getAllByText(/Walk mode: Войти в гостиную/i).length).toBeGreaterThan(0);
  });

  it('uses the R3F window hotspot bridge to open the selected window view', async () => {
    window.history.pushState({}, '', '/developments/demo-premium/viewer');
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => demoPayload });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /3D floor mesh: 8 этаж/i }));
    fireEvent.click(await screen.findByRole('button', { name: /3D unit mesh: квартира 81/i }));
    const roomMesh = await screen.findByRole('button', { name: /3D room mesh: Гостиная-кухня/i });
    fireEvent.click(roomMesh);

    const windowHotspot = await screen.findByRole('button', { name: /3D window hotspot: Вид из окна на город/i });
    expect(windowHotspot).toBeInTheDocument();
    expect(screen.getByText('Window hotspots: 1')).toBeInTheDocument();
    expect(screen.getByText('Window hotspot: Вид из окна на город · 118°')).toBeInTheDocument();

    fireEvent.click(windowHotspot);

    expect(await screen.findByText('State: window_view')).toBeInTheDocument();
    expect(screen.getAllByText(/Панорама из окна: Вид из окна на город/i).length).toBeGreaterThan(0);
  });
});
