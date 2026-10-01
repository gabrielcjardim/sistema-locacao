import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Meus Aptos',
  description: 'Gestão de acomodações, hóspedes, reservas e disponibilidade.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = { themeColor: '#143d36', width: 'device-width', initialScale: 1 };

export default function LayoutPrincipal({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
