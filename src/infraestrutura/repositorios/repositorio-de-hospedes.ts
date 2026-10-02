import type { DadosDoHospede, Hospede } from '@/dominio/hospede';
import { gravarBancoLocal, lerBancoLocal } from '@/infraestrutura/banco/arquivo-local';
import { conexaoPostgres } from '@/infraestrutura/banco/conexao';

export async function listarHospedes(): Promise<Hospede[]> {
  const sql = conexaoPostgres();
  if (!sql) return (await lerBancoLocal()).hospedes;
  try {
    const linhas = await sql`select * from hospedes order by nome_completo`;
    return linhas.map((linha) => ({
      id: linha.id, nomeCompleto: linha.nome_completo, cpf: linha.cpf ?? '', telefone: linha.telefone,
      email: linha.email ?? '', observacoes: linha.observacoes ?? '',
      criadoEm: linha.criado_em.toISOString(), atualizadoEm: linha.atualizado_em.toISOString(),
    }));
  } finally { await sql.end(); }
}

export async function cadastrarHospede(dados: DadosDoHospede): Promise<Hospede> {
  const agora = new Date().toISOString();
  const hospede: Hospede = { id: crypto.randomUUID(), ...dados, criadoEm: agora, atualizadoEm: agora };
  const sql = conexaoPostgres();
  if (!sql) {
    const banco = await lerBancoLocal();
    if (dados.cpf && banco.hospedes.some((item) => item.cpf === dados.cpf)) throw new Error('CPF_JA_CADASTRADO');
    banco.hospedes.push(hospede); await gravarBancoLocal(banco); return hospede;
  }
  try {
    await sql`insert into hospedes (id,nome_completo,cpf,telefone,email,observacoes) values (${hospede.id},${dados.nomeCompleto},${dados.cpf || null},${dados.telefone},${dados.email || null},${dados.observacoes})`;
    return hospede;
  } finally { await sql.end(); }
}

export async function atualizarHospede(id: string, dados: DadosDoHospede): Promise<Hospede> {
  const agora = new Date().toISOString();
  const sql = conexaoPostgres();
  if (!sql) {
    const banco = await lerBancoLocal();
    const indice = banco.hospedes.findIndex((item) => item.id === id);
    if (indice < 0) throw new Error('HOSPEDE_NAO_ENCONTRADO');
    if (dados.cpf && banco.hospedes.some((item) => item.id !== id && item.cpf === dados.cpf)) throw new Error('CPF_JA_CADASTRADO');
    const atualizado: Hospede = { ...banco.hospedes[indice], ...dados, atualizadoEm: agora };
    banco.hospedes[indice] = atualizado;
    await gravarBancoLocal(banco);
    return atualizado;
  }
  try {
    const [linha] = await sql`update hospedes set nome_completo=${dados.nomeCompleto}, cpf=${dados.cpf || null}, telefone=${dados.telefone}, email=${dados.email || null}, observacoes=${dados.observacoes}, atualizado_em=now() where id=${id} returning criado_em, atualizado_em`;
    if (!linha) throw new Error('HOSPEDE_NAO_ENCONTRADO');
    return { id, ...dados, criadoEm: linha.criado_em.toISOString(), atualizadoEm: linha.atualizado_em.toISOString() };
  } finally { await sql.end(); }
}

export async function excluirHospede(id: string): Promise<void> {
  const sql = conexaoPostgres();
  if (!sql) {
    const banco = await lerBancoLocal();
    if (banco.reservas.some((item) => item.hospedeResponsavelId === id)) throw new Error('HOSPEDE_COM_RESERVAS');
    const quantidadeAnterior = banco.hospedes.length;
    banco.hospedes = banco.hospedes.filter((item) => item.id !== id);
    if (banco.hospedes.length === quantidadeAnterior) throw new Error('HOSPEDE_NAO_ENCONTRADO');
    await gravarBancoLocal(banco);
    return;
  }
  try {
    const [vinculo] = await sql`select id from reservas where hospede_responsavel_id=${id} limit 1`;
    if (vinculo) throw new Error('HOSPEDE_COM_RESERVAS');
    const removidos = await sql`delete from hospedes where id=${id} returning id`;
    if (!removidos.length) throw new Error('HOSPEDE_NAO_ENCONTRADO');
  } finally { await sql.end(); }
}

