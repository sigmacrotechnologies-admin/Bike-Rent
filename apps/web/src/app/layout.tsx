import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { SocketProvider } from '@/components/providers/SocketProvider';

export const metadata: Metadata = {
  title: 'VelocityRent - Premium Vehicle Rental Platform',
  description: 'Rent bikes, cars, EVs, and scooters with GPS tracking, real-time availability, and secure payments.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <QueryProvider>
            <SocketProvider>{children}</SocketProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
