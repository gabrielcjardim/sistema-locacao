import { NextResponse } from 'next/server';
import { esquemaDaAcomodacao } from '@/dominio/acomodacao';
import { atualizarAcomodacao, removerAcomodacao } from '@/infraestrutura/repositorios/repositorio-de-acomodacoes';

export const runtime = 'nodejs';
export async function PATCH(requisicao: Request, contexto: RouteContext<'/api/acomodacoes/[id]'>) {
  try { const { id } = await contexto.params; return NextResponse.json(await atualizarAcomodacao(id, esquemaDaAcomodacao.parse(await requisicao.json()))); }
  catch (erro) { const codigo = erro instanceof Error ? erro.message : ''; return NextResponse.json({ mensagem: codigo === 'ACOMODACAO_NAO_ENCONTRADA' ? 'A acomodação não foi encontrada.' : 'Revise os dados da acomodação.' }, { status: codigo === 'ACOMODACAO_NAO_ENCONTRADA' ? 404 : 400 }); }
}

export async function DELETE(_requisicao: Request, contexto: RouteContext<'/api/acomodacoes/[id]'>) {
  try { const { id } = await contexto.params; await removerAcomodacao(id); return new NextResponse(null, { status: 204 }); }
  catch (erro) { const codigo = erro instanceof Error ? erro.message : ''; const mensagem = codigo === 'ACOMODACAO_COM_HISTORICO' ? 'Esta acomodação possui reservas, bloqueios, vistorias ou regras vinculadas e não pode ser excluída. Você pode inativá-la.' : 'A acomodação não foi encontrada.'; return NextResponse.json({ mensagem }, { status: codigo === 'ACOMODACAO_COM_HISTORICO' ? 409 : 404 }); }
}
