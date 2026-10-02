import { configuracaoDoLicenciamento } from './configuracao';

export interface ConteudoDaLicenca {
  versao: 1;
  licencaId: string;
  sistemaId: string;
  clienteId: string;
  instalacaoId: string;
  clienteNome: string;
  emitidaEm: string;
  validaAte: string;
  toleranciaAte: string;
}

export type SituacaoDaLicenca = 'ativa' | 'tolerancia' | 'expirada' | 'invalida';

function bytesDeBase64Url(valor: string) {
  const base64 = valor.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(valor.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(base64), (caractere) => caractere.charCodeAt(0));
  const canonico = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  if (canonico !== valor) throw new Error('LICENCA_INVALIDA');
  return bytes;
}

function textoDeBase64Url(valor: string) {
  return new TextDecoder().decode(bytesDeBase64Url(valor));
}

export async function validarTokenDaLicenca(token: string): Promise<{ conteudo: ConteudoDaLicenca; situacao: SituacaoDaLicenca }> {
  const [conteudoCodificado, assinaturaCodificada, sobra] = token.split('.');
  if (!conteudoCodificado || !assinaturaCodificada || sobra) throw new Error('LICENCA_INVALIDA');
  const { sistemaId, instalacaoId, chavePublica } = configuracaoDoLicenciamento();
  const chave = await crypto.subtle.importKey('spki', bytesDeBase64Url(chavePublica), { name: 'Ed25519' }, false, ['verify']);
  const valida = await crypto.subtle.verify({ name: 'Ed25519' }, chave, bytesDeBase64Url(assinaturaCodificada), new TextEncoder().encode(conteudoCodificado));
  if (!valida) throw new Error('LICENCA_INVALIDA');
  const conteudo = JSON.parse(textoDeBase64Url(conteudoCodificado)) as ConteudoDaLicenca;
  if (conteudo.versao !== 1 || conteudo.sistemaId !== sistemaId || conteudo.instalacaoId !== instalacaoId) throw new Error('LICENCA_DE_OUTRA_INSTALACAO');
  const agora = Date.now();
  const validaAte = new Date(conteudo.validaAte).getTime();
  const toleranciaAte = new Date(conteudo.toleranciaAte).getTime();
  const situacao: SituacaoDaLicenca = agora <= validaAte ? 'ativa' : agora <= toleranciaAte ? 'tolerancia' : 'expirada';
  return { conteudo, situacao };
}
