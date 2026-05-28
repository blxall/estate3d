import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '../App';

const fetchMock = vi.fn();

afterEach(() => {
  vi.restoreAllMocks();
  fetchMock.mockReset();
  window.history.pushState({}, '', '/');
});

describe('property detail upload workflow', () => {
  it('uploads a GLB from property detail page and appends created media and tour', async () => {
    window.history.pushState({}, '', '/properties/prop_1');
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'prop_1',
          title: 'Объект для upload',
          property_type: 'apartment',
          city: 'Москва',
          area_m2: '77',
          status: 'draft',
          public_slug: 'upload-slug',
          is_public: false,
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ property_id: 'prop_1', tour_opened_count: 0, lead_click_count: 0, last_event_at: null }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'media_new',
          property_id: 'prop_1',
          file_type: 'model',
          original_filename: 'fresh-scene.glb',
          storage_path: 'properties/prop_1/fresh-scene.glb',
          mime_type: 'model/gltf-binary',
          size_bytes: 2048,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'tour_new',
          property_id: 'prop_1',
          tour_type: 'glb_model',
          scene_url: '/storage/properties/prop_1/fresh-scene.glb',
          public_url: '/tour/upload-slug',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByRole('heading', { name: /Объект для upload/i })).toBeInTheDocument();
    const file = new File(['glb'], 'fresh-scene.glb', { type: 'model/gltf-binary' });
    fireEvent.change(screen.getByLabelText(/GLB\/LiDAR файл/i), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /загрузить и создать тур/i }));

    expect(await screen.findByText('fresh-scene.glb')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /открыть публичный тур/i })).toHaveAttribute('href', '/tour/upload-slug');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/properties/prop_1/media', expect.objectContaining({ method: 'POST' })));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/properties/prop_1/tours', expect.objectContaining({ method: 'POST' })));
  });
});
