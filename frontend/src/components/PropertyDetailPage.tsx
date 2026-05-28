import { useState } from 'react';

import type { PropertyAnalytics, TourSummary, UploadedMedia } from '../types';
import type { PropertySummary } from '../types';
import { UploadMediaPanel } from './UploadMediaPanel';

type Props = {
  property: PropertySummary;
  media: UploadedMedia[];
  tours: TourSummary[];
  analytics?: PropertyAnalytics | null;
  onUploadMedia?: (propertyId: string, file: File) => Promise<UploadedMedia>;
  onCreateTour?: (propertyId: string, sceneUrl: string) => Promise<TourSummary>;
  onUploadComplete?: (media: UploadedMedia, tour: TourSummary) => void;
  onGenerateAiDescription?: (propertyId: string) => Promise<PropertySummary>;
};

export function PropertyDetailPage({ property, media, tours, analytics, onUploadMedia, onCreateTour, onUploadComplete, onGenerateAiDescription }: Props) {
  const [currentProperty, setCurrentProperty] = useState(property);

  async function handleGenerateAiDescription() {
    if (!onGenerateAiDescription) {
      return;
    }
    const updated = await onGenerateAiDescription(currentProperty.id);
    setCurrentProperty(updated);
  }

  return (
    <main className="layout">
      <header className="hero">
        <div>
          <p className="eyebrow">Объект недвижимости</p>
          <h1>{currentProperty.title}</h1>
          <p>
            {currentProperty.city || 'Город не указан'} · {currentProperty.area_m2 || '—'} м² · {currentProperty.property_type}
          </p>
        </div>
        <a href="/">Назад в кабинет</a>
      </header>

      <section className="grid">
        <div className="card">
          <h2>AI-описание</h2>
          {currentProperty.description_ai_short ? <p>{currentProperty.description_ai_short}</p> : <p>AI-описание еще не создано</p>}
          {currentProperty.description_ai_sales ? <p>{currentProperty.description_ai_sales}</p> : null}
          {onGenerateAiDescription ? <button onClick={handleGenerateAiDescription}>Сгенерировать AI-описание</button> : null}
        </div>

        <div className="card">
          <h2>Аналитика просмотров</h2>
          {analytics ? (
            <>
              <p>Открытий тура: {analytics.tour_opened_count}</p>
              <p>Кликов по заявке: {analytics.lead_click_count}</p>
            </>
          ) : (
            <p>Аналитика пока недоступна</p>
          )}
        </div>

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
