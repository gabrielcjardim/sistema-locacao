import type { DadosDaReserva, Reserva } from '@/dominio/reserva';
import { combinarDataEHora, periodosSeSobrepoem } from '@/dominio/reserva';
import { gravarBancoLocal, lerBancoLocal } from '@/infraestrutura/banco/arquivo-local';
import { conexaoPostgres } from '@/infraestrutura/banco/conexao';

function definirAcaoEAlteracoes(anterior: Reserva, dados: DadosDaReserva) {
  if (dados.situacao === 'cancelada' && anterior.situacao !== 'cancelada') return { ultimaAcao: 'cancelada' as const, resumoDaUltimaAlteracao: '' };
  if (dados.situacao === 'concluida' && anterior.situacao !== 'concluida') return { ultimaAcao: 'concluida' as const, resumoDaUltimaAlteracao: '' };
  const mudancas: string[] = [];
  const dataAnteriorDeEntrada = anterior.dataDeEntrada.slice(0, 10); const dataAnteriorDeSaida = anterior.dataDeSaida.slice(0, 10);
  const novaDataDeEntrada = dados.dataDeEntrada.toISOString().slice(0, 10); const novaDataDeSaida = dados.dataDeSaida.toISOString().slice(0, 10);
  const formatarData = (data: string) => data.split('-').reverse().join('/');
  if (dataAnteriorDeEntrada !== novaDataDeEntrada || anterior.horaDeEntrada !== dados.horaDeEntrada) mudancas.push(`Entrada: ${formatarData(novaDataDeEntrada)} às ${dados.horaDeEntrada}`);
  if (dataAnteriorDeSaida !== novaDataDeSaida || anterior.horaDeSaida !== dados.horaDeSaida) mudancas.push(`Saída: ${formatarData(novaDataDeSaida)} às ${dados.horaDeSaida}`);
  if (anterior.acomodacaoId !== dados.acomodacaoId) mudancas.push('Acomodação alterada');
  if (anterior.quantidadeDeHospedes !== dados.quantidadeDeHospedes) mudancas.push(`Hóspedes: ${dados.quantidadeDeHospedes}`);
  if (anterior.valorTotal !== dados.valorTotal) mudancas.push(`Valor total: ${dados.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
  if (anterior.situacao !== dados.situacao) mudancas.push(`Situação: ${dados.situacao.replace('_', ' ')}`);
  return mudancas.length ? { ultimaAcao: 'alterada' as const, resumoDaUltimaAlteracao: mudancas.join('\n') } : { ultimaAcao: anterior.ultimaAcao, resumoDaUltimaAlteracao: anterior.resumoDaUltimaAlteracao };
}

export async function listarReservas(): Promise<Reserva[]> {
  const sql = conexaoPostgres();
  if (!sql) return (await lerBancoLocal()).reservas;
  try {
    const linhas = await sql`select * from reservas order by data_entrada desc`;
    return linhas.map((linha) => ({
      id: linha.id, acomodacaoId: linha.acomodacao_id, hospedeResponsavelId: linha.hospede_responsavel_id,
      dataDeEntrada: linha.data_entrada.toISOString(), dataDeSaida: linha.data_saida.toISOString(),
      horaDeEntrada: linha.hora_entrada ?? '14:00', horaDeSaida: linha.hora_saida ?? '11:00',
      quantidadeDeHospedes: linha.quantidade_hospedes,
      valorCalculado: Number(linha.valor_calculado ?? linha.valor_total),
      ajusteNoValor: Number(linha.ajuste_valor ?? 0),
      motivoDoAjuste: linha.motivo_ajuste ?? '',
      valorTotal: Number(linha.valor_total),
      tipoDeLocacao: linha.tipo_locacao, situacao: linha.situacao, ultimaAcao: linha.ultima_acao ?? (linha.situacao === 'cancelada' ? 'cancelada' : linha.situacao === 'concluida' ? 'concluida' : 'confirmada'), resumoDaUltimaAlteracao: linha.resumo_ultima_alteracao ?? '', criadoEm: linha.criado_em.toISOString(),
    })) as Reserva[];
  } finally { await sql.end(); }
}

export async function cadastrarReserva(dados: DadosDaReserva): Promise<Reserva> {
  const entrada = combinarDataEHora(dados.dataDeEntrada, dados.horaDeEntrada);
  const saida = combinarDataEHora(dados.dataDeSaida, dados.horaDeSaida);
  const sql = conexaoPostgres();

  if (!sql) {
    const banco = await lerBancoLocal();
    const acomodacao = banco.acomodacoes.find((item) => item.id === dados.acomodacaoId);
    if (!acomodacao) throw new Error('ACOMODACAO_NAO_ENCONTRADA');
    if (!banco.hospedes.some((item) => item.id === dados.hospedeResponsavelId)) throw new Error('HOSPEDE_NAO_ENCONTRADO');
    if (dados.quantidadeDeHospedes > acomodacao.capacidadeDePessoas) throw new Error('CAPACIDADE_EXCEDIDA');
    const existeConflito = banco.reservas.some((reserva) => reserva.acomodacaoId === dados.acomodacaoId && reserva.situacao !== 'cancelada' && periodosSeSobrepoem(entrada, saida, combinarDataEHora(reserva.dataDeEntrada, reserva.horaDeEntrada), combinarDataEHora(reserva.dataDeSaida, reserva.horaDeSaida)));
    if (existeConflito) throw new Error('PERIODO_INDISPONIVEL');
    if (banco.bloqueiosDeAgenda.some((item) => item.acomodacaoId === dados.acomodacaoId && entrada < new Date(combinarDataEHora(item.dataFinal, '00:00').getTime() + 86400000) && saida > combinarDataEHora(item.dataInicial, '00:00'))) throw new Error('PERIODO_BLOQUEADO');
    const reserva: Reserva = { id: crypto.randomUUID(), ...dados, dataDeEntrada: entrada.toISOString(), dataDeSaida: saida.toISOString(), ultimaAcao: dados.situacao === 'cancelada' ? 'cancelada' : dados.situacao === 'concluida' ? 'concluida' : 'confirmada', resumoDaUltimaAlteracao: '', criadoEm: new Date().toISOString() };
    banco.reservas.push(reserva); await gravarBancoLocal(banco); return reserva;
  }

  try {
    const [acomodacao] = await sql`select capacidade_pessoas from acomodacoes where id=${dados.acomodacaoId}`;
    if (!acomodacao) throw new Error('ACOMODACAO_NAO_ENCONTRADA');
    if (dados.quantidadeDeHospedes > acomodacao.capacidade_pessoas) throw new Error('CAPACIDADE_EXCEDIDA');
    const [conflito] = await sql`select id from reservas where acomodacao_id=${dados.acomodacaoId} and situacao <> 'cancelada' and data_entrada < ${saida} and data_saida > ${entrada} limit 1`;
    if (conflito) throw new Error('PERIODO_INDISPONIVEL');
    const [bloqueio] = await sql`select id from bloqueios_agenda where acomodacao_id=${dados.acomodacaoId} and data_inicial<${saida} and data_final + interval '1 day'>${entrada} limit 1`;
    if (bloqueio) throw new Error('PERIODO_BLOQUEADO');
    const id = crypto.randomUUID();
    const ultimaAcao = dados.situacao === 'cancelada' ? 'cancelada' : dados.situacao === 'concluida' ? 'concluida' : 'confirmada';
    await sql`insert into reservas (id,acomodacao_id,hospede_responsavel_id,data_entrada,data_saida,hora_entrada,hora_saida,quantidade_hospedes,valor_calculado,ajuste_valor,motivo_ajuste,valor_total,tipo_locacao,situacao,ultima_acao,resumo_ultima_alteracao) values (${id},${dados.acomodacaoId},${dados.hospedeResponsavelId},${entrada},${saida},${dados.horaDeEntrada},${dados.horaDeSaida},${dados.quantidadeDeHospedes},${dados.valorCalculado},${dados.ajusteNoValor},${dados.motivoDoAjuste},${dados.valorTotal},${dados.tipoDeLocacao},${dados.situacao},${ultimaAcao},${''})`;
    return { id, ...dados, dataDeEntrada: entrada.toISOString(), dataDeSaida: saida.toISOString(), ultimaAcao, resumoDaUltimaAlteracao: '', criadoEm: new Date().toISOString() };
  } finally { await sql.end(); }
}

export async function atualizarReserva(id: string, dados: DadosDaReserva): Promise<Reserva> {
  const entrada = combinarDataEHora(dados.dataDeEntrada, dados.horaDeEntrada);
  const saida = combinarDataEHora(dados.dataDeSaida, dados.horaDeSaida);
  const sql = conexaoPostgres();

  if (!sql) {
    const banco = await lerBancoLocal();
    const indice = banco.reservas.findIndex((item) => item.id === id);
    if (indice < 0) throw new Error('RESERVA_NAO_ENCONTRADA');
    if (banco.reservas[indice].situacao === 'cancelada' && dados.situacao !== 'cancelada') throw new Error('RESERVA_CANCELADA_IMUTAVEL');
    const acomodacao = banco.acomodacoes.find((item) => item.id === dados.acomodacaoId);
    if (!acomodacao) throw new Error('ACOMODACAO_NAO_ENCONTRADA');
    if (!banco.hospedes.some((item) => item.id === dados.hospedeResponsavelId)) throw new Error('HOSPEDE_NAO_ENCONTRADO');
    if (dados.quantidadeDeHospedes > acomodacao.capacidadeDePessoas) throw new Error('CAPACIDADE_EXCEDIDA');
    const existeConflito = dados.situacao !== 'cancelada' && banco.reservas.some((reserva) => reserva.id !== id && reserva.acomodacaoId === dados.acomodacaoId && reserva.situacao !== 'cancelada' && periodosSeSobrepoem(entrada, saida, combinarDataEHora(reserva.dataDeEntrada, reserva.horaDeEntrada), combinarDataEHora(reserva.dataDeSaida, reserva.horaDeSaida)));
    if (existeConflito) throw new Error('PERIODO_INDISPONIVEL');
    if (dados.situacao !== 'cancelada' && banco.bloqueiosDeAgenda.some((item) => item.acomodacaoId === dados.acomodacaoId && entrada < new Date(combinarDataEHora(item.dataFinal, '00:00').getTime() + 86400000) && saida > combinarDataEHora(item.dataInicial, '00:00'))) throw new Error('PERIODO_BLOQUEADO');
    const acao = definirAcaoEAlteracoes(banco.reservas[indice], dados);
    const atualizada: Reserva = { ...banco.reservas[indice], ...dados, ...acao, dataDeEntrada: entrada.toISOString(), dataDeSaida: saida.toISOString() };
    banco.reservas[indice] = atualizada;
    await gravarBancoLocal(banco);
    return atualizada;
  }

  try {
    const [anteriorLinha] = await sql`select * from reservas where id=${id}`;
    if (!anteriorLinha) throw new Error('RESERVA_NAO_ENCONTRADA');
    const anterior: Reserva = {
      id: anteriorLinha.id, acomodacaoId: anteriorLinha.acomodacao_id, hospedeResponsavelId: anteriorLinha.hospede_responsavel_id,
      dataDeEntrada: anteriorLinha.data_entrada.toISOString(), dataDeSaida: anteriorLinha.data_saida.toISOString(), horaDeEntrada: anteriorLinha.hora_entrada ?? '14:00', horaDeSaida: anteriorLinha.hora_saida ?? '11:00',
      quantidadeDeHospedes: anteriorLinha.quantidade_hospedes, valorCalculado: Number(anteriorLinha.valor_calculado ?? anteriorLinha.valor_total), ajusteNoValor: Number(anteriorLinha.ajuste_valor ?? 0), motivoDoAjuste: anteriorLinha.motivo_ajuste ?? '', valorTotal: Number(anteriorLinha.valor_total),
      tipoDeLocacao: anteriorLinha.tipo_locacao, situacao: anteriorLinha.situacao, ultimaAcao: anteriorLinha.ultima_acao ?? 'confirmada', resumoDaUltimaAlteracao: anteriorLinha.resumo_ultima_alteracao ?? '', criadoEm: anteriorLinha.criado_em.toISOString(),
    };
    if (anterior.situacao === 'cancelada' && dados.situacao !== 'cancelada') throw new Error('RESERVA_CANCELADA_IMUTAVEL');
    const acao = definirAcaoEAlteracoes(anterior, dados);
    const [acomodacao] = await sql`select capacidade_pessoas from acomodacoes where id=${dados.acomodacaoId}`;
    if (!acomodacao) throw new Error('ACOMODACAO_NAO_ENCONTRADA');
    if (dados.quantidadeDeHospedes > acomodacao.capacidade_pessoas) throw new Error('CAPACIDADE_EXCEDIDA');
    if (dados.situacao !== 'cancelada') {
      const [conflito] = await sql`select id from reservas where id<>${id} and acomodacao_id=${dados.acomodacaoId} and situacao<>'cancelada' and data_entrada<${saida} and data_saida>${entrada} limit 1`;
      if (conflito) throw new Error('PERIODO_INDISPONIVEL');
      const [bloqueio] = await sql`select id from bloqueios_agenda where acomodacao_id=${dados.acomodacaoId} and data_inicial<${saida} and data_final + interval '1 day'>${entrada} limit 1`;
      if (bloqueio) throw new Error('PERIODO_BLOQUEADO');
    }
    const [linha] = await sql`update reservas set acomodacao_id=${dados.acomodacaoId}, hospede_responsavel_id=${dados.hospedeResponsavelId}, data_entrada=${entrada}, data_saida=${saida}, hora_entrada=${dados.horaDeEntrada}, hora_saida=${dados.horaDeSaida}, quantidade_hospedes=${dados.quantidadeDeHospedes}, valor_calculado=${dados.valorCalculado}, ajuste_valor=${dados.ajusteNoValor}, motivo_ajuste=${dados.motivoDoAjuste}, valor_total=${dados.valorTotal}, tipo_locacao=${dados.tipoDeLocacao}, situacao=${dados.situacao}, ultima_acao=${acao.ultimaAcao}, resumo_ultima_alteracao=${acao.resumoDaUltimaAlteracao} where id=${id} returning criado_em`;
    if (!linha) throw new Error('RESERVA_NAO_ENCONTRADA');
    return { id, ...dados, ...acao, dataDeEntrada: entrada.toISOString(), dataDeSaida: saida.toISOString(), criadoEm: linha.criado_em.toISOString() };
  } finally { await sql.end(); }
}

export async function excluirReserva(id: string): Promise<void> {
  const sql = conexaoPostgres();
  if (!sql) {
    const banco = await lerBancoLocal();
    if (banco.vistorias.some((item) => item.reservaId === id) || banco.lancamentosFinanceiros.some((item) => item.reservaId === id)) throw new Error('RESERVA_COM_HISTORICO');
    const tamanho = banco.reservas.length;
    banco.reservas = banco.reservas.filter((item) => item.id !== id);
    if (banco.reservas.length === tamanho) throw new Error('RESERVA_NAO_ENCONTRADA');
    await gravarBancoLocal(banco);
    return;
  }
  try {
    const [vinculo] = await sql`select id from vistorias where reserva_id=${id} union all select id from lancamentos_financeiros where reserva_id=${id} limit 1`;
    if (vinculo) throw new Error('RESERVA_COM_HISTORICO');
    const removidas = await sql`delete from reservas where id=${id} returning id`;
    if (!removidas.length) throw new Error('RESERVA_NAO_ENCONTRADA');
  } finally { await sql.end(); }
}
