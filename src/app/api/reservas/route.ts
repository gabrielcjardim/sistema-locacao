import { NextResponse } from 'next/server';
import { esquemaDaReserva } from '@/dominio/reserva';
import { cadastrarReserva, listarReservas } from '@/infraestrutura/repositorios/repositorio-de-reservas';

export const runtime = 'nodejs';
const mensagens: Record<string, string> = {
  ACOMODACAO_NAO_ENCONTRADA: 'A acomodação selecionada não existe.',
  HOSPEDE_NAO_ENCONTRADO: 'O hóspede selecionado não existe.',
  CAPACIDADE_EXCEDIDA: 'A quantidade de hóspedes excede a capacidade da acomodação.',
  PERIODO_INDISPONIVEL: 'A acomodação já possui uma reserva nesse período.',
  PERIODO_BLOQUEADO: 'A acomodação está bloqueada nesse período.',
};

export async function GET() { return NextResponse.json(await listarReservas()); }
export async function POST(requisicao: Request) {
  try { return NextResponse.json(await cadastrarReserva(esquemaDaReserva.parse(await requisicao.json())), { status: 201 }); }
  catch (erro) {
    const codigo = erro instanceof Error ? erro.message : '';
    return NextResponse.json({ mensagem: mensagens[codigo] ?? 'Revise os dados da reserva.' }, { status: 400 });
  }
}
