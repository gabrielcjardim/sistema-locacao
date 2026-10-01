import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  autenticacaoObrigatoria,
  criarTokenDaSessao,
  duracaoDaSessaoEmSegundos,
  nomeDoCookieDaSessao,
  senhaConfereComHash,
} from '@/infraestrutura/autenticacao/sessao';
import { obterUsuarioParaAutenticacao } from '@/infraestrutura/repositorios/repositorio-de-usuarios';

const dadosDeEntrada = z.object({
  usuario: z.string().trim().min(1),
  senha: z.string().min(1),
});

export async function POST(requisicao: Request) {
  try {
    const dados = dadosDeEntrada.parse(await requisicao.json());
    if (autenticacaoObrigatoria()) {
      const usuario = await obterUsuarioParaAutenticacao(dados.usuario);
      if (!usuario?.ativo || !senhaConfereComHash(dados.senha, usuario.senhaHash)) {
        return NextResponse.json({ mensagem: 'Usuário ou senha inválidos, ou acesso inativo.' }, { status: 401 });
      }
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
