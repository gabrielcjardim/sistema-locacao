import { z } from 'zod';

export interface UsuarioDoSistema {
  id: string;
  nome: string;
  usuario: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export const esquemaDeNovoUsuario = z.object({
  nome: z.string().trim().min(2).max(120),
  usuario: z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9._-]+$/),
  senha: z.string().min(10).max(200),
  ativo: z.boolean().default(true),
});

export const esquemaDeAlteracaoDoUsuario = z.object({
  nome: z.string().trim().min(2).max(120),
  usuario: z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9._-]+$/),
  senha: z.string().max(200).optional().default(''),
  ativo: z.boolean(),
});

export type DadosDeNovoUsuario = z.infer<typeof esquemaDeNovoUsuario>;
export type DadosDeAlteracaoDoUsuario = z.infer<typeof esquemaDeAlteracaoDoUsuario>;
