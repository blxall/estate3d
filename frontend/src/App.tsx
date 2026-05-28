import { useEffect, useState } from 'react';

import { createProperty, createTour, fetchProperties, fetchPublicTour, uploadPropertyMedia } from './api';
import { GlbTourViewer } from './components/GlbTourViewer';
import { PropertyDashboard } from './components/PropertyDashboard';
import type { PropertyCreatePayload, PropertySummary, PublicTourPayload } from './types';

const demoProperties: PropertySummary[] = [
  {
    id: 'prop_demo_lidar',
    title: 'Демо LiDAR шоурум',
    property_type: 'apartment',
    city: 'Москва',
    area_m2: '68.4',
    price: '22000000',
    status: 'ready',
    public_slug: 'demo-lidar',
    is_public: true,
  },
];

function currentTourSlug(): string | null {
  const match = window.location.pathname.match(/^\/tour\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function App() {
  const tourSlug = currentTourSlug();
  const [properties, setProperties] = useState<PropertySummary[]>(demoProperties);
  const [publicTour, setPublicTour] = useState<PublicTourPayload | null>(null);

  useEffect(() => {
    if (!tourSlug) {
      return;
    }
    let cancelled = false;
    fetchPublicTour(tourSlug).then((payload) => {
      if (!cancelled) {
        setPublicTour(payload);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tourSlug]);

  useEffect(() => {
    if (tourSlug) {
      return;
    }
    let cancelled = false;
    fetchProperties()
      .then((items) => {
        if (!cancelled) {
          setProperties(items.length > 0 ? items : demoProperties);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProperties(demoProperties);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tourSlug]);

  async function handleCreateProperty(payload: PropertyCreatePayload) {
    const created = await createProperty(payload);
    setProperties((current) => [created, ...current]);
  }

  if (tourSlug) {
    if (!publicTour) {
      return <main className="layout">Загружаем тур...</main>;
    }
    return <GlbTourViewer sceneUrl={publicTour.viewer_config.scene_url} title={publicTour.property.title} />;
  }

  return (
    <PropertyDashboard
      properties={properties}
      onCreateProperty={handleCreateProperty}
      onUploadMedia={uploadPropertyMedia}
      onCreateTour={createTour}
    />
  );
}
