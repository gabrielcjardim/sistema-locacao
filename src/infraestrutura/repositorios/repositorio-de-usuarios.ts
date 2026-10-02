import { randomBytes, scryptSync } from 'node:crypto';
import type { DadosDeAlteracaoDoUsuario, DadosDeNovoUsuario, UsuarioDoSistema } from '@/dominio/usuario-do-sistema';
import { gravarBancoLocal, lerBancoLocal } from '@/infraestrutura/banco/arquivo-local';
import { conexaoPostgres, garantirEstruturaDoBanco } from '@/infraestrutura/banco/conexao';

function normalizar(usuario: string) { return usuario.trim().toLowerCase(); }
function criarHash(senha: string) { const sal = randomBytes(16).toString('hex'); return `${sal}:${scryptSync(senha, sal, 64).toString('hex')}`; }
function mapear(linha: Record<string, any>): UsuarioDoSistema { return { id: linha.id, nome: linha.nome, usuario: linha.usuario, ativo: linha.ativo, perfil: linha.perfil, criadoEm: linha.criado_em.toISOString(), atualizadoEm: linha.atualizado_em.toISOString() }; }

export async function garantirAdministradorInicial() {
  const usuario = process.env.USUARIO_ADMIN?.trim(); const senhaHash = process.env.SENHA_ADMIN_HASH?.trim();
  if (!usuario || !senhaHash) return;
  const sql = conexaoPostgres();
  if (!sql) return;
  try {
    await garantirEstruturaDoBanco(sql);
    const [{ quantidade }] = await sql`select count(*)::int as quantidade from usuarios_sistema`;
    if (quantidade === 0) await sql`insert into usuarios_sistema (nome,usuario,usuario_normalizado,senha_hash,perfil) values ('Gestor principal',${usuario},${normalizar(usuario)},${senhaHash},'administrador_principal') on conflict (usuario_normalizado) do nothing`;
    await sql`update usuarios_sistema set perfil='administrador_principal' where usuario_normalizado=${normalizar(usuario)}`;
  } finally { await sql.end(); }
}

export async function listarUsuarios(): Promise<UsuarioDoSistema[]> {
  await garantirAdministradorInicial();
  const sql = conexaoPostgres();
  if (!sql) return (await lerBancoLocal()).usuariosDoSistema.map(({ senhaHash: _senha, ...usuario }) => usuario);
  try { return (await sql`select id,nome,usuario,ativo,perfil,criado_em,atualizado_em from usuarios_sistema order by nome`).map(mapear); }
  finally { await sql.end(); }
}

export async function cadastrarUsuario(dados: DadosDeNovoUsuario): Promise<UsuarioDoSistema> {
  const agora = new Date().toISOString(); const id = crypto.randomUUID(); const senhaHash = criarHash(dados.senha); const usuarioNormalizado = normalizar(dados.usuario);
  const sql = conexaoPostgres();
  if (!sql) { const banco = await lerBancoLocal(); if (banco.usuariosDoSistema.some((item) => normalizar(item.usuario) === usuarioNormalizado)) throw new Error('USUARIO_JA_EXISTE'); const salvo = { id, nome: dados.nome, usuario: dados.usuario, ativo: dados.ativo, perfil: dados.perfil, criadoEm: agora, atualizadoEm: agora, senhaHash }; banco.usuariosDoSistema.push(salvo); await gravarBancoLocal(banco); const { senhaHash: _senha, ...publico } = salvo; return publico; }
  try { await garantirEstruturaDoBanco(sql); const [linha] = await sql`insert into usuarios_sistema (id,nome,usuario,usuario_normalizado,senha_hash,ativo,perfil) values (${id},${dados.nome},${dados.usuario},${usuarioNormalizado},${senhaHash},${dados.ativo},${dados.perfil}) returning id,nome,usuario,ativo,perfil,criado_em,atualizado_em`; return mapear(linha); }
  catch (erro) { if ((erro as { code?: string }).code === '23505') throw new Error('USUARIO_JA_EXISTE'); throw erro; }
  finally { await sql.end(); }
}

export async function atualizarUsuario(id: string, dados: DadosDeAlteracaoDoUsuario, usuarioAtual: string, perfilAtual: 'administrador_principal' | 'administrador' | 'operador'): Promise<UsuarioDoSistema> {
  if (dados.senha && dados.senha.length < 10) throw new Error('SENHA_CURTA');
  const sql = conexaoPostgres(); const usuarioNormalizado = normalizar(dados.usuario);
  if (!sql) { const banco = await lerBancoLocal(); const indice = banco.usuariosDoSistema.findIndex((item) => item.id === id); if (indice < 0) throw new Error('USUARIO_NAO_ENCONTRADO'); const atual = banco.usuariosDoSistema[indice]; if ((atual.perfil === 'administrador_principal' && perfilAtual !== 'administrador_principal') || (dados.perfil === 'administrador_principal' && atual.perfil !== 'administrador_principal')) throw new Error('ADMINISTRADOR_PROTEGIDO'); if (!dados.ativo && normalizar(atual.usuario) === normalizar(usuarioAtual)) throw new Error('NAO_PODE_INATIVAR_A_SI_MESMO'); if (banco.usuariosDoSistema.some((item) => item.id !== id && normalizar(item.usuario) === usuarioNormalizado)) throw new Error('USUARIO_JA_EXISTE'); banco.usuariosDoSistema[indice] = { ...atual, nome: dados.nome, usuario: dados.usuario, ativo: dados.ativo, perfil: dados.perfil, senhaHash: dados.senha ? criarHash(dados.senha) : atual.senhaHash, atualizadoEm: new Date().toISOString() }; await gravarBancoLocal(banco); const { senhaHash: _senha, ...publico } = banco.usuariosDoSistema[indice]; return publico; }
  try { const [atual] = await sql`select usuario,perfil from usuarios_sistema where id=${id}`; if (!atual) throw new Error('USUARIO_NAO_ENCONTRADO'); if ((atual.perfil === 'administrador_principal' && perfilAtual !== 'administrador_principal') || (dados.perfil === 'administrador_principal' && atual.perfil !== 'administrador_principal')) throw new Error('ADMINISTRADOR_PROTEGIDO'); if (!dados.ativo && normalizar(atual.usuario) === normalizar(usuarioAtual)) throw new Error('NAO_PODE_INATIVAR_A_SI_MESMO'); const senhaHash = dados.senha ? criarHash(dados.senha) : null; const [linha] = await sql`update usuarios_sistema set nome=${dados.nome},usuario=${dados.usuario},usuario_normalizado=${usuarioNormalizado},ativo=${dados.ativo},perfil=${dados.perfil},senha_hash=coalesce(${senhaHash},senha_hash),atualizado_em=now() where id=${id} returning id,nome,usuario,ativo,perfil,criado_em,atualizado_em`; return mapear(linha); }
  catch (erro) { if ((erro as { code?: string }).code === '23505') throw new Error('USUARIO_JA_EXISTE'); throw erro; }
  finally { await sql.end(); }
}

export async function obterUsuarioParaAutenticacao(usuario: string) {
  await garantirAdministradorInicial(); const normalizado = normalizar(usuario); const sql = conexaoPostgres();
  if (!sql) { const encontrado = (await lerBancoLocal()).usuariosDoSistema.find((item) => normalizar(item.usuario) === normalizado); return encontrado ? { usuario: encontrado.usuario, senhaHash: encontrado.senhaHash, ativo: encontrado.ativo, perfil: encontrado.perfil ?? 'operador' as const } : null; }
  try { const [linha] = await sql`select usuario,senha_hash,ativo,perfil from usuarios_sistema where usuario_normalizado=${normalizado}`; return linha ? { usuario: linha.usuario as string, senhaHash: linha.senha_hash as string, ativo: linha.ativo as boolean, perfil: linha.perfil as 'administrador_principal' | 'administrador' | 'operador' } : null; }
  finally { await sql.end(); }
}
