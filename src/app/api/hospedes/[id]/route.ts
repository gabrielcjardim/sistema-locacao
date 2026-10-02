import { NextResponse } from 'next/server';
import { esquemaDoHospede } from '@/dominio/hospede';
import { atualizarHospede, excluirHospede } from '@/infraestrutura/repositorios/repositorio-de-hospedes';

export const runtime = 'nodejs';

function responderErro(erro: unknown) {
  const codigo = erro instanceof Error ? erro.message : '';
  const mensagem = codigo === 'HOSPEDE_NAO_ENCONTRADO' ? 'O hóspede não foi encontrado.' : codigo === 'HOSPEDE_COM_RESERVAS' ? 'Este hóspede possui reservas vinculadas. Mantenha o cadastro para preservar o histórico.' : codigo === 'CPF_JA_CADASTRADO' ? 'Já existe um hóspede com este CPF.' : 'Revise os dados do hóspede.';
  return NextResponse.json({ mensagem }, { status: codigo === 'HOSPEDE_NAO_ENCONTRADO' ? 404 : codigo === 'HOSPEDE_COM_RESERVAS' ? 409 : 400 });
}

export async function PATCH(requisicao: Request, contexto: RouteContext<'/api/hospedes/[id]'>) {
  try { const { id } = await contexto.params; return NextResponse.json(await atualizarHospede(id, esquemaDoHospede.parse(await requisicao.json()))); }
  catch (erro) { return responderErro(erro); }
}

export async function DELETE(_: Request, contexto: RouteContext<'/api/hospedes/[id]'>) {
  try { const { id } = await contexto.params; await excluirHospede(id); return new NextResponse(null, { status: 204 }); }
  catch (erro) { return responderErro(erro); }
}

