'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Company Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Company Name</Label><Input defaultValue="VelocityRent" /></div>
            <div className="space-y-2"><Label>Support Email</Label><Input defaultValue="support@velocityrent.com" /></div>
            <div className="space-y-2"><Label>Support Phone</Label><Input defaultValue="+91 98765 43210" /></div>
            <Button>Save Settings</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Payment Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Razorpay Key ID</Label><Input placeholder="rzp_..." /></div>
            <div className="space-y-2"><Label>Stripe Publishable Key</Label><Input placeholder="pk_..." /></div>
            <Button>Update Payment Config</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
