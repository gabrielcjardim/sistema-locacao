import { NextRequest, NextResponse } from 'next/server';
import {
  autenticacaoObrigatoria,
  nomeDoCookieDaSessao,
  tokenDaSessaoEValido,
} from '@/infraestrutura/autenticacao/sessao';
import { licenciamentoObrigatorio, nomeDoCookieDaLicenca } from '@/infraestrutura/licenciamento/configuracao';
import { validarTokenDaLicenca } from '@/infraestrutura/licenciamento/token';
import { lerEstadoRecebido } from '@/infraestrutura/licenciamento/estado-da-licenca';

const caminhosPublicos = ['/login', '/api/autenticacao/entrar', '/api/saude', '/ativacao', '/api/licenca'];

export async function proxy(requisicao: NextRequest) {
  const caminho = requisicao.nextUrl.pathname;
  const caminhoPublico = caminhosPublicos.some((publico) => caminho === publico || caminho.startsWith(`${publico}/`));

  if (licenciamentoObrigatorio() && !caminhoPublico) {
    try {
      const estadoRecebido = await lerEstadoRecebido();
      const token = estadoRecebido?.situacao === 'ativa' && estadoRecebido.tokenDaLicenca ? estadoRecebido.tokenDaLicenca : requisicao.cookies.get(nomeDoCookieDaLicenca)?.value;
      const licenca = token ? await validarTokenDaLicenca(token) : null;
      if (!licenca || licenca.situacao === 'expirada') throw new Error('LICENCA_INATIVA');
      if (estadoRecebido?.licencaId === licenca.conteudo.licencaId && estadoRecebido.situacao !== 'ativa') throw new Error(`LICENCA_${estadoRecebido.situacao.toUpperCase()}`);
    } catch {
      if (caminho.startsWith('/api/')) return NextResponse.json({ mensagem: 'Licença ausente, inválida ou expirada.' }, { status: 402 });
      const ativacao = new URL('/ativacao', requisicao.url);
      ativacao.searchParams.set('destino', caminho);
      return NextResponse.redirect(ativacao);
    }
  }

  if (!autenticacaoObrigatoria()) return NextResponse.next();

  const sessaoValida = tokenDaSessaoEValido(requisicao.cookies.get(nomeDoCookieDaSessao)?.value);

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

