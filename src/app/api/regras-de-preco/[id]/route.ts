import { NextResponse } from 'next/server';
import { esquemaDaRegraDePreco } from '@/dominio/regra-de-preco';
import { atualizarRegraDePreco, excluirRegraDePreco } from '@/infraestrutura/repositorios/repositorio-de-regras-de-preco';

export const runtime = 'nodejs';

function responderErro(erro: unknown) {
  const codigo = erro instanceof Error ? erro.message : '';
  const mensagem = codigo === 'REGRA_NAO_ENCONTRADA' ? 'A regra de preço não foi encontrada.' : codigo === 'PERIODO_SOBREPOSTO' ? 'Já existe uma regra ativa nesse período e nesse mesmo nível.' : codigo === 'ACOMODACAO_NAO_ENCONTRADA' ? 'A acomodação selecionada não existe.' : 'Revise os dados da regra de preço.';
  return NextResponse.json({ mensagem }, { status: codigo === 'REGRA_NAO_ENCONTRADA' ? 404 : 400 });
}

export async function PATCH(requisicao: Request, contexto: RouteContext<'/api/regras-de-preco/[id]'>) {
  try {
    const { id } = await contexto.params;
    return NextResponse.json(await atualizarRegraDePreco(id, esquemaDaRegraDePreco.parse(await requisicao.json())));
  } catch (erro) { return responderErro(erro); }
}

export async function DELETE(_: Request, contexto: RouteContext<'/api/regras-de-preco/[id]'>) {
  try {
    const { id } = await contexto.params;
    await excluirRegraDePreco(id);
    return new NextResponse(null, { status: 204 });
  } catch (erro) { return responderErro(erro); }
}

