import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GlbTourViewer } from '../components/GlbTourViewer';

describe('GlbTourViewer', () => {
  it('renders a 3D viewer shell for a GLB scene URL', () => {
    render(<GlbTourViewer sceneUrl="/storage/properties/prop_1/scene.glb" title="Шоурум" />);

    expect(screen.getByRole('region', { name: /3d viewer/i })).toBeInTheDocument();
    expect(screen.getByText('Шоурум')).toBeInTheDocument();
    expect(screen.getByTestId('glb-canvas')).toBeInTheDocument();
    expect(screen.getByText('/storage/properties/prop_1/scene.glb')).toBeInTheDocument();
  });
});
