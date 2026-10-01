import { gravarBancoLocal, lerBancoLocal } from '@/infraestrutura/banco/arquivo-local';
import { conexaoPostgres } from '@/infraestrutura/banco/conexao';

export interface ConfiguracoesDoSistema { corPrincipal: string; coresRecentes: string[] }

export async function obterConfiguracoes(): Promise<ConfiguracoesDoSistema> {
  const sql = conexaoPostgres();
  if (!sql) return (await lerBancoLocal()).configuracoes;
  try {
    const [linha] = await sql`select cor_principal, cores_recentes from configuracoes_sistema where id=1`;
    return { corPrincipal: linha?.cor_principal ?? '#FF5C00', coresRecentes: (linha?.cores_recentes ?? ['#FF5C00']).slice(0, 5) };
  } finally { await sql.end(); }
}

export async function salvarConfiguracoes(configuracoes: ConfiguracoesDoSistema): Promise<ConfiguracoesDoSistema> {
  const configuracoesLimitadas = { ...configuracoes, coresRecentes: configuracoes.coresRecentes.slice(0, 5) };
  const sql = conexaoPostgres();
  if (!sql) { const banco = await lerBancoLocal(); banco.configuracoes = configuracoesLimitadas; await gravarBancoLocal(banco); return configuracoesLimitadas; }
  try {
    await sql`insert into configuracoes_sistema (id,cor_principal,cores_recentes) values (1,${configuracoesLimitadas.corPrincipal},${sql.json(configuracoesLimitadas.coresRecentes)}) on conflict (id) do update set cor_principal=excluded.cor_principal, cores_recentes=excluded.cores_recentes, atualizado_em=now()`;
    return configuracoesLimitadas;
  } finally { await sql.end(); }
}
