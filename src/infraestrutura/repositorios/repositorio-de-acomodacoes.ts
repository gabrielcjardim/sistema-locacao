import type { Acomodacao, DadosDaAcomodacao } from '@/dominio/acomodacao';
import { gravarBancoLocal, lerBancoLocal } from '@/infraestrutura/banco/arquivo-local';
import { conexaoPostgres } from '@/infraestrutura/banco/conexao';

export async function listarAcomodacoes(): Promise<Acomodacao[]> {
  const sql = conexaoPostgres();
  if (!sql) return (await lerBancoLocal()).acomodacoes;

  try {
    const linhas = await sql`
      select id, identificacao, tipo, andar_localizacao, capacidade_pessoas,
             valor_base_diaria, situacao, observacoes, criado_em, atualizado_em
      from acomodacoes
      order by identificacao
    `;
    return linhas.map((linha) => ({
      id: linha.id,
      identificacao: linha.identificacao,
      tipo: linha.tipo,
      andarOuLocalizacao: linha.andar_localizacao ?? '',
      capacidadeDePessoas: linha.capacidade_pessoas,
      valorBaseDaDiaria: Number(linha.valor_base_diaria),
      situacao: linha.situacao,
      observacoes: linha.observacoes ?? '',
      criadoEm: linha.criado_em.toISOString(),
      atualizadoEm: linha.atualizado_em.toISOString(),
    })) as Acomodacao[];
  } finally {
    await sql.end();
  }
}

export async function cadastrarAcomodacao(dados: DadosDaAcomodacao): Promise<Acomodacao> {
  const agora = new Date().toISOString();
  const acomodacao: Acomodacao = { id: crypto.randomUUID(), ...dados, criadoEm: agora, atualizadoEm: agora };
  const sql = conexaoPostgres();

  if (!sql) {
    const banco = await lerBancoLocal();
    banco.acomodacoes.push(acomodacao);
    await gravarBancoLocal(banco);
    return acomodacao;
  }

  try {
    const [linha] = await sql`
      insert into acomodacoes (
        id, identificacao, tipo, andar_localizacao, capacidade_pessoas,
        valor_base_diaria, situacao, observacoes
      ) values (
        ${acomodacao.id}, ${dados.identificacao}, ${dados.tipo},
        ${dados.andarOuLocalizacao}, ${dados.capacidadeDePessoas},
        ${dados.valorBaseDaDiaria}, ${dados.situacao}, ${dados.observacoes}
      )
      returning criado_em, atualizado_em
    `;
    return { ...acomodacao, criadoEm: linha.criado_em.toISOString(), atualizadoEm: linha.atualizado_em.toISOString() };
  } finally {
    await sql.end();
  }
}

export async function atualizarAcomodacao(id: string, dados: DadosDaAcomodacao): Promise<Acomodacao> {
  const sql = conexaoPostgres();
  if (!sql) {
    const banco = await lerBancoLocal();
    const indice = banco.acomodacoes.findIndex((item) => item.id === id);
    if (indice < 0) throw new Error('ACOMODACAO_NAO_ENCONTRADA');
    const atualizada: Acomodacao = { ...banco.acomodacoes[indice], ...dados, atualizadoEm: new Date().toISOString() };
    banco.acomodacoes[indice] = atualizada; await gravarBancoLocal(banco); return atualizada;
  }
  try {
    const [linha] = await sql`update acomodacoes set identificacao=${dados.identificacao}, tipo=${dados.tipo}, andar_localizacao=${dados.andarOuLocalizacao}, capacidade_pessoas=${dados.capacidadeDePessoas}, valor_base_diaria=${dados.valorBaseDaDiaria}, situacao=${dados.situacao}, observacoes=${dados.observacoes}, atualizado_em=now() where id=${id} returning criado_em, atualizado_em`;
    if (!linha) throw new Error('ACOMODACAO_NAO_ENCONTRADA');
    return { id, ...dados, criadoEm: linha.criado_em.toISOString(), atualizadoEm: linha.atualizado_em.toISOString() };
  } finally { await sql.end(); }
}
