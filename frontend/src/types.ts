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
};

export type PropertyCreatePayload = {
  title: string;
  property_type: string;
  city: string;
  area_m2: string;
};

export type PublicTourPayload = {
  property: PropertySummary;
  tour: {
    id: string;
    property_id: string;
    tour_type: 'glb_model' | 'gaussian_splat' | 'panorama' | 'gallery';
    scene_url: string;
    preview_url?: string;
    public_url: string;
  };
  viewer_config: {
    tour_type: string;
    scene_url: string;
  };
};
