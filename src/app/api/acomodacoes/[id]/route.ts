import { NextResponse } from 'next/server';
import { esquemaDaAcomodacao } from '@/dominio/acomodacao';
import { atualizarAcomodacao } from '@/infraestrutura/repositorios/repositorio-de-acomodacoes';

export const runtime = 'nodejs';
export async function PATCH(requisicao: Request, contexto: RouteContext<'/api/acomodacoes/[id]'>) {
  try { const { id } = await contexto.params; return NextResponse.json(await atualizarAcomodacao(id, esquemaDaAcomodacao.parse(await requisicao.json()))); }
  catch (erro) { const codigo = erro instanceof Error ? erro.message : ''; return NextResponse.json({ mensagem: codigo === 'ACOMODACAO_NAO_ENCONTRADA' ? 'A acomodação não foi encontrada.' : 'Revise os dados da acomodação.' }, { status: codigo === 'ACOMODACAO_NAO_ENCONTRADA' ? 404 : 400 }); }
}
