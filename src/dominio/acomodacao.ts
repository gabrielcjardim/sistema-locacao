import { z } from 'zod';

export const situacoesDaAcomodacao = [
  'disponivel', 'ocupada', 'limpeza', 'manutencao', 'inativa',
] as const;

export const esquemaDaAcomodacao = z.object({
  identificacao: z.string().trim().min(1, 'Informe a identificação.').max(100),
  tipo: z.string().trim().min(1, 'Informe o tipo.').max(50),
  andarOuLocalizacao: z.string().trim().max(100).optional().default(''),
  capacidadeDePessoas: z.coerce.number().int().positive('A capacidade deve ser maior que zero.'),
  numeroDeQuartos: z.coerce.number().int().positive('O número de quartos deve ser maior que zero.'),
  valorBaseDaDiaria: z.coerce.number().min(0, 'O valor não pode ser negativo.'),
  situacao: z.enum(situacoesDaAcomodacao).default('disponivel'),
  observacoes: z.string().trim().max(1000).optional().default(''),
});

export type DadosDaAcomodacao = z.infer<typeof esquemaDaAcomodacao>;

export interface Acomodacao extends DadosDaAcomodacao {
  id: string;
  criadoEm: string;
  atualizadoEm: string;
}
