import type { DadosDaRegraDePreco, RegraDePreco } from '@/dominio/regra-de-preco';
import { gravarBancoLocal, lerBancoLocal } from '@/infraestrutura/banco/arquivo-local';
import { conexaoPostgres } from '@/infraestrutura/banco/conexao';

function sobrepoe(inicioA: Date, fimA: Date, inicioB: Date, fimB: Date) { return inicioA <= fimB && fimA >= inicioB; }

export async function listarRegrasDePreco(): Promise<RegraDePreco[]> {
  const sql = conexaoPostgres();
  if (!sql) return (await lerBancoLocal()).regrasDePreco;
  try {
    const linhas = await sql`select * from regras_de_preco order by data_inicial desc, nome`;
    return linhas.map((linha) => ({ id: linha.id, nome: linha.nome, dataInicial: linha.data_inicial.toISOString(), dataFinal: linha.data_final.toISOString(), valorDaDiaria: Number(linha.valor_diaria), acomodacaoId: linha.acomodacao_id, ativa: linha.ativa, criadoEm: linha.criado_em.toISOString() }));
  } finally { await sql.end(); }
}

export async function cadastrarRegraDePreco(dados: DadosDaRegraDePreco): Promise<RegraDePreco> {
  const sql = conexaoPostgres();
  if (!sql) {
    const banco = await lerBancoLocal();
    const conflito = banco.regrasDePreco.some((item) => item.ativa && item.acomodacaoId === dados.acomodacaoId && sobrepoe(dados.dataInicial, dados.dataFinal, new Date(item.dataInicial), new Date(item.dataFinal)));
    if (conflito) throw new Error('PERIODO_SOBREPOSTO');
    if (dados.acomodacaoId && !banco.acomodacoes.some((item) => item.id === dados.acomodacaoId)) throw new Error('ACOMODACAO_NAO_ENCONTRADA');
    const regra: RegraDePreco = { id: crypto.randomUUID(), nome: dados.nome, dataInicial: dados.dataInicial.toISOString(), dataFinal: dados.dataFinal.toISOString(), valorDaDiaria: dados.valorDaDiaria, acomodacaoId: dados.acomodacaoId, ativa: dados.ativa, criadoEm: new Date().toISOString() };
    banco.regrasDePreco.push(regra); await gravarBancoLocal(banco); return regra;
  }
  try {
    const [conflito] = await sql`select id from regras_de_preco where ativa=true and acomodacao_id is not distinct from ${dados.acomodacaoId} and data_inicial<=${dados.dataFinal} and data_final>=${dados.dataInicial} limit 1`;
    if (conflito) throw new Error('PERIODO_SOBREPOSTO');
    const id = crypto.randomUUID();
    const [linha] = await sql`insert into regras_de_preco (id,nome,data_inicial,data_final,valor_diaria,acomodacao_id,ativa) values (${id},${dados.nome},${dados.dataInicial},${dados.dataFinal},${dados.valorDaDiaria},${dados.acomodacaoId},${dados.ativa}) returning criado_em`;
    return { id, nome: dados.nome, dataInicial: dados.dataInicial.toISOString(), dataFinal: dados.dataFinal.toISOString(), valorDaDiaria: dados.valorDaDiaria, acomodacaoId: dados.acomodacaoId, ativa: dados.ativa, criadoEm: linha.criado_em.toISOString() };
  } finally { await sql.end(); }
}
