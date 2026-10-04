import { NextResponse } from 'next/server';
import { z } from 'zod';
import { configuracaoDoLicenciamento } from '@/infraestrutura/licenciamento/configuracao';
import { assinaturaDoSinalEValida, lerEstadoRecebido, salvarEstadoRecebido } from '@/infraestrutura/licenciamento/estado-da-licenca';
import { validarTokenDaLicenca } from '@/infraestrutura/licenciamento/token';

const sinal = z.object({ licencaId: z.string().uuid(), instalacaoId: z.string().uuid(), situacao: z.enum(['ativa', 'suspensa', 'revogada']), tokenDaLicenca: z.string().min(20).optional(), intervaloVerificacaoSegundos: z.number().int().min(30).max(3600).default(200), emitidoEm: z.string().datetime() });

export async function POST(requisicao: Request) {
  try {
    const corpoBruto = await requisicao.text();
    const assinatura = requisicao.headers.get('x-assinatura-licenca') ?? '';
    const estadoAtual = await lerEstadoRecebido();
    if (!assinaturaDoSinalEValida(corpoBruto, assinatura, estadoAtual?.segredoDeNotificacao)) return NextResponse.json({ mensagem: 'Assinatura inválida.' }, { status: 401 });
    const recebido = sinal.parse(JSON.parse(corpoBruto));
    const configuracao = configuracaoDoLicenciamento();
    if (recebido.instalacaoId !== configuracao.instalacaoId) return NextResponse.json({ mensagem: 'Sinal destinado a outra instalação.' }, { status: 403 });
    if (Date.now() - new Date(recebido.emitidoEm).getTime() > 5 * 60 * 1000) return NextResponse.json({ mensagem: 'Sinal expirado.' }, { status: 400 });
    const tokenDaLicenca = recebido.tokenDaLicenca ?? estadoAtual?.tokenDaLicenca;
    if (recebido.situacao === 'ativa') {
      if (!tokenDaLicenca) return NextResponse.json({ mensagem: 'Token ausente no sinal de ativação.' }, { status: 400 });
      const validada = await validarTokenDaLicenca(tokenDaLicenca);
      if (validada.conteudo.licencaId !== recebido.licencaId || validada.conteudo.instalacaoId !== recebido.instalacaoId || validada.situacao === 'expirada') return NextResponse.json({ mensagem: 'Token incompatível com o sinal.' }, { status: 403 });
    }
    await salvarEstadoRecebido({ licencaId: recebido.licencaId, instalacaoId: recebido.instalacaoId, situacao: recebido.situacao, intervaloVerificacaoSegundos: recebido.intervaloVerificacaoSegundos, segredoDeNotificacao: estadoAtual?.segredoDeNotificacao, tokenDaLicenca, atualizadoEm: recebido.emitidoEm });
    return NextResponse.json({ recebido: true, situacao: recebido.situacao });
  } catch { return NextResponse.json({ mensagem: 'Sinal inválido.' }, { status: 400 }); }
}

