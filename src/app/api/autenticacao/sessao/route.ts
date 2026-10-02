import { NextRequest, NextResponse } from 'next/server';
import { autenticacaoObrigatoria, nomeDoCookieDaSessao, obterSessao } from '@/infraestrutura/autenticacao/sessao';
import { obterUsuarioParaAutenticacao } from '@/infraestrutura/repositorios/repositorio-de-usuarios';

export async function GET(requisicao: NextRequest) {
  const sessao = obterSessao(requisicao.cookies.get(nomeDoCookieDaSessao)?.value);
  if (sessao) {
    const usuarioAtual = await obterUsuarioParaAutenticacao(sessao.usuario);
    return NextResponse.json({ usuario: sessao.usuario, perfil: usuarioAtual?.perfil ?? sessao.perfil });
  }
  if (!autenticacaoObrigatoria()) return NextResponse.json({ usuario: 'desenvolvimento', perfil: 'administrador_principal' });
  return NextResponse.json({ mensagem: 'Sessão inválida.' }, { status: 401 });
}
