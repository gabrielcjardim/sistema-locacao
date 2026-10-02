import { NextRequest, NextResponse } from 'next/server';
import { esquemaDaPropriaConta } from '@/dominio/usuario-do-sistema';
import { autenticacaoObrigatoria, nomeDoCookieDaSessao, obterSessao } from '@/infraestrutura/autenticacao/sessao';
import { atualizarPropriaConta } from '@/infraestrutura/repositorios/repositorio-de-usuarios';

export const runtime = 'nodejs';

export async function PATCH(requisicao: NextRequest) {
  try {
    const sessao = obterSessao(requisicao.cookies.get(nomeDoCookieDaSessao)?.value);
    if (!sessao && autenticacaoObrigatoria()) return NextResponse.json({ mensagem: 'Sessão inválida.' }, { status: 401 });
    if (!sessao) return NextResponse.json({ mensagem: 'A conta pessoal só pode ser alterada com autenticação ativa.' }, { status: 400 });
    return NextResponse.json(await atualizarPropriaConta(sessao.usuario, esquemaDaPropriaConta.parse(await requisicao.json())));
  } catch (erro) {
    const codigo = erro instanceof Error ? erro.message : '';
    return NextResponse.json({ mensagem: codigo === 'USUARIO_NAO_ENCONTRADO' ? 'O usuário conectado não foi encontrado.' : 'Revise o nome e a nova senha.' }, { status: codigo === 'USUARIO_NAO_ENCONTRADO' ? 404 : 400 });
  }
}

