'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardKPIs } from '@/components/admin/KPICard';
import { analyticsService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenuePage() {
  const { data } = useQuery({
    queryKey: ['revenue-dashboard'],
    queryFn: () => analyticsService.dashboard().then((r) => r.data.data),
  });

  const kpis = data?.kpis || {};
  const revenueByMonth = (data?.revenueByMonth || []).map((m: { _id: number; revenue: number; count: number }) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m._id - 1],
    revenue: m.revenue,
    bookings: m.count,
  }));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Revenue Dashboard</h1>
      <DashboardKPIs kpis={kpis} />
      <Card>
        <CardHeader><CardTitle>Monthly Revenue & Bookings</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
              <Bar dataKey="revenue" fill="#007BFF" name="Revenue (₹)" />
              <Bar dataKey="bookings" fill="#39FF14" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
