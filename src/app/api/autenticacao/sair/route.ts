import { NextResponse } from 'next/server';
import { nomeDoCookieDaSessao } from '@/infraestrutura/autenticacao/sessao';

export async function POST() {
  const resposta = NextResponse.json({ autenticado: false });
  resposta.cookies.set(nomeDoCookieDaSessao, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return resposta;
}
