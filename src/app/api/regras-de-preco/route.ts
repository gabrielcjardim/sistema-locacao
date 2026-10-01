import { NextResponse } from 'next/server';
import { esquemaDaRegraDePreco } from '@/dominio/regra-de-preco';
import { cadastrarRegraDePreco, listarRegrasDePreco } from '@/infraestrutura/repositorios/repositorio-de-regras-de-preco';

export const runtime = 'nodejs';
export async function GET() { return NextResponse.json(await listarRegrasDePreco()); }
export async function POST(requisicao: Request) {
  try { return NextResponse.json(await cadastrarRegraDePreco(esquemaDaRegraDePreco.parse(await requisicao.json())), { status: 201 }); }
  catch (erro) {
    const codigo = erro instanceof Error ? erro.message : '';
    const mensagem = codigo === 'PERIODO_SOBREPOSTO' ? 'Já existe uma regra ativa nesse período e nesse mesmo nível.' : codigo === 'ACOMODACAO_NAO_ENCONTRADA' ? 'A acomodação selecionada não existe.' : 'Revise os dados da regra de preço.';
    return NextResponse.json({ mensagem }, { status: 400 });
  }
}
