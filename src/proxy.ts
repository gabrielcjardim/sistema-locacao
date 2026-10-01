import { NextRequest, NextResponse } from 'next/server';
import {
  autenticacaoObrigatoria,
  nomeDoCookieDaSessao,
  tokenDaSessaoEValido,
} from '@/infraestrutura/autenticacao/sessao';

const caminhosPublicos = ['/login', '/api/autenticacao/entrar', '/api/saude'];

export function proxy(requisicao: NextRequest) {
  if (!autenticacaoObrigatoria()) return NextResponse.next();

  const caminho = requisicao.nextUrl.pathname;
  const sessaoValida = tokenDaSessaoEValido(requisicao.cookies.get(nomeDoCookieDaSessao)?.value);
  const caminhoPublico = caminhosPublicos.some((publico) => caminho === publico || caminho.startsWith(`${publico}/`));

  if (caminho === '/login' && sessaoValida) {
    return NextResponse.redirect(new URL('/', requisicao.url));
  }
  if (caminhoPublico) return NextResponse.next();
  if (sessaoValida) return NextResponse.next();

  if (caminho.startsWith('/api/')) {
    return NextResponse.json({ mensagem: 'Sessão ausente ou expirada.' }, { status: 401 });
  }

  const entrada = new URL('/login', requisicao.url);
  entrada.searchParams.set('destino', caminho);
  return NextResponse.redirect(entrada);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest).*)'],
};
