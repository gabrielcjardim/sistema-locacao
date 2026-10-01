import { NextRequest, NextResponse } from 'next/server';
import { esquemaDeAlteracaoDoUsuario } from '@/dominio/usuario-do-sistema';
import { atualizarUsuario } from '@/infraestrutura/repositorios/repositorio-de-usuarios';
import { obterUsuarioDaSessao } from '@/infraestrutura/autenticacao/sessao';

export const runtime = 'nodejs';
export async function PATCH(requisicao: NextRequest, contexto: RouteContext<'/api/usuarios/[id]'>) {
  try { const { id } = await contexto.params; const usuarioAtual = obterUsuarioDaSessao(requisicao.cookies.get('sessao_meus_aptos')?.value) ?? ''; return NextResponse.json(await atualizarUsuario(id, esquemaDeAlteracaoDoUsuario.parse(await requisicao.json()), usuarioAtual)); }
  catch (erro) { const codigo = erro instanceof Error ? erro.message : ''; const mensagens: Record<string,string> = { USUARIO_JA_EXISTE: 'Este nome de usuário já está em uso.', NAO_PODE_INATIVAR_A_SI_MESMO: 'Você não pode inativar o próprio acesso.', USUARIO_NAO_ENCONTRADO: 'Usuário não encontrado.', SENHA_CURTA: 'A nova senha deve ter ao menos 10 caracteres.' }; return NextResponse.json({ mensagem: mensagens[codigo] ?? 'Revise os dados do usuário.' }, { status: codigo === 'USUARIO_NAO_ENCONTRADO' ? 404 : 400 }); }
}
