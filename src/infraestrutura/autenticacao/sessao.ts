import { createHash, createHmac, scryptSync, timingSafeEqual } from 'node:crypto';

export const nomeDoCookieDaSessao = 'sessao_meus_aptos';
export const duracaoDaSessaoEmSegundos = 60 * 60 * 12;

interface ConteudoDaSessao {
  usuario: string;
  expiraEm: number;
}

function compararComTempoConstante(valorA: string, valorB: string) {
  const resumoA = createHash('sha256').update(valorA).digest();
  const resumoB = createHash('sha256').update(valorB).digest();
  return timingSafeEqual(resumoA, resumoB);
}

function obterSegredoDaSessao() {
  const segredo = process.env.SEGREDO_DA_SESSAO?.trim();
  if (!segredo || segredo.length < 32) {
    throw new Error('SEGREDO_DA_SESSAO deve possuir pelo menos 32 caracteres.');
  }
  return segredo;
}

export function autenticacaoObrigatoria() {
  return process.env.AUTENTICACAO_OBRIGATORIA === 'true' || process.env.NODE_ENV === 'production';
}

export function validarConfiguracaoDaAutenticacao() {
  if (!autenticacaoObrigatoria()) return;
  if (!process.env.USUARIO_ADMIN?.trim()) throw new Error('USUARIO_ADMIN não configurado.');
  const senhaConfigurada = process.env.SENHA_ADMIN_HASH?.trim();
  if (!senhaConfigurada || !senhaConfigurada.includes(':')) throw new Error('SENHA_ADMIN_HASH não configurado.');
  obterSegredoDaSessao();
}

export function senhaConfereComHash(senha: string, senhaHash: string) {
  const [sal, hashEsperado] = senhaHash.trim().split(':');
  if (!sal || !hashEsperado) return false;
  const hashInformado = scryptSync(senha, sal, 64).toString('hex');
  return compararComTempoConstante(hashInformado, hashEsperado);
}

export function criarTokenDaSessao(usuario: string) {
  const conteudo: ConteudoDaSessao = {
    usuario: usuario.trim().toLowerCase(),
    expiraEm: Date.now() + duracaoDaSessaoEmSegundos * 1000,
  };
  const dados = Buffer.from(JSON.stringify(conteudo)).toString('base64url');
  const assinatura = createHmac('sha256', obterSegredoDaSessao()).update(dados).digest('base64url');
  return `${dados}.${assinatura}`;
}

export function tokenDaSessaoEValido(token: string | undefined) {
  if (!token) return false;
  try {
    const [dados, assinaturaRecebida] = token.split('.');
    if (!dados || !assinaturaRecebida) return false;
    const assinaturaEsperada = createHmac('sha256', obterSegredoDaSessao()).update(dados).digest('base64url');
    if (!compararComTempoConstante(assinaturaRecebida, assinaturaEsperada)) return false;
    const conteudo = JSON.parse(Buffer.from(dados, 'base64url').toString('utf8')) as ConteudoDaSessao;
    return Boolean(conteudo.usuario) && conteudo.expiraEm > Date.now();
  } catch {
    return false;
  }
}

export function obterUsuarioDaSessao(token: string | undefined) {
  if (!tokenDaSessaoEValido(token)) return null;
  try { return (JSON.parse(Buffer.from(token!.split('.')[0], 'base64url').toString('utf8')) as ConteudoDaSessao).usuario; }
  catch { return null; }
}
