import { afterEach, describe, expect, it, vi } from 'vitest';

import { createProperty, createTour, fetchProperties, fetchPublicTour, uploadPropertyMedia } from '../api';

const fetchMock = vi.fn();

afterEach(() => {
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

describe('Estate3D API client', () => {
  it('fetches properties from backend list endpoint', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [{ id: 'prop_1', title: 'Объект', property_type: 'apartment', status: 'draft', public_slug: 'slug', is_public: false }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchProperties();

    expect(fetchMock).toHaveBeenCalledWith('/api/properties');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Объект');
  });

  it('creates property with MVP payload', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'prop_1', title: 'Новый', property_type: 'apartment', status: 'draft', public_slug: 'slug', is_public: false }) });
    vi.stubGlobal('fetch', fetchMock);

    const result = await createProperty({ title: 'Новый', property_type: 'apartment', city: 'Москва', area_m2: '55' });

    expect(fetchMock).toHaveBeenCalledWith('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Новый', property_type: 'apartment', city: 'Москва', area_m2: '55' }),
    });
    expect(result.id).toBe('prop_1');
  });

  it('uploads media using FormData', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'media_1', file_type: 'model' }) });
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['glb'], 'scene.glb', { type: 'model/gltf-binary' });

    await uploadPropertyMedia('prop_1', file);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/properties/prop_1/media');
    expect(options.method).toBe('POST');
    expect(options.body).toBeInstanceOf(FormData);
  });

  it('creates GLB public tour', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'tour_1', public_url: '/tour/slug' }) });
    vi.stubGlobal('fetch', fetchMock);

    await createTour('prop_1', '/storage/properties/prop_1/scene.glb');

    expect(fetchMock).toHaveBeenCalledWith('/api/properties/prop_1/tours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tour_type: 'glb_model', scene_url: '/storage/properties/prop_1/scene.glb', preview_url: '' }),
    });
  });

  it('fetches public tour by slug', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ property: { title: 'Демо' }, tour: { scene_url: '/scene.glb' }, viewer_config: { tour_type: 'glb_model', scene_url: '/scene.glb' } }) });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchPublicTour('slug');

    expect(fetchMock).toHaveBeenCalledWith('/api/tour/slug');
    expect(result.viewer_config.scene_url).toBe('/scene.glb');
  });
});
