import { z } from 'zod';

export interface UsuarioDoSistema {
  id: string;
  nome: string;
  usuario: string;
  ativo: boolean;
  perfil: 'administrador_principal' | 'administrador' | 'operador';
  criadoEm: string;
  atualizadoEm: string;
}

export const esquemaDeNovoUsuario = z.object({
  nome: z.string().trim().min(2).max(120),
  usuario: z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9._-]+$/),
  senha: z.string().min(10).max(200),
  ativo: z.boolean().default(true),
  perfil: z.enum(['administrador_principal', 'administrador', 'operador']).default('operador'),
});

export const esquemaDeAlteracaoDoUsuario = z.object({
  nome: z.string().trim().min(2).max(120),
  usuario: z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9._-]+$/),
  senha: z.string().max(200).optional().default(''),
  ativo: z.boolean(),
  perfil: z.enum(['administrador_principal', 'administrador', 'operador']),
});

export const esquemaDaPropriaConta = z.object({
  nome: z.string().trim().min(2).max(120),
  senha: z.string().max(200).optional().default(''),
}).refine((dados) => !dados.senha || dados.senha.length >= 10, { message: 'A nova senha deve ter pelo menos 10 caracteres.', path: ['senha'] });

export type DadosDeNovoUsuario = z.infer<typeof esquemaDeNovoUsuario>;
export type DadosDeAlteracaoDoUsuario = z.infer<typeof esquemaDeAlteracaoDoUsuario>;
export type DadosDaPropriaConta = z.infer<typeof esquemaDaPropriaConta>;

