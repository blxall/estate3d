import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '../App';

const fetchMock = vi.fn();

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  fetchMock.mockReset();
  window.history.pushState({}, '', '/');
});

describe('public tour route', () => {
  it('renders GLB viewer for /tour/:slug from backend payload', async () => {
    window.history.pushState({}, '', '/tour/api-slug');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        property: {
          id: 'prop_1',
          title: 'Публичный API тур',
          property_type: 'apartment',
          status: 'ready',
          public_slug: 'api-slug',
          is_public: true,
        },
        tour: {
          id: 'tour_1',
          property_id: 'prop_1',
          tour_type: 'glb_model',
          scene_url: '/storage/properties/prop_1/scene.glb',
          public_url: '/tour/api-slug',
        },
        viewer_config: { tour_type: 'glb_model', scene_url: '/storage/properties/prop_1/scene.glb' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByText('Публичный API тур')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /3d viewer/i })).toHaveAttribute('data-viewer-engine', 'playcanvas');
    expect(screen.getByText('GLB scene · PlayCanvas runtime')).toBeInTheDocument();
    expect(screen.getByText('/storage/properties/prop_1/scene.glb')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/tour/api-slug'));
  });

  it('keeps R3F available as an explicit public tour fallback query flag', async () => {
    window.history.pushState({}, '', '/tour/api-slug?engine=r3f');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        property: {
          id: 'prop_1',
          title: 'Публичный API тур',
          property_type: 'apartment',
          status: 'ready',
          public_slug: 'api-slug',
          is_public: true,
        },
        tour: {
          id: 'tour_1',
          property_id: 'prop_1',
          tour_type: 'glb_model',
          scene_url: '/storage/properties/prop_1/scene.glb',
          public_url: '/tour/api-slug',
        },
        viewer_config: { tour_type: 'glb_model', scene_url: '/storage/properties/prop_1/scene.glb' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByText('Публичный API тур')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /3d viewer/i })).toHaveAttribute('data-viewer-engine', 'r3f');
    expect(screen.getByText('GLB scene · Orbit controls')).toBeInTheDocument();
    expect(await screen.findByText('Renderer: Three.js/R3F · explicit fallback · GLB-first')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/tour/api-slug'));
  });
});
