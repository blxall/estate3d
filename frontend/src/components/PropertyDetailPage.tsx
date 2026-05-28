import type { TourSummary, UploadedMedia } from '../types';
import type { PropertySummary } from '../types';
import { UploadMediaPanel } from './UploadMediaPanel';

type Props = {
  property: PropertySummary;
  media: UploadedMedia[];
  tours: TourSummary[];
  onUploadMedia?: (propertyId: string, file: File) => Promise<UploadedMedia>;
  onCreateTour?: (propertyId: string, sceneUrl: string) => Promise<TourSummary>;
  onUploadComplete?: (media: UploadedMedia, tour: TourSummary) => void;
};

export function PropertyDetailPage({ property, media, tours, onUploadMedia, onCreateTour, onUploadComplete }: Props) {
  return (
    <main className="layout">
      <header className="hero">
        <div>
          <p className="eyebrow">Объект недвижимости</p>
          <h1>{property.title}</h1>
          <p>
            {property.city || 'Город не указан'} · {property.area_m2 || '—'} м² · {property.property_type}
          </p>
        </div>
        <a href="/">Назад в кабинет</a>
      </header>

      <section className="grid">
        <div className="card">
          <h2>Загрузить LiDAR/GLB</h2>
          {onUploadMedia && onCreateTour ? (
            <UploadMediaPanel
              propertyId={property.id}
              onUploadMedia={onUploadMedia}
              onCreateTour={onCreateTour}
              onComplete={onUploadComplete}
            />
          ) : (
            <p>Загрузка недоступна</p>
          )}
        </div>

        <div className="card">
          <h2>Загруженные файлы</h2>
          {media.length === 0 ? (
            <p>Файлов пока нет</p>
          ) : (
            <div className="property-list">
              {media.map((item) => (
                <article className="property-row" key={item.id}>
                  <div>
                    <h3>{item.original_filename}</h3>
                    <p>
                      {item.file_type} · {Math.round(item.size_bytes / 1024)} KB
                    </p>
                  </div>
                  <a href={`/storage/${item.storage_path}`}>Открыть файл</a>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2>Туры</h2>
          {tours.length === 0 ? (
            <p>Туры пока не созданы</p>
          ) : (
            <div className="property-list">
              {tours.map((tour) => (
                <article className="property-row" key={tour.id}>
                  <div>
                    <h3>{tour.tour_type}</h3>
                    <p>{tour.scene_url}</p>
                  </div>
                  <a href={tour.public_url}>Открыть публичный тур</a>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
