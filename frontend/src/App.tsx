import { useEffect, useState } from 'react';

import { createProperty, createTour, fetchMe, fetchProperties, fetchProperty, fetchPropertyAnalytics, fetchPropertyMedia, fetchPropertyTours, fetchPublicTour, generateAiDescription, login, register, uploadPropertyMedia } from './api';
import { AuthPanel } from './components/AuthPanel';
import { GlbTourViewer } from './components/GlbTourViewer';
import { PropertyDashboard } from './components/PropertyDashboard';
import { PropertyDetailPage } from './components/PropertyDetailPage';
import type { AuthPayload, AuthResponse, PropertyAnalytics, PropertyCreatePayload, PropertySummary, PublicTourPayload, TourSummary, UploadedMedia, UserAccount } from './types';

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

function readStoredToken(): string | null {
  if (typeof window.localStorage?.getItem !== 'function') {
    return null;
  }
  return window.localStorage.getItem('estate3d_token');
}

function writeStoredToken(token: string) {
  if (typeof window.localStorage?.setItem === 'function') {
    window.localStorage.setItem('estate3d_token', token);
  }
}

function clearStoredToken() {
  if (typeof window.localStorage?.removeItem === 'function') {
    window.localStorage.removeItem('estate3d_token');
  }
}

export function App() {
  const tourSlug = currentTourSlug();
  const propertyId = currentPropertyId();
  const [properties, setProperties] = useState<PropertySummary[]>(demoProperties);
  const [publicTour, setPublicTour] = useState<PublicTourPayload | null>(null);
  const [propertyDetail, setPropertyDetail] = useState<PropertySummary | null>(null);
  const [propertyMedia, setPropertyMedia] = useState<UploadedMedia[]>([]);
  const [propertyTours, setPropertyTours] = useState<TourSummary[]>([]);
  const [propertyAnalytics, setPropertyAnalytics] = useState<PropertyAnalytics | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    const token = readStoredToken();
    if (!token) {
      return;
    }
    let cancelled = false;
    fetchMe(token)
      .then((user) => {
        if (!cancelled) {
          setCurrentUser(user);
        }
      })
      .catch(() => clearStoredToken());
    return () => {
      cancelled = true;
    };
  }, []);

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
    Promise.all([fetchProperty(propertyId), fetchPropertyMedia(propertyId), fetchPropertyTours(propertyId), fetchPropertyAnalytics(propertyId)]).then(
      ([property, media, tours, analytics]) => {
        if (!cancelled) {
          setPropertyDetail(property);
          setPropertyMedia(media);
          setPropertyTours(tours);
          setPropertyAnalytics(analytics);
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

  async function handleRegister(payload: AuthPayload): Promise<AuthResponse> {
    const response = await register(payload);
    writeStoredToken(response.access_token);
    setCurrentUser(response.user);
    return response;
  }

  async function handleLogin(payload: AuthPayload): Promise<AuthResponse> {
    const response = await login(payload);
    writeStoredToken(response.access_token);
    setCurrentUser(response.user);
    return response;
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
        analytics={propertyAnalytics}
        onUploadMedia={uploadPropertyMedia}
        onCreateTour={createTour}
        onUploadComplete={handlePropertyUploadComplete}
        onGenerateAiDescription={generateAiDescription}
      />
    );
  }

  return (
    <>
      <AuthPanel currentUser={currentUser} onRegister={handleRegister} onLogin={handleLogin} />
      <PropertyDashboard
        properties={properties}
        onCreateProperty={handleCreateProperty}
        onUploadMedia={uploadPropertyMedia}
        onCreateTour={createTour}
      />
    </>
  );
}
