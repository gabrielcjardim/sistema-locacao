import { z } from 'zod';

export const esquemaDoBloqueio = z.object({
  acomodacaoId: z.string().uuid(),
  dataInicial: z.coerce.date(),
  dataFinal: z.coerce.date(),
  motivo: z.string().trim().min(1, 'Informe o motivo.').max(200),
}).refine((item) => item.dataFinal >= item.dataInicial, { message: 'A data final deve ser igual ou posterior à inicial.', path: ['dataFinal'] });

export type DadosDoBloqueio = z.infer<typeof esquemaDoBloqueio>;
export interface BloqueioDeAgenda { id: string; acomodacaoId: string; dataInicial: string; dataFinal: string; motivo: string; criadoEm: string }
