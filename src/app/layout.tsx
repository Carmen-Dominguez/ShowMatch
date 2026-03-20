import type { Metadata } from 'next';
import { AppProvider } from '@/context/AppContext';
import './globals.scss';

export const metadata: Metadata = {
  title: 'ShowMatch – Find What to Watch Together',
  description: 'The couples streaming picker that finds movies and shows you both want to watch.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
