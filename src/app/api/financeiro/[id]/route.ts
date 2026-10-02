import { NextResponse } from 'next/server';
import { esquemaDoLancamentoFinanceiro } from '@/dominio/lancamento-financeiro';
import { atualizarLancamentoFinanceiro, excluirLancamentoFinanceiro } from '@/infraestrutura/repositorios/repositorio-de-lancamentos-financeiros';
export const runtime = 'nodejs';
export async function PATCH(requisicao: Request, contexto: RouteContext<'/api/financeiro/[id]'>) { try { const { id } = await contexto.params; return NextResponse.json(await atualizarLancamentoFinanceiro(id, esquemaDoLancamentoFinanceiro.parse(await requisicao.json()))); } catch { return NextResponse.json({ mensagem: 'Não foi possível atualizar o lançamento.' }, { status: 400 }); } }
export async function DELETE(_: Request, contexto: RouteContext<'/api/financeiro/[id]'>) { try { const { id } = await contexto.params; await excluirLancamentoFinanceiro(id); return new NextResponse(null, { status: 204 }); } catch { return NextResponse.json({ mensagem: 'O lançamento não foi encontrado.' }, { status: 404 }); } }

