import { NextResponse } from 'next/server';
import { esquemaDoHospede } from '@/dominio/hospede';
import { cadastrarHospede, listarHospedes } from '@/infraestrutura/repositorios/repositorio-de-hospedes';

export const runtime = 'nodejs';
export async function GET() { return NextResponse.json(await listarHospedes()); }
export async function POST(requisicao: Request) {
  try { return NextResponse.json(await cadastrarHospede(esquemaDoHospede.parse(await requisicao.json())), { status: 201 }); }
  catch (erro) {
    const mensagem = erro instanceof Error && erro.message === 'CPF_JA_CADASTRADO' ? 'Já existe um hóspede com este CPF.' : 'Revise os dados do hóspede.';
    return NextResponse.json({ mensagem }, { status: 400 });
  }
}
