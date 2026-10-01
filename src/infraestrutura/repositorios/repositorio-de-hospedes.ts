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
