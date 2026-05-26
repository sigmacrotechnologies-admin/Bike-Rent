'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { DashboardKPIs } from '@/components/admin/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyticsService, bookingService } from '@/services';

export default function AdminDashboard() {
  const { data: statsData } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => analyticsService.dashboard().then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['admin-bookings-recent'],
    queryFn: () => bookingService.list({ limit: 5 }).then((r) => r.data),
  });

  const kpis = statsData?.kpis || {};
  const revenueByMonth = statsData?.revenueByMonth || [];
  const topVehicles = statsData?.topVehicles || [];
  const recentBookings = bookingsData?.data || [];

  const chartData = revenueByMonth.map((m: { _id: number; revenue: number }) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m._id - 1],
    revenue: m.revenue,
  }));

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">Real-time fleet and business analytics</p>
      </motion.div>

      <DashboardKPIs kpis={kpis} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
                <Line type="monotone" dataKey="revenue" stroke="#007BFF" strokeWidth={2} dot={{ fill: '#39FF14' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Vehicles</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topVehicles}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
                <Bar dataKey="count" fill="#007BFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Bookings</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-muted-foreground">
                  <th className="pb-3 pr-4">Booking #</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Vehicle</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b: {
                  _id: string; bookingNumber: string; status: string;
                  user?: { firstName: string; lastName: string };
                  vehicle?: { name: string };
                  pricing?: { totalAmount: number };
                }) => (
                  <tr key={b._id} className="border-b border-border/20">
                    <td className="py-3 pr-4 font-medium">{b.bookingNumber}</td>
                    <td className="py-3 pr-4">{b.user?.firstName} {b.user?.lastName}</td>
                    <td className="py-3 pr-4">{b.vehicle?.name}</td>
                    <td className="py-3 pr-4"><Badge>{b.status}</Badge></td>
                    <td className="py-3">₹{b.pricing?.totalAmount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
