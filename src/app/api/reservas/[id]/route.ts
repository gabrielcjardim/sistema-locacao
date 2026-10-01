import { NextResponse } from 'next/server';
import { esquemaDaReserva } from '@/dominio/reserva';
import { atualizarReserva } from '@/infraestrutura/repositorios/repositorio-de-reservas';

export const runtime = 'nodejs';

const mensagens: Record<string, string> = {
  RESERVA_NAO_ENCONTRADA: 'A reserva não foi encontrada.',
  ACOMODACAO_NAO_ENCONTRADA: 'A acomodação selecionada não existe.',
  HOSPEDE_NAO_ENCONTRADO: 'O hóspede selecionado não existe.',
  CAPACIDADE_EXCEDIDA: 'A quantidade de hóspedes excede a capacidade da acomodação.',
  PERIODO_INDISPONIVEL: 'A acomodação já possui uma reserva nesse período.',
  PERIODO_BLOQUEADO: 'A acomodação está bloqueada nesse período.',
};

export async function PATCH(requisicao: Request, contexto: RouteContext<'/api/reservas/[id]'>) {
  try {
    const { id } = await contexto.params;
    const dados = esquemaDaReserva.parse(await requisicao.json());
    return NextResponse.json(await atualizarReserva(id, dados));
  } catch (erro) {
    const codigo = erro instanceof Error ? erro.message : '';
    const situacao = codigo === 'RESERVA_NAO_ENCONTRADA' ? 404 : 400;
    return NextResponse.json({ mensagem: mensagens[codigo] ?? 'Revise os dados da reserva.' }, { status: situacao });
  }
}
