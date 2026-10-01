import { NextResponse } from 'next/server';
import { esquemaDoLancamentoFinanceiro } from '@/dominio/lancamento-financeiro';
import { cadastrarLancamentoFinanceiro, listarLancamentosFinanceiros } from '@/infraestrutura/repositorios/repositorio-de-lancamentos-financeiros';
export const runtime = 'nodejs';
export async function GET() { return NextResponse.json(await listarLancamentosFinanceiros()); }
export async function POST(requisicao: Request) { try { return NextResponse.json(await cadastrarLancamentoFinanceiro(esquemaDoLancamentoFinanceiro.parse(await requisicao.json())), { status: 201 }); } catch { return NextResponse.json({ mensagem: 'Revise os dados do lançamento.' }, { status: 400 }); } }
