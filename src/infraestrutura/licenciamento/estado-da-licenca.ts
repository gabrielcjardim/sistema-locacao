import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { conexaoPostgres } from '@/infraestrutura/banco/conexao';

export type SituacaoRecebida = 'ativa' | 'suspensa' | 'revogada';
export interface EstadoRecebidoDaLicenca { licencaId: string; instalacaoId: string; situacao: SituacaoRecebida; intervaloVerificacaoSegundos?: number; segredoDeNotificacao?: string; tokenDaLicenca?: string; atualizadoEm: string }

const pasta = path.join(process.cwd(), '.licenciamento');
const arquivo = path.join(pasta, 'estado-da-licenca.json');

async function garantirEstruturaDaLicenca(sql: NonNullable<ReturnType<typeof conexaoPostgres>>) {
  await sql`create table if not exists licenciamento_estado (
    id smallint primary key check (id = 1),
    dados jsonb not null,
    atualizado_em timestamptz not null default now()
  )`;
}

export async function lerEstadoRecebido() {
  const sql = conexaoPostgres();
  if (sql) {
    try {
      await garantirEstruturaDaLicenca(sql);
      const [linha] = await sql`select dados from licenciamento_estado where id = 1`;
      return linha ? linha.dados as EstadoRecebidoDaLicenca : null;
    } finally {
      await sql.end();
    }
  }
  try { return JSON.parse(await readFile(arquivo, 'utf8')) as EstadoRecebidoDaLicenca; }
  catch (erro) { if ((erro as NodeJS.ErrnoException).code === 'ENOENT') return null; throw erro; }
}

export async function salvarEstadoRecebido(estado: EstadoRecebidoDaLicenca) {
  const sql = conexaoPostgres();
  if (sql) {
    try {
      await garantirEstruturaDaLicenca(sql);
      await sql`insert into licenciamento_estado (id, dados)
        values (1, ${sql.json(JSON.parse(JSON.stringify(estado)))})
        on conflict (id) do update set dados = excluded.dados, atualizado_em = now()`;
    } finally {
      await sql.end();
    }
    return;
  }
  await mkdir(pasta, { recursive: true });
  await writeFile(arquivo, JSON.stringify(estado, null, 2), 'utf8');
}

export function assinaturaDoSinal(corpoBruto: string, segredoRecebido?: string) {
  const segredo = segredoRecebido?.trim() || process.env.LICENCA_SEGREDO_DE_SINAL?.trim();
  if (!segredo || segredo.length < 32) throw new Error('SEGREDO_DE_SINAL_NAO_CONFIGURADO');
  return createHmac('sha256', segredo).update(corpoBruto).digest('base64url');
}

export function assinaturaDoSinalEValida(corpoBruto: string, recebida: string, segredo?: string) {
  const esperada = assinaturaDoSinal(corpoBruto, segredo);
  return recebida.length === esperada.length && timingSafeEqual(Buffer.from(recebida), Buffer.from(esperada));
}

