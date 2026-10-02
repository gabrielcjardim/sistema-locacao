import { NextRequest, NextResponse } from 'next/server';
import { nomeDoCookieDaLicenca, validarConfiguracaoDoLicenciamento } from '@/infraestrutura/licenciamento/configuracao';
import { validarTokenDaLicenca } from '@/infraestrutura/licenciamento/token';
import { lerEstadoRecebido, salvarEstadoRecebido } from '@/infraestrutura/licenciamento/estado-da-licenca';
import { validarAtivacaoNaCentral } from '@/infraestrutura/licenciamento/validacao-inicial';

export const runtime = 'nodejs';

export async function POST(requisicao: NextRequest) {
  try {
    validarConfiguracaoDoLicenciamento();
    const { token } = await requisicao.json() as { token?: string };
    const tokenLimpo = token?.trim() ?? '';
    const licenca = await validarTokenDaLicenca(tokenLimpo);
    if (licenca.situacao === 'expirada') return NextResponse.json({ mensagem: 'Esta licença e seu período de tolerância expiraram.' }, { status: 403 });
    const estadoExistente = await lerEstadoRecebido();
    if (estadoExistente?.licencaId === licenca.conteudo.licencaId && estadoExistente.situacao !== 'ativa') return NextResponse.json({ mensagem: `Esta licença está ${estadoExistente.situacao} nesta instalação.` }, { status: 403 });
    const urlDeNotificacao = `${new URL(requisicao.url).origin}/api/licenca/sinal`;
    const validacaoInicial = await validarAtivacaoNaCentral(tokenLimpo, urlDeNotificacao);
    if (!validacaoInicial.segredoDeNotificacao) throw new Error('CENTRAL_NAO_FORNECEU_SEGREDO');
    await salvarEstadoRecebido({ licencaId: licenca.conteudo.licencaId, instalacaoId: licenca.conteudo.instalacaoId, situacao: 'ativa', intervaloVerificacaoSegundos: validacaoInicial.intervaloVerificacaoSegundos ?? 200, segredoDeNotificacao: validacaoInicial.segredoDeNotificacao, atualizadoEm: new Date().toISOString() });
    const resposta = NextResponse.json({ licenca: licenca.conteudo, situacao: licenca.situacao });
    resposta.cookies.set(nomeDoCookieDaLicenca, tokenLimpo, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', expires: new Date(licenca.conteudo.toleranciaAte) });
    return resposta;
  } catch (erro) {
    const codigo = erro instanceof Error ? erro.message : '';
    const mensagem = codigo === 'LICENCA_DE_OUTRA_INSTALACAO' ? 'Este token pertence a outra instalação.' : codigo === 'CONFIGURACAO_DE_LICENCA_INCOMPLETA' ? 'O licenciamento ainda não foi configurado nesta instalação.' : codigo === 'CENTRAL_INDISPONIVEL' ? 'A ativação exige internet e a Central não pôde ser acessada.' : codigo.startsWith('LICENCA_') ? 'A Central recusou esta licença.' : 'Token de licença inválido.';
    return NextResponse.json({ mensagem }, { status: codigo === 'CENTRAL_INDISPONIVEL' ? 503 : 400 });
  }
}
