import { NextResponse } from 'next/server';
import { removerBloqueio } from '@/infraestrutura/repositorios/repositorio-de-bloqueios';
export const runtime = 'nodejs';
export async function DELETE(_requisicao: Request, contexto: RouteContext<'/api/bloqueios/[id]'>) { try { const { id } = await contexto.params; await removerBloqueio(id); return new NextResponse(null, { status: 204 }); } catch { return NextResponse.json({ mensagem: 'Bloqueio não encontrado.' }, { status: 404 }); } }
