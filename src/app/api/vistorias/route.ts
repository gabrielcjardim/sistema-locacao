import { NextResponse } from 'next/server';
import { esquemaDaVistoria } from '@/dominio/vistoria';
import { cadastrarVistoria, listarVistorias } from '@/infraestrutura/repositorios/repositorio-de-vistorias';
export const runtime = 'nodejs';
export async function GET() { return NextResponse.json(await listarVistorias()); }
export async function POST(requisicao: Request) { try { return NextResponse.json(await cadastrarVistoria(esquemaDaVistoria.parse(await requisicao.json())), { status: 201 }); } catch (erro) { return NextResponse.json({ mensagem: erro instanceof Error && erro.message === 'RESERVA_NAO_ENCONTRADA' ? 'A reserva selecionada não foi encontrada.' : 'Revise os dados da vistoria.' }, { status: 400 }); } }
