import { NextRequest, NextResponse } from 'next/server';
import { esquemaDeAlteracaoDoUsuario } from '@/dominio/usuario-do-sistema';
import { atualizarUsuario } from '@/infraestrutura/repositorios/repositorio-de-usuarios';
import { obterUsuarioParaAutenticacao } from '@/infraestrutura/repositorios/repositorio-de-usuarios';
import { autenticacaoObrigatoria, nomeDoCookieDaSessao, obterSessao } from '@/infraestrutura/autenticacao/sessao';

export const runtime = 'nodejs';
export async function PATCH(requisicao: NextRequest, contexto: RouteContext<'/api/usuarios/[id]'>) {
  try { const { id } = await contexto.params; const sessao = obterSessao(requisicao.cookies.get(nomeDoCookieDaSessao)?.value); const usuarioAtual = sessao ? await obterUsuarioParaAutenticacao(sessao.usuario) : null; const perfilAtual = usuarioAtual?.perfil ?? sessao?.perfil ?? (autenticacaoObrigatoria() ? 'operador' : 'administrador_principal'); if (perfilAtual === 'operador') return NextResponse.json({ mensagem: 'Acesso restrito aos administradores.' }, { status: 403 }); return NextResponse.json(await atualizarUsuario(id, esquemaDeAlteracaoDoUsuario.parse(await requisicao.json()), sessao?.usuario ?? '', perfilAtual)); }
  catch (erro) { const codigo = erro instanceof Error ? erro.message : ''; const mensagens: Record<string,string> = { USUARIO_JA_EXISTE: 'Este nome de usuário já está em uso.', NAO_PODE_INATIVAR_A_SI_MESMO: 'Você não pode inativar o próprio acesso.', ADMINISTRADOR_PROTEGIDO: 'O administrador principal é protegido.', USUARIO_NAO_ENCONTRADO: 'Usuário não encontrado.', SENHA_CURTA: 'A nova senha deve ter ao menos 10 caracteres.' }; return NextResponse.json({ mensagem: mensagens[codigo] ?? 'Revise os dados do usuário.' }, { status: codigo === 'USUARIO_NAO_ENCONTRADO' ? 404 : codigo === 'ADMINISTRADOR_PROTEGIDO' ? 403 : 400 }); }
}
