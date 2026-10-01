import { NextResponse } from 'next/server';
import { esquemaDoBloqueio } from '@/dominio/bloqueio-de-agenda';
import { cadastrarBloqueio, listarBloqueios } from '@/infraestrutura/repositorios/repositorio-de-bloqueios';
export const runtime = 'nodejs';
export async function GET() { return NextResponse.json(await listarBloqueios()); }
export async function POST(requisicao: Request) { try { return NextResponse.json(await cadastrarBloqueio(esquemaDoBloqueio.parse(await requisicao.json())), { status: 201 }); } catch (erro) { const codigo = erro instanceof Error ? erro.message : ''; const mensagem = codigo === 'PERIODO_COM_RESERVA' ? 'Já existe uma reserva para essa acomodação no período.' : codigo === 'PERIODO_JA_BLOQUEADO' ? 'Essa acomodação já está bloqueada no período.' : 'Revise os dados do bloqueio.'; return NextResponse.json({ mensagem }, { status: 400 }); } }
