import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type SituacaoRecebida = 'ativa' | 'suspensa' | 'revogada';
export interface EstadoRecebidoDaLicenca { licencaId: string; instalacaoId: string; situacao: SituacaoRecebida; intervaloVerificacaoSegundos?: number; segredoDeNotificacao?: string; atualizadoEm: string }

const pasta = path.join(process.cwd(), '.licenciamento');
const arquivo = path.join(pasta, 'estado-da-licenca.json');

export async function lerEstadoRecebido() {
  try { return JSON.parse(await readFile(arquivo, 'utf8')) as EstadoRecebidoDaLicenca; }
  catch (erro) { if ((erro as NodeJS.ErrnoException).code === 'ENOENT') return null; throw erro; }
}

export async function salvarEstadoRecebido(estado: EstadoRecebidoDaLicenca) {
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
