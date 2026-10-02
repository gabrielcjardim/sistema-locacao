export const nomeDoCookieDaLicenca = 'licenca_meus_aptos';

export function licenciamentoObrigatorio() {
  return process.env.LICENCIAMENTO_ATIVO === 'true';
}

export function configuracaoDoLicenciamento() {
  const intervaloInformado = Number(process.env.LICENCA_INTERVALO_VERIFICACAO_SEGUNDOS ?? '200');
  return {
    sistemaId: process.env.LICENCA_SISTEMA_ID?.trim() ?? '',
    instalacaoId: process.env.LICENCA_INSTALACAO_ID?.trim() ?? '',
    chavePublica: process.env.LICENCA_CHAVE_PUBLICA?.trim() ?? '',
    urlDeValidacaoInicial: process.env.LICENCA_VALIDACAO_INICIAL_URL?.trim() ?? '',
    intervaloDeVerificacaoSegundos: Number.isFinite(intervaloInformado) ? Math.min(3600, Math.max(30, Math.trunc(intervaloInformado))) : 200,
  };
}

export function validarConfiguracaoDoLicenciamento() {
  if (!licenciamentoObrigatorio()) return;
  const configuracao = configuracaoDoLicenciamento();
  if (!configuracao.sistemaId || !configuracao.instalacaoId || !configuracao.chavePublica || !configuracao.urlDeValidacaoInicial) throw new Error('CONFIGURACAO_DE_LICENCA_INCOMPLETA');
}
