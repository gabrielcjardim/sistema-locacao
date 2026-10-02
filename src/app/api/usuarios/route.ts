import { NextResponse } from 'next/server';
import { esquemaDeNovoUsuario } from '@/dominio/usuario-do-sistema';
import { cadastrarUsuario, listarUsuarios, obterUsuarioParaAutenticacao } from '@/infraestrutura/repositorios/repositorio-de-usuarios';
import { autenticacaoObrigatoria, nomeDoCookieDaSessao, obterSessao } from '@/infraestrutura/autenticacao/sessao';

export const runtime = 'nodejs';
export async function GET(requisicao: Request) {
  const cookie = requisicao.headers.get('cookie')?.match(new RegExp(`${nomeDoCookieDaSessao}=([^;]+)`))?.[1];
  const sessao = obterSessao(cookie);
  const usuarioAtual = sessao ? await obterUsuarioParaAutenticacao(sessao.usuario) : null;
  const perfil = usuarioAtual?.perfil ?? sessao?.perfil ?? (autenticacaoObrigatoria() ? 'operador' : 'administrador_principal');
  if (perfil === 'operador') return NextResponse.json({ mensagem: 'Acesso restrito aos administradores.' }, { status: 403 });
  const usuarios = await listarUsuarios();
  return NextResponse.json(perfil === 'administrador_principal' ? usuarios : usuarios.filter((usuario) => usuario.perfil !== 'administrador_principal'));
}
export async function POST(requisicao: Request) {
  try {
    const cookie = requisicao.headers.get('cookie')?.match(new RegExp(`${nomeDoCookieDaSessao}=([^;]+)`))?.[1]; const sessao = obterSessao(cookie); const usuarioAtual = sessao ? await obterUsuarioParaAutenticacao(sessao.usuario) : null; const perfilAtual = usuarioAtual?.perfil ?? sessao?.perfil ?? (autenticacaoObrigatoria() ? 'operador' : 'administrador_principal');
    if (perfilAtual === 'operador') return NextResponse.json({ mensagem: 'Acesso restrito aos administradores.' }, { status: 403 });
    const dados = esquemaDeNovoUsuario.parse(await requisicao.json());
    if (dados.perfil === 'administrador_principal') return NextResponse.json({ mensagem: 'A conta de administrador principal é única e protegida.' }, { status: 403 });
    return NextResponse.json(await cadastrarUsuario(dados), { status: 201 });
  }
  catch (erro) { const codigo = erro instanceof Error ? erro.message : ''; return NextResponse.json({ mensagem: codigo === 'USUARIO_JA_EXISTE' ? 'Este nome de usuário já está em uso.' : 'Revise os dados do usuário. A senha deve ter ao menos 10 caracteres.' }, { status: 400 }); }
}
