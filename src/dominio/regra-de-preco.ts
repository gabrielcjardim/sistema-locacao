import { z } from 'zod';

export const esquemaDaRegraDePreco = z.object({
  nome: z.string().trim().min(1, 'Informe um nome para o período.').max(100),
  dataInicial: z.coerce.date(),
  dataFinal: z.coerce.date(),
  valorDaDiaria: z.coerce.number().positive('O valor da diária deve ser maior que zero.'),
  acomodacaoId: z.string().uuid().nullable().default(null),
  ativa: z.coerce.boolean().default(true),
}).refine((regra) => regra.dataFinal >= regra.dataInicial, { message: 'A data final deve ser igual ou posterior à inicial.', path: ['dataFinal'] });

export type DadosDaRegraDePreco = z.infer<typeof esquemaDaRegraDePreco>;

export interface RegraDePreco {
  id: string;
  nome: string;
  dataInicial: string;
  dataFinal: string;
  valorDaDiaria: number;
  acomodacaoId: string | null;
  ativa: boolean;
  criadoEm: string;
}
