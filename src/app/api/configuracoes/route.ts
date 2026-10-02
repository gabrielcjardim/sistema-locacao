import { NextResponse } from 'next/server';
import { z } from 'zod';
import { obterConfiguracoes, salvarConfiguracoes } from '@/infraestrutura/repositorios/repositorio-de-configuracoes';

export const runtime = 'nodejs';
const corHexadecimal = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Informe uma cor hexadecimal válida.');
const modeloDeMensagem = z.string().trim().min(1, 'Informe o modelo da mensagem.').max(3000, 'O modelo da mensagem deve ter no máximo 3.000 caracteres.');
const esquema = z.object({ corPrincipal: corHexadecimal, coresRecentes: z.array(corHexadecimal).max(5), modeloDaMensagemWhatsapp: modeloDeMensagem, modeloDaMensagemWhatsappConclusao: modeloDeMensagem, modeloDaMensagemWhatsappCancelamento: modeloDeMensagem });
export async function GET() { return NextResponse.json(await obterConfiguracoes()); }
export async function PATCH(requisicao: Request) {
  try { return NextResponse.json(await salvarConfiguracoes(esquema.parse(await requisicao.json()))); }
  catch (erro) { return NextResponse.json({ mensagem: erro instanceof z.ZodError ? erro.issues[0]?.message : 'Não foi possível salvar as configurações.' }, { status: 400 }); }
}
