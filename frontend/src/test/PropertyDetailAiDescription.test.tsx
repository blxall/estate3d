import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PropertyDetailPage } from '../components/PropertyDetailPage';
import type { PropertySummary } from '../types';

const property: PropertySummary = {
  id: 'prop_1',
  title: 'Светлая квартира',
  property_type: 'apartment',
  city: 'Москва',
  area_m2: '54.5',
  status: 'ready',
  public_slug: 'slug',
  is_public: true,
  description_ai_short: '',
  description_ai_sales: '',
};

describe('PropertyDetailPage AI description', () => {
  it('generates and displays AI descriptions for the object', async () => {
    const onGenerateAiDescription = vi.fn().mockResolvedValue({
      ...property,
      description_ai_short: '2-комн. квартира рядом с парком.',
      description_ai_sales: 'Светлая квартира с готовым 3D-туром для дистанционного просмотра.',
    });

    render(
      <PropertyDetailPage
        property={property}
        media={[]}
        tours={[]}
        onGenerateAiDescription={onGenerateAiDescription}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать AI-описание' }));

    expect(onGenerateAiDescription).toHaveBeenCalledWith('prop_1');
    expect(await screen.findByText('2-комн. квартира рядом с парком.')).toBeInTheDocument();
    expect(screen.getByText('Светлая квартира с готовым 3D-туром для дистанционного просмотра.')).toBeInTheDocument();
  });
});
