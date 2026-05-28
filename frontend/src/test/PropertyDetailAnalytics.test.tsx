import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PropertyDetailPage } from '../components/PropertyDetailPage';
import type { PropertyAnalytics, PropertySummary } from '../types';

const property: PropertySummary = {
  id: 'prop_1',
  title: 'Квартира с аналитикой',
  property_type: 'apartment',
  city: 'Москва',
  area_m2: '54.5',
  status: 'ready',
  public_slug: 'slug',
  is_public: true,
};

const analytics: PropertyAnalytics = {
  property_id: 'prop_1',
  tour_opened_count: 7,
  lead_click_count: 2,
  last_event_at: '2026-05-28T10:00:00Z',
};

describe('PropertyDetailPage analytics', () => {
  it('shows simple public tour analytics counters', () => {
    render(<PropertyDetailPage property={property} media={[]} tours={[]} analytics={analytics} />);

    expect(screen.getByText('Аналитика просмотров')).toBeInTheDocument();
    expect(screen.getByText('Открытий тура: 7')).toBeInTheDocument();
    expect(screen.getByText('Кликов по заявке: 2')).toBeInTheDocument();
  });
});
