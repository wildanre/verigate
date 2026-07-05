import { NextResponse } from 'next/server';
import { getOrders } from '../../../lib/orders';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ orders: await getOrders() });
}
