import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '../App';

const fetchMock = vi.fn();

afterEach(() => {
  vi.restoreAllMocks();
  fetchMock.mockReset();
  window.history.pushState({}, '', '/');
});

describe('property detail route', () => {
  it('renders property detail with media and tours for /properties/:id', async () => {
    window.history.pushState({}, '', '/properties/prop_1');
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'prop_1',
          title: 'Детальная квартира',
          property_type: 'apartment',
          city: 'Москва',
          area_m2: '77',
          status: 'ready',
          public_slug: 'detail-slug',
          is_public: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{ id: 'media_1', property_id: 'prop_1', file_type: 'model', original_filename: 'scene.glb', storage_path: 'properties/prop_1/scene.glb', mime_type: 'model/gltf-binary', size_bytes: 123 }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{ id: 'tour_1', property_id: 'prop_1', tour_type: 'glb_model', scene_url: '/storage/properties/prop_1/scene.glb', public_url: '/tour/detail-slug' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ property_id: 'prop_1', tour_opened_count: 2, lead_click_count: 0, last_event_at: '2026-05-28T10:00:00Z' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByRole('heading', { name: /Детальная квартира/i })).toBeInTheDocument();
    expect(screen.getByText('scene.glb')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /открыть публичный тур/i })).toHaveAttribute('href', '/tour/detail-slug');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/properties/prop_1/tours'));
  });
});
