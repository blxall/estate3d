export type PropertySummary = {
  id: string;
  title: string;
  property_type: string;
  city?: string;
  area_m2?: string;
  price?: string;
  status: string;
  public_slug: string;
  is_public: boolean;
  description_ai_short?: string;
  description_ai_sales?: string;
};

export type PropertyCreatePayload = {
  title: string;
  property_type: string;
  city: string;
  area_m2: string;
};

export type UploadedMedia = {
  id: string;
  property_id: string;
  file_type: string;
  original_filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
};

export type TourSummary = {
  id: string;
  property_id: string;
  tour_type: 'glb_model' | 'gaussian_splat' | 'panorama' | 'gallery';
  scene_url: string;
  preview_url?: string;
  public_url: string;
};

export type PublicTourPayload = {
  property: PropertySummary;
  tour: TourSummary;
  viewer_config: {
    tour_type: string;
    scene_url: string;
  };
};

export type PropertyAnalytics = {
  property_id: string;
  tour_opened_count: number;
  lead_click_count: number;
  last_event_at: string | null;
};

export type UserAccount = {
  id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  phone?: string;
  role?: string;
};

export type AuthPayload = {
  email: string;
  password: string;
  full_name?: string;
  company_name?: string;
  phone?: string;
};

export type AuthResponse = {
  user: UserAccount;
  access_token: string;
  token_type: 'bearer';
};

export type ViewerPoint = { x: number; y: number; z: number };

export type DevelopmentWindowView = {
  id: string;
  room_id: string;
  label: string;
  image_url: string;
  direction_degrees: number;
};

export type DevelopmentViewpoint = {
  id: string;
  room_id: string;
  label: string;
  mode: string;
  position: ViewerPoint;
  target: ViewerPoint;
};

export type DevelopmentRoom = {
  id: string;
  name: string;
  area_m2: number;
  polygon: ViewerPoint[];
};

export type DevelopmentUnit = {
  id: string;
  number: string;
  area_m2: number;
  rooms_count: number;
  price: string;
  status: string;
  plan_polygon: ViewerPoint[];
  rooms: DevelopmentRoom[];
  viewpoints: DevelopmentViewpoint[];
  window_views: DevelopmentWindowView[];
};

export type DevelopmentFloor = {
  id: string;
  level: number;
  label: string;
  elevation: number;
  units: DevelopmentUnit[];
};

export type DevelopmentBuilding = {
  id: string;
  name: string;
  floors_count: number;
  model: Record<string, unknown>;
  floors: DevelopmentFloor[];
};

export type DevelopmentViewerPayload = {
  id: string;
  name: string;
  city: string;
  hero: { tagline: string; headline: string; lead: string };
  viewer_config: Record<string, unknown>;
  buildings: DevelopmentBuilding[];
};

export type DevelopmentLeadPayload = {
  building_id: string;
  floor_id: string;
  unit_id: string;
  viewer_state: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  message: string;
};

export type DevelopmentLead = DevelopmentLeadPayload & {
  id: string;
  development_id: string;
  development_name: string;
  unit_number: string;
  status: string;
  created_at: string;
};
