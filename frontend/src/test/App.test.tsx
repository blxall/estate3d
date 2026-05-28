import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../App';

describe('App', () => {
  it('renders the Estate3D frontend MVP with seeded demo object', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /Estate3D/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Демо LiDAR/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /открыть тур/i })).toHaveAttribute('href', '/tour/demo-lidar');
  });
});
