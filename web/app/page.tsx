import { getMetrics } from '../lib/orders';
import { Landing } from '../components/landing/Landing';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const metrics = await getMetrics();
  return <Landing metrics={metrics} />;
}
