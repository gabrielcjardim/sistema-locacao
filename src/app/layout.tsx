import type { CSSProperties } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { obterConfiguracoes } from '@/infraestrutura/repositorios/repositorio-de-configuracoes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Meus Aptos',
  description: 'Gestão de acomodações, hóspedes, reservas e disponibilidade.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = { themeColor: '#143d36', width: 'device-width', initialScale: 1 };

export default async function LayoutPrincipal({ children }: Readonly<{ children: React.ReactNode }>) {
  const configuracoes = await obterConfiguracoes();
  return <html lang="pt-BR" style={{ '--verde': configuracoes.corPrincipal } as CSSProperties}><body>{children}</body></html>;
}
