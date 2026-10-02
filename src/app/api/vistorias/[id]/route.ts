import { NextResponse } from 'next/server';
import { esquemaDaVistoria } from '@/dominio/vistoria';
import { atualizarVistoria, excluirVistoria } from '@/infraestrutura/repositorios/repositorio-de-vistorias';
export const runtime = 'nodejs';
export async function PATCH(requisicao: Request, contexto: RouteContext<'/api/vistorias/[id]'>) { try { const { id } = await contexto.params; return NextResponse.json(await atualizarVistoria(id, esquemaDaVistoria.parse(await requisicao.json()))); } catch { return NextResponse.json({ mensagem: 'Não foi possível atualizar a vistoria.' }, { status: 400 }); } }
export async function DELETE(_: Request, contexto: RouteContext<'/api/vistorias/[id]'>) { try { const { id } = await contexto.params; await excluirVistoria(id); return new NextResponse(null, { status: 204 }); } catch { return NextResponse.json({ mensagem: 'A vistoria não foi encontrada.' }, { status: 404 }); } }

