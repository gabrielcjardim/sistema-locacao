import { z } from 'zod';

export const esquemaDoHospede = z.object({
  nomeCompleto: z.string().trim().min(3, 'Informe o nome completo.').max(180),
  cpf: z.string().trim().max(14).optional().default(''),
  telefone: z.string().trim().min(8, 'Informe um telefone válido.').max(30),
  email: z.string().trim().email('Informe um e-mail válido.').or(z.literal('')).optional().default(''),
  observacoes: z.string().trim().max(1000).optional().default(''),
});

export type DadosDoHospede = z.infer<typeof esquemaDoHospede>;

export interface Hospede extends DadosDoHospede {
  id: string;
  criadoEm: string;
  atualizadoEm: string;
}
