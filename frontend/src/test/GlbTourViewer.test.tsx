import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GlbTourViewer } from '../components/GlbTourViewer';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('GlbTourViewer', () => {
  it('renders viewer shell controls while the heavy Three.js scene is lazy-loaded', () => {
    render(<GlbTourViewer sceneUrl="/storage/properties/prop_1/scene.glb" title="Шоурум" />);

    expect(screen.getByRole('region', { name: /3d viewer/i })).toBeInTheDocument();
    expect(screen.getByText('Шоурум')).toBeInTheDocument();
    expect(screen.getByText(/orbit controls/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /открыть glb/i })).toHaveAttribute('href', '/storage/properties/prop_1/scene.glb');
    expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument();
    expect(screen.getByText('/storage/properties/prop_1/scene.glb')).toBeInTheDocument();
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

  it('can opt into the PlayCanvas runtime without changing the public tour shell', async () => {
    render(<GlbTourViewer engine="playcanvas" sceneUrl="/storage/properties/prop_1/scene.glb" title="Шоурум" />);

    expect(screen.getByRole('region', { name: /3d viewer/i })).toHaveAttribute('data-viewer-engine', 'playcanvas');
    expect(screen.getByText('GLB scene · PlayCanvas runtime')).toBeInTheDocument();
    expect(await screen.findByText('Renderer: PlayCanvas · WebGL/WebGPU-ready · GLB-first')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /открыть glb/i })).toHaveAttribute('href', '/storage/properties/prop_1/scene.glb');
  });
});
