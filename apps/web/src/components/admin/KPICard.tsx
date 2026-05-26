'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Car, Calendar, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency } from '@/utils/cn';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  format?: 'currency' | 'number' | 'percent';
}

export function KPICard({ title, value, change, icon: Icon, format = 'number' }: KPICardProps) {
  const displayValue =
    format === 'currency' ? formatCurrency(Number(value)) :
    format === 'percent' ? `${value}%` : value;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-electric-500/10">
            <Icon className="h-4 w-4 text-electric-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{displayValue}</div>
          {change !== undefined && (
            <div className={cn('mt-1 flex items-center text-xs', change >= 0 ? 'text-neon-400' : 'text-red-400')}>
              {change >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {Math.abs(change)}% from last month
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardKPIs({ kpis }: { kpis: Record<string, number> }) {
  const cards = [
    { title: 'Total Revenue', value: kpis.totalRevenue || 0, icon: DollarSign, format: 'currency' as const, change: 12 },
    { title: 'Active Bookings', value: kpis.activeBookings || 0, icon: Calendar, format: 'number' as const, change: 8 },
    { title: 'Fleet Utilization', value: kpis.fleetUtilization || 0, icon: Car, format: 'percent' as const, change: 5 },
    { title: 'Total Customers', value: kpis.totalCustomers || 0, icon: Users, format: 'number' as const, change: 15 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <KPICard key={c.title} {...c} />
      ))}
    </div>
  );
}
