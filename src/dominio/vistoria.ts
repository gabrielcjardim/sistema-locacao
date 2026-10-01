import { z } from 'zod';

export const esquemaDoItemDaVistoria = z.object({
  nome: z.string().trim().min(1).max(100),
  conforme: z.boolean(),
  observacao: z.string().trim().max(300).default(''),
});

export const esquemaDaVistoria = z.object({
  reservaId: z.string().uuid(),
  acomodacaoId: z.string().uuid(),
  tipo: z.enum(['entrada', 'saida']),
  dataDaVistoria: z.coerce.date(),
  responsavel: z.string().trim().min(1, 'Informe o responsável.').max(120),
  itens: z.array(esquemaDoItemDaVistoria).min(1, 'Inclua ao menos um item.'),
  observacoes: z.string().trim().max(1000).default(''),
  situacao: z.enum(['pendente', 'concluida']).default('pendente'),
});

export type DadosDaVistoria = z.infer<typeof esquemaDaVistoria>;
export interface Vistoria extends Omit<DadosDaVistoria, 'dataDaVistoria'> { id: string; dataDaVistoria: string; criadoEm: string }
