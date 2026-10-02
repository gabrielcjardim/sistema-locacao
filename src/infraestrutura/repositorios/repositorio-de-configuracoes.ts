import { gravarBancoLocal, lerBancoLocal } from '@/infraestrutura/banco/arquivo-local';
import { conexaoPostgres, garantirEstruturaDoBanco } from '@/infraestrutura/banco/conexao';
import { modeloPadraoDaMensagemWhatsapp, modeloPadraoDaMensagemWhatsappCancelamento, modeloPadraoDaMensagemWhatsappConclusao, type ConfiguracoesDoSistema } from '@/dominio/configuracoes-do-sistema';

export async function obterConfiguracoes(): Promise<ConfiguracoesDoSistema> {
  const sql = conexaoPostgres();
  if (!sql) return (await lerBancoLocal()).configuracoes;
  try {
    await garantirEstruturaDoBanco(sql);
    const [linha] = await sql`select cor_principal, cores_recentes, modelo_mensagem_whatsapp, modelo_mensagem_whatsapp_conclusao, modelo_mensagem_whatsapp_cancelamento from configuracoes_sistema where id=1`;
    return { corPrincipal: linha?.cor_principal ?? '#FF5C00', coresRecentes: (linha?.cores_recentes ?? ['#FF5C00']).slice(0, 5), modeloDaMensagemWhatsapp: linha?.modelo_mensagem_whatsapp ?? modeloPadraoDaMensagemWhatsapp, modeloDaMensagemWhatsappConclusao: linha?.modelo_mensagem_whatsapp_conclusao ?? modeloPadraoDaMensagemWhatsappConclusao, modeloDaMensagemWhatsappCancelamento: linha?.modelo_mensagem_whatsapp_cancelamento ?? modeloPadraoDaMensagemWhatsappCancelamento };
  } finally { await sql.end(); }
}

export async function salvarConfiguracoes(configuracoes: ConfiguracoesDoSistema): Promise<ConfiguracoesDoSistema> {
  const configuracoesLimitadas = { ...configuracoes, coresRecentes: configuracoes.coresRecentes.slice(0, 5) };
  const sql = conexaoPostgres();
  if (!sql) { const banco = await lerBancoLocal(); banco.configuracoes = configuracoesLimitadas; await gravarBancoLocal(banco); return configuracoesLimitadas; }
  try {
    await garantirEstruturaDoBanco(sql);
    await sql`insert into configuracoes_sistema (id,cor_principal,cores_recentes,modelo_mensagem_whatsapp,modelo_mensagem_whatsapp_conclusao,modelo_mensagem_whatsapp_cancelamento) values (1,${configuracoesLimitadas.corPrincipal},${sql.json(configuracoesLimitadas.coresRecentes)},${configuracoesLimitadas.modeloDaMensagemWhatsapp},${configuracoesLimitadas.modeloDaMensagemWhatsappConclusao},${configuracoesLimitadas.modeloDaMensagemWhatsappCancelamento}) on conflict (id) do update set cor_principal=excluded.cor_principal, cores_recentes=excluded.cores_recentes, modelo_mensagem_whatsapp=excluded.modelo_mensagem_whatsapp, modelo_mensagem_whatsapp_conclusao=excluded.modelo_mensagem_whatsapp_conclusao, modelo_mensagem_whatsapp_cancelamento=excluded.modelo_mensagem_whatsapp_cancelamento, atualizado_em=now()`;
    return configuracoesLimitadas;
  } finally { await sql.end(); }
}
