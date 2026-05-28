import { useEffect, useState } from 'react';

import { createProperty, createTour, fetchProperties, fetchProperty, fetchPropertyMedia, fetchPropertyTours, fetchPublicTour, uploadPropertyMedia } from './api';
import { GlbTourViewer } from './components/GlbTourViewer';
import { PropertyDashboard } from './components/PropertyDashboard';
import { PropertyDetailPage } from './components/PropertyDetailPage';
import type { PropertyCreatePayload, PropertySummary, PublicTourPayload, TourSummary, UploadedMedia } from './types';

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

function currentPropertyId(): string | null {
  const match = window.location.pathname.match(/^\/properties\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function App() {
  const tourSlug = currentTourSlug();
  const propertyId = currentPropertyId();
  const [properties, setProperties] = useState<PropertySummary[]>(demoProperties);
  const [publicTour, setPublicTour] = useState<PublicTourPayload | null>(null);
  const [propertyDetail, setPropertyDetail] = useState<PropertySummary | null>(null);
  const [propertyMedia, setPropertyMedia] = useState<UploadedMedia[]>([]);
  const [propertyTours, setPropertyTours] = useState<TourSummary[]>([]);

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
    if (!propertyId) {
      return;
    }
    let cancelled = false;
    Promise.all([fetchProperty(propertyId), fetchPropertyMedia(propertyId), fetchPropertyTours(propertyId)]).then(
      ([property, media, tours]) => {
        if (!cancelled) {
          setPropertyDetail(property);
          setPropertyMedia(media);
          setPropertyTours(tours);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  useEffect(() => {
    if (tourSlug || propertyId) {
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

  function handlePropertyUploadComplete(media: UploadedMedia, tour: TourSummary) {
    setPropertyMedia((current) => [media, ...current]);
    setPropertyTours((current) => [tour, ...current]);
  }

  if (tourSlug) {
    if (!publicTour) {
      return <main className="layout">Загружаем тур...</main>;
    }
    return <GlbTourViewer sceneUrl={publicTour.viewer_config.scene_url} title={publicTour.property.title} />;
  }

  if (propertyId) {
    if (!propertyDetail) {
      return <main className="layout">Загружаем объект...</main>;
    }
    return (
      <PropertyDetailPage
        property={propertyDetail}
        media={propertyMedia}
        tours={propertyTours}
        onUploadMedia={uploadPropertyMedia}
        onCreateTour={createTour}
        onUploadComplete={handlePropertyUploadComplete}
      />
    );
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
