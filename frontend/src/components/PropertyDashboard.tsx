import type { PropertyCreatePayload, PropertySummary } from '../types';
import { CreatePropertyForm } from './CreatePropertyForm';

type Props = {
  properties: PropertySummary[];
  onCreateProperty?: (payload: PropertyCreatePayload) => void;
};

export function PropertyDashboard({ properties, onCreateProperty = () => undefined }: Props) {
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
      </section>
    </main>
  );
}
