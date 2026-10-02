import { z } from 'zod';

export const esquemaDaReserva = z.object({
  acomodacaoId: z.string().uuid(),
  hospedeResponsavelId: z.string().uuid(),
  dataDeEntrada: z.coerce.date(),
  dataDeSaida: z.coerce.date(),
  horaDeEntrada: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('14:00'),
  horaDeSaida: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('11:00'),
  quantidadeDeHospedes: z.coerce.number().int().positive(),
  valorTotal: z.coerce.number().min(0),
  valorCalculado: z.coerce.number().min(0).default(0),
  ajusteNoValor: z.coerce.number().default(0),
  motivoDoAjuste: z.string().trim().max(300).optional().default(''),
  tipoDeLocacao: z.enum(['diaria', 'semanal', 'mensal', 'personalizada']).default('diaria'),
  situacao: z.enum(['orcamento', 'confirmada', 'em_andamento', 'concluida', 'cancelada']).default('confirmada'),
}).refine(
  (reserva) => combinarDataEHora(reserva.dataDeSaida, reserva.horaDeSaida) > combinarDataEHora(reserva.dataDeEntrada, reserva.horaDeEntrada),
  { message: 'A saída precisa ser posterior à entrada, considerando data e hora.', path: ['dataDeSaida'] },
).refine(
  (reserva) => reserva.ajusteNoValor === 0 || reserva.motivoDoAjuste.length > 0,
  { message: 'Informe o motivo do desconto ou acréscimo.', path: ['motivoDoAjuste'] },
);

export type DadosDaReserva = z.infer<typeof esquemaDaReserva>;

export interface Reserva {
  id: string;
  acomodacaoId: string;
  hospedeResponsavelId: string;
  dataDeEntrada: string;
  dataDeSaida: string;
  horaDeEntrada: string;
  horaDeSaida: string;
  quantidadeDeHospedes: number;
  valorTotal: number;
  valorCalculado: number;
  ajusteNoValor: number;
  motivoDoAjuste: string;
  tipoDeLocacao: DadosDaReserva['tipoDeLocacao'];
  situacao: DadosDaReserva['situacao'];
  ultimaAcao: 'confirmada' | 'alterada' | 'cancelada' | 'concluida';
  resumoDaUltimaAlteracao: string;
  criadoEm: string;
}

export function periodosSeSobrepoem(
  entradaA: Date,
  saidaA: Date,
  entradaB: Date,
  saidaB: Date,
): boolean {
  return entradaA < saidaB && saidaA > entradaB;
}

export function combinarDataEHora(data: Date | string, hora: string): Date {
  const dia = data instanceof Date ? data.toISOString().slice(0, 10) : data.slice(0, 10);
  return new Date(`${dia}T${hora}:00.000Z`);
}
