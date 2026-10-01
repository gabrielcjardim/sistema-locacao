import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  autenticacaoObrigatoria,
  criarTokenDaSessao,
  credenciaisSaoValidas,
  duracaoDaSessaoEmSegundos,
  nomeDoCookieDaSessao,
} from '@/infraestrutura/autenticacao/sessao';

const dadosDeEntrada = z.object({
  usuario: z.string().trim().min(1),
  senha: z.string().min(1),
});

export async function POST(requisicao: Request) {
  try {
    const dados = dadosDeEntrada.parse(await requisicao.json());
    if (autenticacaoObrigatoria() && !credenciaisSaoValidas(dados.usuario, dados.senha)) {
      return NextResponse.json({ mensagem: 'Usuário ou senha inválidos.' }, { status: 401 });
    }

    const resposta = NextResponse.json({ autenticado: true });
    if (autenticacaoObrigatoria()) {
      resposta.cookies.set(nomeDoCookieDaSessao, criarTokenDaSessao(dados.usuario), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: duracaoDaSessaoEmSegundos,
        priority: 'high',
      });
    }
    return resposta;
  } catch (erro) {
    console.error('Falha ao autenticar:', erro);
    return NextResponse.json({ mensagem: 'Não foi possível autenticar.' }, { status: 400 });
  }
}
