import postgres from 'postgres';

export type AmbienteDaAplicacao = 'desenvolvimento' | 'producao';

export function obterAmbienteDaAplicacao(): AmbienteDaAplicacao {
  return process.env.AMBIENTE_APLICACAO === 'producao' || process.env.NODE_ENV === 'production'
    ? 'producao'
    : 'desenvolvimento';
}

export function conexaoPostgres() {
  const enderecoDoBanco = process.env.DATABASE_URL?.trim();

  if (!enderecoDoBanco) {
    if (obterAmbienteDaAplicacao() === 'producao') {
      throw new Error(
        'CONFIGURACAO_DE_PRODUCAO_INVALIDA: informe DATABASE_URL para impedir perda de dados.',
      );
    }

    return null;
  }

  return postgres(enderecoDoBanco, {
    max: 1,
    prepare: false,
    connect_timeout: 10,
    idle_timeout: 20,
  });
}

export function obterTipoDePersistencia() {
  return process.env.DATABASE_URL?.trim() ? 'postgresql' : 'arquivo-local';
}
