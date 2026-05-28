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
