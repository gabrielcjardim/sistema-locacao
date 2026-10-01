import type { Acomodacao } from '@/dominio/acomodacao';
import type { Hospede } from '@/dominio/hospede';
import type { Reserva } from '@/dominio/reserva';
import type { RegraDePreco } from '@/dominio/regra-de-preco';
import type { BloqueioDeAgenda } from '@/dominio/bloqueio-de-agenda';
import type { Vistoria } from '@/dominio/vistoria';
import type { LancamentoFinanceiro } from '@/dominio/lancamento-financeiro';

export interface BancoLocal {
  acomodacoes: Acomodacao[];
  hospedes: Hospede[];
  reservas: Reserva[];
  regrasDePreco: RegraDePreco[];
  configuracoes: { corPrincipal: string; coresRecentes: string[] };
  bloqueiosDeAgenda: BloqueioDeAgenda[];
  vistorias: Vistoria[];
  lancamentosFinanceiros: LancamentoFinanceiro[];
}
