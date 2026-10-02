import { NextRequest, NextResponse } from 'next/server';
import { autenticacaoObrigatoria, nomeDoCookieDaSessao, obterSessao } from '@/infraestrutura/autenticacao/sessao';

export async function GET(requisicao: NextRequest) {
  const sessao = obterSessao(requisicao.cookies.get(nomeDoCookieDaSessao)?.value);
  if (sessao) return NextResponse.json(sessao);
  if (!autenticacaoObrigatoria()) return NextResponse.json({ usuario: 'desenvolvimento', perfil: 'administrador_principal' });
  return NextResponse.json({ mensagem: 'Sessão inválida.' }, { status: 401 });
}
