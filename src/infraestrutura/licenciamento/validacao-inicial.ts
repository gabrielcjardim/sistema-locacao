import { configuracaoDoLicenciamento } from './configuracao';

export async function validarAtivacaoNaCentral(token: string, urlDeNotificacao: string) {
  const configuracao = configuracaoDoLicenciamento();
  if (!configuracao.urlDeValidacaoInicial) throw new Error('CENTRAL_NAO_CONFIGURADA');
  try {
    const resposta = await fetch(configuracao.urlDeValidacaoInicial, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, sistemaId: configuracao.sistemaId, instalacaoId: configuracao.instalacaoId, urlDeNotificacao }),
      cache: 'no-store', signal: AbortSignal.timeout(5000),
    });
    if (!resposta.ok) throw new Error('LICENCA_RECUSADA_PELA_CENTRAL');
    const resultado = await resposta.json() as { ativa: boolean; situacao: string; intervaloVerificacaoSegundos?: number; segredoDeNotificacao?: string };
    if (!resultado.ativa) throw new Error(`LICENCA_${resultado.situacao.toUpperCase()}`);
    return resultado;
  } catch (erro) {
    if (erro instanceof Error && erro.message.startsWith('LICENCA_')) throw erro;
    throw new Error('CENTRAL_INDISPONIVEL');
  }
}
