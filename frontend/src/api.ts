import type { AuthPayload, AuthResponse, PropertyAnalytics, PropertyCreatePayload, PropertySummary, PublicTourPayload, TourSummary, UploadedMedia, UserAccount } from './types';

const API_BASE = '/api';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = init === undefined ? await fetch(url) : await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Estate3D API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchProperties(): Promise<PropertySummary[]> {
  const response = await requestJson<{ items: PropertySummary[] }>(`${API_BASE}/properties`);
  return response.items;
}

export async function register(payload: AuthPayload): Promise<AuthResponse> {
  return requestJson<AuthResponse>(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function login(payload: AuthPayload): Promise<AuthResponse> {
  return requestJson<AuthResponse>(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function fetchMe(accessToken: string): Promise<UserAccount> {
  return requestJson<UserAccount>(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
}

export async function fetchProperty(propertyId: string): Promise<PropertySummary> {
  return requestJson<PropertySummary>(`${API_BASE}/properties/${propertyId}`);
}

export async function fetchPropertyMedia(propertyId: string): Promise<UploadedMedia[]> {
  const response = await requestJson<{ items: UploadedMedia[] }>(`${API_BASE}/properties/${propertyId}/media`);
  return response.items;
}

export async function fetchPropertyTours(propertyId: string): Promise<TourSummary[]> {
  const response = await requestJson<{ items: TourSummary[] }>(`${API_BASE}/properties/${propertyId}/tours`);
  return response.items;
}

export async function fetchPropertyAnalytics(propertyId: string): Promise<PropertyAnalytics> {
  return requestJson<PropertyAnalytics>(`${API_BASE}/properties/${propertyId}/analytics`);
}

export async function createProperty(payload: PropertyCreatePayload): Promise<PropertySummary> {
  return requestJson<PropertySummary>(`${API_BASE}/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function uploadPropertyMedia(propertyId: string, file: File): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append('file', file);
  return requestJson<UploadedMedia>(`${API_BASE}/properties/${propertyId}/media`, {
    method: 'POST',
    body: formData,
  });
}

export async function createTour(propertyId: string, sceneUrl: string): Promise<TourSummary> {
  return requestJson<TourSummary>(`${API_BASE}/properties/${propertyId}/tours`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tour_type: 'glb_model', scene_url: sceneUrl, preview_url: '' }),
  });
}

export async function generateAiDescription(propertyId: string): Promise<PropertySummary> {
  return requestJson<PropertySummary>(`${API_BASE}/properties/${propertyId}/ai-description`, { method: 'POST' });
}

export async function fetchPublicTour(slug: string): Promise<PublicTourPayload> {
  return requestJson<PublicTourPayload>(`${API_BASE}/tour/${slug}`);
}
