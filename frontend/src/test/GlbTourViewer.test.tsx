import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GlbTourViewer } from '../components/GlbTourViewer';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('GlbTourViewer', () => {
  it('renders viewer shell controls with PlayCanvas as the GLB default', () => {
    render(<GlbTourViewer fallbackUrl="/tour/api-slug?engine=r3f" sceneUrl="/storage/properties/prop_1/scene.glb" title="Шоурум" />);

    expect(screen.getByRole('region', { name: /3d viewer/i })).toHaveAttribute('data-viewer-engine', 'playcanvas');
    expect(screen.getByText('Шоурум')).toBeInTheDocument();
    expect(screen.getByText('GLB scene · PlayCanvas runtime')).toBeInTheDocument();
    expect(screen.getByRole('note', { name: /playcanvas rollout guardrails/i })).toHaveClass('visually-hidden');
    expect(screen.getByRole('note', { name: /playcanvas rollout guardrails/i })).toHaveTextContent(
      'Fallback renderer: add ?engine=r3f if PlayCanvas fails on this device',
    );
    expect(
      screen.getByText('accepted warnings: playcanvas-lazy-chunk-over-700kb, vite-node-worker-threads-externalized-for-gsplat-workers'),
    ).toBeInTheDocument();
    expect(screen.getByRole('status', { name: /playcanvas interaction controls/i })).toHaveTextContent(
      'Вращайте модель перетаскиванием · масштабируйте колесом · откройте на весь экран',
    );
    expect(screen.getByRole('status', { name: /playcanvas interaction controls/i })).toHaveTextContent(
      'Интерактивный 3D-просмотр готов для публичного тура',
    );
    expect(screen.getByRole('link', { name: /открыть glb/i })).toHaveAttribute('href', '/storage/properties/prop_1/scene.glb');
    expect(screen.getByRole('link', { name: /open fallback renderer/i })).toHaveAttribute(
      'href',
      '/tour/api-slug?engine=r3f',
    );
    expect(screen.getByText(/модель не открылась/i)).toHaveTextContent(
      'Модель не открылась? Перейти в резервный просмотр',
    );
    expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument();
    expect(screen.getByText('/storage/properties/prop_1/scene.glb')).toHaveClass('visually-hidden');
  });

  it('requests fullscreen from the viewer canvas area', () => {
    const requestFullscreen = vi.fn();
    render(<GlbTourViewer sceneUrl="/storage/properties/prop_1/scene.glb" title="Шоурум" />);
    Object.defineProperty(screen.getByTestId('viewer-canvas-root'), 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    });

    fireEvent.click(screen.getByRole('button', { name: /fullscreen/i }));

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it('can opt into the R3F fallback without changing the public tour shell', async () => {
    render(<GlbTourViewer engine="r3f" fallbackUrl="/tour/api-slug?engine=r3f" sceneUrl="/storage/properties/prop_1/scene.glb" title="Шоурум" />);

    expect(screen.getByRole('region', { name: /3d viewer/i })).toHaveAttribute('data-viewer-engine', 'r3f');
    expect(screen.getByText('GLB scene · Orbit controls')).toBeInTheDocument();
    expect(await screen.findByText('Renderer: Three.js/R3F · explicit fallback · GLB-first')).toHaveClass('visually-hidden');
    expect(screen.queryByRole('note', { name: /playcanvas spike validation/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /open fallback renderer/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /открыть glb/i })).toHaveAttribute('href', '/storage/properties/prop_1/scene.glb');
  });
});
