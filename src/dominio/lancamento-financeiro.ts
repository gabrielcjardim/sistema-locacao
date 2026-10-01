import { z } from 'zod';

export const esquemaDoLancamentoFinanceiro = z.object({
  tipo: z.enum(['receita', 'despesa']),
  descricao: z.string().trim().min(1, 'Informe a descrição.').max(180),
  categoria: z.string().trim().min(1, 'Informe a categoria.').max(100),
  valor: z.coerce.number().positive('O valor precisa ser maior que zero.'),
  dataDeVencimento: z.coerce.date(),
  dataDePagamento: z.coerce.date().nullable().optional().default(null),
  situacao: z.enum(['pendente', 'pago', 'cancelado']).default('pendente'),
  reservaId: z.string().uuid().nullable().optional().default(null),
  observacoes: z.string().trim().max(1000).default(''),
});

export type DadosDoLancamentoFinanceiro = z.infer<typeof esquemaDoLancamentoFinanceiro>;
export interface LancamentoFinanceiro extends Omit<DadosDoLancamentoFinanceiro, 'dataDeVencimento' | 'dataDePagamento'> { id: string; dataDeVencimento: string; dataDePagamento: string | null; criadoEm: string }
