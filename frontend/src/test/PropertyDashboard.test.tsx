import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PropertyDashboard } from '../components/PropertyDashboard';

const properties = [
  {
    id: 'prop_1',
    title: 'Шоурум ЖК Север',
    property_type: 'apartment',
    city: 'Москва',
    area_m2: '68.4',
    price: '22000000',
    status: 'ready',
    public_slug: 'abc123',
    is_public: true,
  },
];

describe('PropertyDashboard', () => {
  it('shows MVP shell with property list and create action', () => {
    render(<PropertyDashboard properties={properties} />);

    expect(screen.getByRole('heading', { name: /Estate3D/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /создать объект/i })).toBeInTheDocument();
    expect(screen.getByText('Шоурум ЖК Север')).toBeInTheDocument();
    expect(screen.getByText(/ready/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /открыть тур/i })).toHaveAttribute('href', '/tour/abc123');
  });

  it('shows upload controls for selected first property when handlers are provided', () => {
    render(
      <PropertyDashboard
        properties={properties}
        onUploadMedia={vi.fn()}
        onCreateTour={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/glb\/lidar файл/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /загрузить и создать тур/i })).toBeInTheDocument();
  });
});
