import { useState } from 'react';

import type { TourSummary, UploadedMedia } from '../types';

type Props = {
  propertyId: string;
  onUploadMedia: (propertyId: string, file: File) => Promise<UploadedMedia>;
  onCreateTour: (propertyId: string, sceneUrl: string) => Promise<TourSummary>;
  onComplete?: (media: UploadedMedia, tour: TourSummary) => void;
};

export function UploadMediaPanel({ propertyId, onUploadMedia, onCreateTour, onComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');

  async function handleUpload() {
    if (!file) {
      setStatus('Выберите GLB/LiDAR файл');
      return;
    }
    setStatus('Загружаем файл...');
    const media = await onUploadMedia(propertyId, file);
    const sceneUrl = `/storage/${media.storage_path}`;
    const tour = await onCreateTour(propertyId, sceneUrl);
    onComplete?.(media, tour);
    setStatus('Тур создан');
  }

  return (
    <section className="upload-panel">
      <label>
        GLB/LiDAR файл
        <input
          type="file"
          accept=".glb,.gltf,.obj,.ply,.usdz,model/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <button type="button" onClick={handleUpload}>
        Загрузить и создать тур
      </button>
      {status && <p>{status}</p>}
    </section>
  );
}
