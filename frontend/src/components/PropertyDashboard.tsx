import type { PropertyCreatePayload, PropertySummary, UploadedMedia } from '../types';
import { CreatePropertyForm } from './CreatePropertyForm';
import { UploadMediaPanel } from './UploadMediaPanel';

type Props = {
  properties: PropertySummary[];
  onCreateProperty?: (payload: PropertyCreatePayload) => void;
  onUploadMedia?: (propertyId: string, file: File) => Promise<UploadedMedia>;
  onCreateTour?: (propertyId: string, sceneUrl: string) => Promise<unknown>;
};

export function PropertyDashboard({
  properties,
  onCreateProperty = () => undefined,
  onUploadMedia,
  onCreateTour,
}: Props) {
  return (
    <main className="layout">
      <header className="hero">
        <div>
          <p className="eyebrow">Hybrid LiDAR / non-LiDAR real estate tours</p>
          <h1>Estate3D</h1>
          <p>Загружаем LiDAR/GLB, видео или фото объекта и выдаем публичный 3D-тур.</p>
        </div>
        <button type="button">Создать объект</button>
      </header>

      <section className="grid">
        <CreatePropertyForm onSubmit={onCreateProperty} />

        <div className="stack">
          {onUploadMedia && onCreateTour && properties[0] ? (
            <div className="card">
              <h2>Загрузка LiDAR/GLB</h2>
              <p>Выберите первый объект в списке: {properties[0].title}</p>
              <UploadMediaPanel
                propertyId={properties[0].id}
                onUploadMedia={onUploadMedia}
                onCreateTour={onCreateTour}
              />
            </div>
          ) : null}

          <div className="card">
            <h2>Объекты</h2>
            <div className="property-list">
              {properties.map((property) => (
                <article className="property-row" key={property.id}>
                  <div>
                    <h3>{property.title}</h3>
                    <p>
                      {property.city || 'Город не указан'} · {property.area_m2 || '—'} м² · {property.property_type}
                    </p>
                  </div>
                  <div className="property-actions">
                    <span className={`status status-${property.status}`}>{property.status}</span>
                    <a href={`/properties/${property.id}`}>Открыть объект</a>
                    {property.is_public ? (
                      <a href={`/tour/${property.public_slug}`}>Открыть тур</a>
                    ) : (
                      <span>Тур приватный</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
