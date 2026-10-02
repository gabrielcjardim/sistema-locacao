import type { Acomodacao, DadosDaAcomodacao } from '@/dominio/acomodacao';
import { gravarBancoLocal, lerBancoLocal } from '@/infraestrutura/banco/arquivo-local';
import { conexaoPostgres } from '@/infraestrutura/banco/conexao';

const ordenadorNatural = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
function ordenarPorIdentificacao(acomodacoes: Acomodacao[]) {
  return acomodacoes.sort((a, b) => ordenadorNatural.compare(a.identificacao, b.identificacao));
}

export async function listarAcomodacoes(): Promise<Acomodacao[]> {
  const sql = conexaoPostgres();
  if (!sql) return ordenarPorIdentificacao([...(await lerBancoLocal()).acomodacoes]);

  try {
    const linhas = await sql`
      select id, identificacao, tipo, andar_localizacao, capacidade_pessoas, numero_quartos,
             valor_base_diaria, situacao, observacoes, criado_em, atualizado_em
      from acomodacoes
      order by identificacao
    `;
    return ordenarPorIdentificacao(linhas.map((linha) => ({
      id: linha.id,
      identificacao: linha.identificacao,
      tipo: linha.tipo,
      andarOuLocalizacao: linha.andar_localizacao ?? '',
      capacidadeDePessoas: linha.capacidade_pessoas,
      numeroDeQuartos: linha.numero_quartos,
      valorBaseDaDiaria: Number(linha.valor_base_diaria),
      situacao: linha.situacao,
      observacoes: linha.observacoes ?? '',
      criadoEm: linha.criado_em.toISOString(),
      atualizadoEm: linha.atualizado_em.toISOString(),
    })) as Acomodacao[]);
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
        id, identificacao, tipo, andar_localizacao, capacidade_pessoas, numero_quartos,
        valor_base_diaria, situacao, observacoes
      ) values (
        ${acomodacao.id}, ${dados.identificacao}, ${dados.tipo},
        ${dados.andarOuLocalizacao}, ${dados.capacidadeDePessoas}, ${dados.numeroDeQuartos},
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
    const [linha] = await sql`update acomodacoes set identificacao=${dados.identificacao}, tipo=${dados.tipo}, andar_localizacao=${dados.andarOuLocalizacao}, capacidade_pessoas=${dados.capacidadeDePessoas}, numero_quartos=${dados.numeroDeQuartos}, valor_base_diaria=${dados.valorBaseDaDiaria}, situacao=${dados.situacao}, observacoes=${dados.observacoes}, atualizado_em=now() where id=${id} returning criado_em, atualizado_em`;
    if (!linha) throw new Error('ACOMODACAO_NAO_ENCONTRADA');
    return { id, ...dados, criadoEm: linha.criado_em.toISOString(), atualizadoEm: linha.atualizado_em.toISOString() };
  } finally { await sql.end(); }
}

export async function removerAcomodacao(id: string): Promise<void> {
  const sql = conexaoPostgres();
  if (!sql) {
    const banco = await lerBancoLocal();
    if (!banco.acomodacoes.some((item) => item.id === id)) throw new Error('ACOMODACAO_NAO_ENCONTRADA');
    const possuiVinculo = banco.reservas.some((item) => item.acomodacaoId === id) || banco.bloqueiosDeAgenda.some((item) => item.acomodacaoId === id) || banco.vistorias.some((item) => item.acomodacaoId === id) || banco.regrasDePreco.some((item) => item.acomodacaoId === id);
    if (possuiVinculo) throw new Error('ACOMODACAO_COM_HISTORICO');
    banco.acomodacoes = banco.acomodacoes.filter((item) => item.id !== id); await gravarBancoLocal(banco); return;
  }
  try {
    const [vinculos] = await sql`select (exists(select 1 from reservas where acomodacao_id=${id}) or exists(select 1 from bloqueios_agenda where acomodacao_id=${id}) or exists(select 1 from vistorias where acomodacao_id=${id}) or exists(select 1 from regras_de_preco where acomodacao_id=${id})) as possui`;
    if (vinculos?.possui) throw new Error('ACOMODACAO_COM_HISTORICO');
    const resultado = await sql`delete from acomodacoes where id=${id}`;
    if (resultado.count === 0) throw new Error('ACOMODACAO_NAO_ENCONTRADA');
  } finally { await sql.end(); }
}
