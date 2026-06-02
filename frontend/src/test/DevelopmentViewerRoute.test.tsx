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

    expect(screen.getByText('Unit card: Квартира 81 · 2 комнаты · 58.7 м² · от 24.8 млн ₽ · Доступна')).toBeInTheDocument();
    expect(screen.getByText('Готова к просмотру: планировка, прогулка и вид из окна доступны.')).toBeInTheDocument();
    expect(screen.getByText('Lead context: Estate3D Skyline · Корпус A · 8 этаж · квартира 81 · window_view · Войти в гостиную · Вид из окна на город')).toBeInTheDocument();
    expect(screen.getByText('Interaction trail: select_floor → select_unit → enter_walk_mode → open_window_view')).toBeInTheDocument();
    expect(screen.getByText('Путь клиента: 8 этаж → квартира 81 → Войти в гостиную → Вид из окна на город')).toBeInTheDocument();
    expect(screen.getByText('Менеджеру: клиент последовательно выбрал 8 этаж, квартиру 81, вошел в Войти в гостиную и открыл Вид из окна на город.')).toHaveClass('interaction-manager-note');
    expect(screen.getByText('Manager follow-up: квартира 81 · available · 3 шага')).toBeInTheDocument();
    expect(screen.getByText('Уточнить бюджет и срок покупки по квартире 81.')).toBeInTheDocument();
    expect(screen.getByText(/CRM note: Lead context: Estate3D Skyline/i)).toHaveClass('manager-follow-up-copy');
    expect(screen.getByText('Broker script: квартира 81 · window_view · ready to send')).toBeInTheDocument();
    expect(screen.getByText(/Здравствуйте! Видел ваш интерес к квартире 81/)).toHaveClass('broker-script-opener');
    expect(screen.getByText(/Предложить клиенту открыть ссылку/, { selector: '.broker-script-next-step' })).toHaveClass('broker-script-next-step');
    const digestCard = screen.getByText('Sales-room digest: квартира 81 · window_view · 5 блоков').closest('.lead-handoff-digest-card');
    expect(digestCard).toHaveClass('glass-card', 'sales-room-ready');
    expect(screen.getByText(/Клиент смотрел квартира 81 в режиме window_view/)).toHaveClass('lead-handoff-digest-recap');
    expect(screen.getByText('Digest note: квартира 81 · available · window_view · share ready · follow-up ready.', { selector: '.lead-handoff-digest-note' })).toHaveClass('lead-handoff-digest-note');
    expect(screen.getByText('Responsive HUD: desktop panel · sticky CTA · lead context visible')).toBeInTheDocument();
    const shareHandoff = screen.getByText('Share handoff: 8 этаж · квартира 81 · window_view').closest('.share-handoff-card');
    expect(shareHandoff).toHaveClass('glass-card', 'desktop-inline');
    expect(screen.getByText(/^Ссылка для клиента:/i, { selector: '.share-handoff-copy' })).toHaveClass('share-handoff-copy', 'copy-ready');
    expect(screen.getByRole('button', { name: 'Copy share link: 8 этаж · квартира 81 · window_view' })).toHaveClass('share-copy-button', 'premium-outline');

    fireEvent.click(screen.getByRole('button', { name: /оставить заявку/i }));
    expect(await screen.findByText('Заявка отправлена: #lead_123 · 8 этаж · квартира 81 · window_view')).toBeInTheDocument();
    const successCard = screen.getByText('Заявка отправлена: #lead_123 · 8 этаж · квартира 81 · window_view').closest('.lead-success-card');
    expect(successCard).toHaveClass('glass-card', 'follow-up-ready');
    expect(screen.getByText(/Менеджер получает контекст просмотра и ссылку для продолжения:/i)).toBeInTheDocument();
    expect(screen.getByText('Digest persistence: success · manager handoff ready')).toBeInTheDocument();
    expect(screen.getByText('Digest готов для менеджера', { selector: '.lead-handoff-persistence-badge' })).toHaveClass('lead-handoff-persistence-badge');
    expect(screen.getByText('CRM export payload: Estate3D Skyline · квартира 81 · window_view')).toBeInTheDocument();
    expect(screen.getByText(/CRM payload: Estate3D Skyline \| Корпус A \| 8 этаж \| квартира 81 \| window_view/i)).toHaveClass('lead-export-payload-copy');
    expect(screen.getByText('Export note: квартира 81 · window_view · share+digest+next-step ready.')).toBeInTheDocument();
    const groupedCrmFields = screen.getByText('CRM fields: Estate3D Skyline · квартира 81 · window_view · 4 группы').closest('.lead-export-fields-card');
    expect(groupedCrmFields).toHaveClass('glass-card', 'crm-field-groups', 'copy-ready');
    expect(screen.getByText('Context')).toHaveClass('lead-export-field-title');
    expect(screen.getByText('ЖК: Estate3D Skyline')).toHaveClass('lead-export-field-row');
    expect(screen.getByText('Viewer state: window_view')).toHaveClass('lead-export-field-row');
    expect(screen.getByText('Share')).toHaveClass('lead-export-field-title');
    expect(screen.getByText(/^Ссылка для клиента:/i, { selector: '.lead-export-field-row' })).toBeInTheDocument();
    expect(screen.getByText('Digest')).toHaveClass('lead-export-field-title');
    expect(screen.getByText('Digest готов для менеджера', { selector: '.lead-export-field-row' })).toHaveClass('lead-export-field-row');
    expect(screen.getByText('Next step')).toHaveClass('lead-export-field-title');
    const crmCopyAction = screen.getByText('CRM copy action: квартира 81 · window_view · 9 полей').closest('.crm-export-action-card');
    expect(crmCopyAction).toHaveClass('glass-card', 'copy-action-ready');
    expect(screen.getByText(/Context\s+- ЖК: Estate3D Skyline\s+- Корпус: Корпус A/i)).toHaveClass('crm-export-action-text', 'copy-ready');
    expect(screen.getByRole('button', { name: 'Copy CRM export block: квартира 81 · window_view' })).toHaveClass('crm-export-action-button', 'premium-outline');
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
        message: 'Покупатель смотрит Estate3D Skyline, Корпус A, 8 этаж, квартира 81 (2 комнаты, 58.7 м², от 24.8 млн ₽). Состояние viewer: window_view. Точка просмотра: Войти в гостиную. Вид из окна: Вид из окна на город. Менеджеру: клиент последовательно выбрал 8 этаж, квартиру 81, вошел в Войти в гостиную и открыл Вид из окна на город. CRM note: Lead context: Estate3D Skyline · Корпус A · 8 этаж · квартира 81 · window_view · Войти в гостиную · Вид из окна на город · follow-up for available unit. Broker script note: квартира 81 · available · window_view · follow-up ready. Digest note: квартира 81 · available · window_view · share ready · follow-up ready. Export note: квартира 81 · window_view · share+digest+next-step ready.',
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
    expect(await screen.findByText('Material theme: floor active premium-gold · #f6d77b · opacity 0.98')).toBeInTheDocument();
    expect(await screen.findByText('Scene availability: units 1 · viewpoints 0 · windows 0')).toBeInTheDocument();
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

    expect(await screen.findByText('Scene availability: units 1 · viewpoints 1 · windows 1')).toBeInTheDocument();
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
    expect(await screen.findByText('Active viewpoint: Войти в гостиную')).toBeInTheDocument();
    expect(await screen.findByText('Viewpoint anchor: Войти в гостиную · 0.33,4,0.33')).toBeInTheDocument();
    expect(await screen.findByText('Camera frame: vp_living')).toBeInTheDocument();
    expect(await screen.findByText('Camera target: 0.33,4,0.33')).toBeInTheDocument();
    expect(await screen.findByText('Camera position: 0,4.2,0')).toBeInTheDocument();
    expect(await screen.findByText('Viewpoint camera: Войти в гостиную')).toBeInTheDocument();
    expect(await screen.findByText('Camera controls: animated 650ms · target 0.33,4,0.33 · frame vp_living')).toBeInTheDocument();
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
    expect(await screen.findByText('Camera frame: window_city')).toBeInTheDocument();
    expect(await screen.findByText('Camera target: 1.2,4.5,-0.91')).toBeInTheDocument();
    expect(await screen.findByText('Camera position: -0.88,4.5,0.91')).toBeInTheDocument();
    expect(await screen.findByText('Window camera: Вид из окна на город')).toBeInTheDocument();
    expect(await screen.findByText('Camera controls: animated 650ms · target 1.2,4.5,-0.91 · frame window_city')).toBeInTheDocument();
    expect(screen.getAllByText(/Панорама из окна: Вид из окна на город/i).length).toBeGreaterThan(0);
  });

  it('shows premium sending and retry states without losing lead context or share handoff', async () => {
    window.history.pushState({}, '', '/developments/demo-premium/viewer');
    let rejectLead: (error: Error) => void = () => undefined;
    const pendingLead = new Promise((_, reject) => {
      rejectLead = reject;
    });
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => demoPayload })
      .mockReturnValueOnce(pendingLead);
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /3D floor mesh: 8 этаж/i }));
    fireEvent.click(await screen.findByRole('button', { name: /3D unit mesh: квартира 81/i }));
    fireEvent.click(await screen.findByRole('button', { name: /3D room mesh: Гостиная-кухня/i }));
    fireEvent.click(await screen.findByRole('button', { name: /3D window hotspot: Вид из окна на город/i }));
    await screen.findByText('State: window_view');

    fireEvent.click(screen.getByRole('button', { name: /оставить заявку/i }));

    const sendingButton = await screen.findByRole('button', { name: 'Отправляем заявку…' });
    expect(sendingButton).toBeDisabled();
    expect(sendingButton).toHaveClass('lead-submit-button', 'sending');
    expect(screen.getByText('Отправляем заявку менеджеру…')).toHaveClass('lead-feedback', 'sending');
    expect(screen.getByText('Lead context: Estate3D Skyline · Корпус A · 8 этаж · квартира 81 · window_view · Войти в гостиную · Вид из окна на город')).toBeInTheDocument();
    expect(screen.getByText('Interaction trail: select_floor → select_unit → enter_walk_mode → open_window_view')).toBeInTheDocument();
    expect(screen.getByText('Share handoff: 8 этаж · квартира 81 · window_view')).toBeInTheDocument();
    expect(screen.getByText('Digest persistence: sending · sales-room context locked')).toBeInTheDocument();
    expect(screen.getByText('Digest закреплен при отправке', { selector: '.lead-handoff-persistence-badge' })).toHaveClass('lead-handoff-persistence-badge');

    rejectLead(new Error('network unavailable'));

    const retryButton = await screen.findByRole('button', { name: 'Повторить отправку' });
    expect(retryButton).not.toBeDisabled();
    expect(retryButton).toHaveClass('lead-submit-button', 'retry');
    expect(screen.getByText('Не удалось отправить заявку. Попробуйте еще раз.')).toHaveClass('lead-feedback', 'error-card');
    expect(screen.getByText('Share handoff: 8 этаж · квартира 81 · window_view')).toBeInTheDocument();
    expect(screen.getByText('Digest persistence: error · retry keeps sales-room context')).toBeInTheDocument();
    expect(screen.getByText('Digest сохранен для повтора', { selector: '.lead-handoff-persistence-badge' })).toHaveClass('lead-handoff-persistence-badge');
    expect(screen.getByText('CRM fields: Estate3D Skyline · квартира 81 · window_view · 4 группы')).toBeInTheDocument();
    expect(screen.getByText('Next step')).toHaveClass('lead-export-field-title');
    expect(screen.getByText('CRM copy action: квартира 81 · window_view · 9 полей')).toBeInTheDocument();
    expect(screen.getByText(/Next step\s+- Предложить клиенту открыть ссылку/i)).toHaveClass('crm-export-action-text', 'copy-ready');
  });

  it('shows lightweight analytics readouts for premium viewer interactions and lead failures', async () => {
    window.history.pushState({}, '', '/developments/demo-premium/viewer');
    let rejectLead: (error: Error) => void = () => undefined;
    const pendingLead = new Promise((_, reject) => {
      rejectLead = reject;
    });
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => demoPayload })
      .mockReturnValueOnce(pendingLead);
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /3D floor mesh: 8 этаж/i }));
    expect(await screen.findByText('Analytics: select_floor · Estate3D Skyline · Корпус A · 8 этаж · floor_focus')).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /3D unit mesh: квартира 81/i }));
    expect(await screen.findByText('Analytics: select_unit · Estate3D Skyline · Корпус A · 8 этаж · квартира 81 · unit_top_down')).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /3D room mesh: Гостиная-кухня/i }));
    expect(await screen.findByText('Analytics: enter_walk_mode · Estate3D Skyline · Корпус A · 8 этаж · квартира 81 · walk_mode · Войти в гостиную')).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /3D window hotspot: Вид из окна на город/i }));
    expect(await screen.findByText('Analytics: open_window_view · Estate3D Skyline · Корпус A · 8 этаж · квартира 81 · window_view · Войти в гостиную · Вид из окна на город')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /оставить заявку/i }));
    expect(await screen.findByText('Analytics: lead_click · Estate3D Skyline · Корпус A · 8 этаж · квартира 81 · window_view · Войти в гостиную · Вид из окна на город')).toBeInTheDocument();

    rejectLead(new Error('network unavailable'));
    expect(await screen.findByText('Analytics: lead_error · Estate3D Skyline · Корпус A · 8 этаж · квартира 81 · window_view · Войти в гостиную · Вид из окна на город')).toBeInTheDocument();
  });

  it('syncs the shareable URL as users drill through R3F selection bridges', async () => {
    window.history.pushState({}, '', '/developments/demo-premium/viewer');
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => demoPayload });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /3D floor mesh: 8 этаж/i }));
    await screen.findByText('State: floor_focus');
    expect(window.location.search).toBe('?floor=floor_8&view=floor_focus');

    fireEvent.click(await screen.findByRole('button', { name: /3D unit mesh: квартира 81/i }));
    await screen.findByText('State: unit_top_down');
    expect(window.location.search).toBe('?floor=floor_8&unit=unit_8_1&view=unit_top_down');

    fireEvent.click(await screen.findByRole('button', { name: /3D room mesh: Гостиная-кухня/i }));
    await screen.findByText('State: walk_mode');
    expect(window.location.search).toBe('?floor=floor_8&unit=unit_8_1&view=walk_mode&viewpoint=vp_living');

    fireEvent.click(await screen.findByRole('button', { name: /3D window hotspot: Вид из окна на город/i }));
    await screen.findByText('State: window_view');
    expect(window.location.search).toBe('?floor=floor_8&unit=unit_8_1&view=window_view&viewpoint=vp_living&window=window_city');
    expect(await screen.findByText('Share link: /developments/demo-premium/viewer?floor=floor_8&unit=unit_8_1&view=window_view&viewpoint=vp_living&window=window_city')).toBeInTheDocument();
  });

  it('hydrates shareable deep-link viewer state for sales handoff links', async () => {
    window.history.pushState({}, '', '/developments/demo-premium/viewer?floor=floor_8&unit=unit_8_1&view=window_view&window=window_city');
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => demoPayload });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByText('State: window_view')).toBeInTheDocument();
    expect(await screen.findByText('Deep link: 8 этаж · квартира 81 · window_view · Вид из окна на город')).toBeInTheDocument();
    expect(await screen.findByText('Share link: /developments/demo-premium/viewer?floor=floor_8&unit=unit_8_1&view=window_view&viewpoint=vp_living&window=window_city')).toBeInTheDocument();
    expect(await screen.findByText('Camera frame: window_city')).toBeInTheDocument();
    expect(await screen.findByText('Lead context: Estate3D Skyline · Корпус A · 8 этаж · квартира 81 · window_view · Войти в гостиную · Вид из окна на город')).toBeInTheDocument();
  });

  it('shows premium empty states for floors and units without walkthrough media', async () => {
    const sparsePayload = structuredClone(demoPayload);
    sparsePayload.buildings[0].floors[7].units[0].viewpoints = [];
    sparsePayload.buildings[0].floors[7].units[0].window_views = [];
    window.history.pushState({}, '', '/developments/demo-premium/viewer');
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => sparsePayload });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /3D floor mesh: 7 этаж/i }));
    expect(await screen.findByText('Availability: empty floor · units 0 · viewpoints 0 · windows 0')).toBeInTheDocument();
    expect(await screen.findByText('На этом этаже пока нет доступных квартир — покажите другой этаж или оставьте заявку менеджеру.')).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /3D floor mesh: 8 этаж/i }));
    fireEvent.click(await screen.findByRole('button', { name: /3D unit mesh: квартира 81/i }));
    expect(await screen.findByText('Availability: no walkthrough media · units 1 · viewpoints 0 · windows 0')).toBeInTheDocument();
    expect(await screen.findByText('Для квартиры 81 пока нет точек прогулки или видов из окна — покажите планировку и соберите заявку.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /войти в гостиную/i })).not.toBeInTheDocument();
  });
});
