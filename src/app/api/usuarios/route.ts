import { NextResponse } from 'next/server';
import { esquemaDeNovoUsuario } from '@/dominio/usuario-do-sistema';
import { cadastrarUsuario, listarUsuarios } from '@/infraestrutura/repositorios/repositorio-de-usuarios';

export const runtime = 'nodejs';
export async function GET() { return NextResponse.json(await listarUsuarios()); }
export async function POST(requisicao: Request) {
  try { return NextResponse.json(await cadastrarUsuario(esquemaDeNovoUsuario.parse(await requisicao.json())), { status: 201 }); }
  catch (erro) { const codigo = erro instanceof Error ? erro.message : ''; return NextResponse.json({ mensagem: codigo === 'USUARIO_JA_EXISTE' ? 'Este nome de usuário já está em uso.' : 'Revise os dados do usuário. A senha deve ter ao menos 10 caracteres.' }, { status: 400 }); }
}
