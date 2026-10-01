import { NextResponse } from 'next/server';
import { z } from 'zod';
import { obterConfiguracoes, salvarConfiguracoes } from '@/infraestrutura/repositorios/repositorio-de-configuracoes';

export const runtime = 'nodejs';
const corHexadecimal = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Informe uma cor hexadecimal válida.');
const esquema = z.object({ corPrincipal: corHexadecimal, coresRecentes: z.array(corHexadecimal).max(5) });
export async function GET() { return NextResponse.json(await obterConfiguracoes()); }
export async function PATCH(requisicao: Request) {
  try { return NextResponse.json(await salvarConfiguracoes(esquema.parse(await requisicao.json()))); }
  catch { return NextResponse.json({ mensagem: 'Informe uma cor válida no formato #RRGGBB.' }, { status: 400 }); }
}
