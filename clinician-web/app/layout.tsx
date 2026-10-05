import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bond for Clinicians',
  description: 'Clinician dashboard for couples using Bond.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
