import { NextResponse } from 'next/server';
import { esquemaDaAcomodacao } from '@/dominio/acomodacao';
import { cadastrarAcomodacao, listarAcomodacoes } from '@/infraestrutura/repositorios/repositorio-de-acomodacoes';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json(await listarAcomodacoes());
  } catch (erro) {
    console.error('Não foi possível listar as acomodações.', erro);
    return NextResponse.json({ mensagem: 'Não foi possível carregar as acomodações.' }, { status: 500 });
  }
}

export async function POST(requisicao: Request) {
  try {
    const dados = esquemaDaAcomodacao.parse(await requisicao.json());
    return NextResponse.json(await cadastrarAcomodacao(dados), { status: 201 });
  } catch (erro) {
    if (erro instanceof Error && erro.name === 'ZodError') {
      return NextResponse.json({ mensagem: 'Revise os dados informados.', detalhes: erro }, { status: 400 });
    }
    console.error('Não foi possível cadastrar a acomodação.', erro);
    return NextResponse.json({ mensagem: 'Não foi possível salvar a acomodação.' }, { status: 500 });
  }
}
