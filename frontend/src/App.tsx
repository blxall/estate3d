import { PropertyDashboard } from './components/PropertyDashboard';
import type { PropertySummary } from './types';

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

export function App() {
  return <PropertyDashboard properties={demoProperties} />;
}
