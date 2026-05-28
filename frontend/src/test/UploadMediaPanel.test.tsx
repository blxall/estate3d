import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UploadMediaPanel } from '../components/UploadMediaPanel';

const file = new File(['glb'], 'scene.glb', { type: 'model/gltf-binary' });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UploadMediaPanel', () => {
  it('uploads GLB media and creates public tour from uploaded storage path', async () => {
    const onUploadMedia = vi.fn().mockResolvedValue({ storage_path: 'properties/prop_1/scene.glb' });
    const onCreateTour = vi.fn().mockResolvedValue({ public_url: '/tour/slug' });

    render(<UploadMediaPanel propertyId="prop_1" onUploadMedia={onUploadMedia} onCreateTour={onCreateTour} />);

    fireEvent.change(screen.getByLabelText(/glb\/lidar/i), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /загрузить и создать тур/i }));

    await waitFor(() => expect(onUploadMedia).toHaveBeenCalledWith('prop_1', file));
    expect(onCreateTour).toHaveBeenCalledWith('prop_1', '/storage/properties/prop_1/scene.glb');
    expect(await screen.findByText(/тур создан/i)).toBeInTheDocument();
  });
});
