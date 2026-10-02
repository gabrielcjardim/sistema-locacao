'use client';

import { CSSProperties, FormEvent, useEffect, useState } from 'react';
import type { Acomodacao } from '@/dominio/acomodacao';
import type { Hospede } from '@/dominio/hospede';
import { combinarDataEHora, type Reserva } from '@/dominio/reserva';
import type { RegraDePreco } from '@/dominio/regra-de-preco';
import type { BloqueioDeAgenda } from '@/dominio/bloqueio-de-agenda';
import type { Vistoria } from '@/dominio/vistoria';
import type { LancamentoFinanceiro } from '@/dominio/lancamento-financeiro';
import type { UsuarioDoSistema } from '@/dominio/usuario-do-sistema';

type Secao = 'visao-geral' | 'acomodacoes' | 'hospedes' | 'reservas' | 'agenda' | 'vistorias' | 'financeiro' | 'configuracoes';
type Janela = 'acomodacao' | 'hospede' | 'reserva' | 'regra-preco' | 'detalhes-hospede' | 'acao-dia' | 'bloqueio' | 'vistoria' | 'financeiro' | 'usuario' | null;

const novaAcomodacao = { identificacao: '', tipo: 'Apartamento', andarOuLocalizacao: '', capacidadeDePessoas: 3, numeroDeQuartos: 1, valorBaseDaDiaria: 180, situacao: 'disponivel', observacoes: '' };
const novoHospede = { nomeCompleto: '', cpf: '', telefone: '', email: '', observacoes: '' };
const hoje = new Date().toISOString().slice(0, 10);
const amanha = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const novaReserva = { acomodacaoId: '', hospedeResponsavelId: '', dataDeEntrada: hoje, horaDeEntrada: '14:00', dataDeSaida: amanha, horaDeSaida: '11:00', quantidadeDeHospedes: 1, valorCalculado: 0, ajusteNoValor: 0, motivoDoAjuste: '', valorTotal: 0, tipoDeLocacao: 'diaria', situacao: 'confirmada' };
const novaRegraDePreco = { nome: '', dataInicial: hoje, dataFinal: amanha, valorDaDiaria: 0, acomodacaoId: '', ativa: true };
const novoBloqueio = { acomodacaoId: '', dataInicial: hoje, dataFinal: hoje, motivo: 'Uso particular' };
const itensPadraoDaVistoria = ['Limpeza geral', 'Enxoval e roupas de cama', 'Móveis e eletrodomésticos', 'Banheiro', 'Chaves e controles'].map((nome) => ({ nome, conforme: true, observacao: '' }));
const novaVistoria = { reservaId: '', acomodacaoId: '', tipo: 'entrada', dataDaVistoria: hoje, responsavel: '', itens: itensPadraoDaVistoria, observacoes: '', situacao: 'pendente' };
const novoLancamento = { tipo: 'receita', descricao: '', categoria: 'Hospedagem', valor: 0, dataDeVencimento: hoje, dataDePagamento: '', situacao: 'pendente', reservaId: '', observacoes: '' };
const novoUsuario: { nome: string; usuario: string; senha: string; ativo: boolean; perfil: UsuarioDoSistema['perfil'] } = { nome: '', usuario: '', senha: '', ativo: true, perfil: 'operador' };

async function buscarLista<T>(rota: string): Promise<T[]> {
  const resposta = await fetch(rota, { cache: 'no-store' });
  if (!resposta.ok) throw new Error(`Falha ao carregar ${rota}.`);
  return resposta.json();
}

export default function PaginaInicial() {
  const [secao, definirSecao] = useState<Secao>('visao-geral');
  const [janela, definirJanela] = useState<Janela>(null);
  const [acomodacoes, definirAcomodacoes] = useState<Acomodacao[]>([]);
  const [hospedes, definirHospedes] = useState<Hospede[]>([]);
  const [reservas, definirReservas] = useState<Reserva[]>([]);
  const [regrasDePreco, definirRegrasDePreco] = useState<RegraDePreco[]>([]);
  const [mensagem, definirMensagem] = useState('');
  const [carregando, definirCarregando] = useState(true);
  const [dadosAcomodacao, definirDadosAcomodacao] = useState(novaAcomodacao);
  const [dadosHospede, definirDadosHospede] = useState(novoHospede);
  const [dadosReserva, definirDadosReserva] = useState(novaReserva);
  const [inicioDaAgenda, definirInicioDaAgenda] = useState(() => inicioDoDia(new Date()));
  const [reservaEmEdicaoId, definirReservaEmEdicaoId] = useState<string | null>(null);
  const [dadosRegraDePreco, definirDadosRegraDePreco] = useState(novaRegraDePreco);
  const [hospedeSelecionado, definirHospedeSelecionado] = useState<Hospede | null>(null);
  const [acomodacaoEmEdicaoId, definirAcomodacaoEmEdicaoId] = useState<string | null>(null);
  const [menuAberto, definirMenuAberto] = useState(false);
  const [corPrincipal, definirCorPrincipal] = useState('#FF5C00');
  const [temaCarregado, definirTemaCarregado] = useState(false);
  const [coresRecentes, definirCoresRecentes] = useState<string[]>(['#FF5C00']);
  const [bloqueios, definirBloqueios] = useState<BloqueioDeAgenda[]>([]);
  const [diaSelecionado, definirDiaSelecionado] = useState<Date | null>(null);
  const [dadosBloqueio, definirDadosBloqueio] = useState(novoBloqueio);
  const [vistorias, definirVistorias] = useState<Vistoria[]>([]);
  const [dadosVistoria, definirDadosVistoria] = useState(novaVistoria);
  const [vistoriaEmEdicaoId, definirVistoriaEmEdicaoId] = useState<string | null>(null);
  const [lancamentos, definirLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [dadosLancamento, definirDadosLancamento] = useState(novoLancamento);
  const [lancamentoEmEdicaoId, definirLancamentoEmEdicaoId] = useState<string | null>(null);
  const [usuarios, definirUsuarios] = useState<UsuarioDoSistema[]>([]);
  const [dadosUsuario, definirDadosUsuario] = useState(novoUsuario);
  const [usuarioEmEdicaoId, definirUsuarioEmEdicaoId] = useState<string | null>(null);
  const [perfilAtual, definirPerfilAtual] = useState<UsuarioDoSistema['perfil']>('operador');

  async function carregarTudo() {
    definirCarregando(true);
    const sessao = await fetch('/api/autenticacao/sessao', { cache: 'no-store' }).then((resposta) => resposta.json() as Promise<{ perfil: UsuarioDoSistema['perfil'] }>);
    definirPerfilAtual(sessao.perfil);
    const [listaDeAcomodacoes, listaDeHospedes, listaDeReservas, listaDeRegras, configuracoes, listaDeBloqueios, listaDeVistorias, listaDeLancamentos, listaDeUsuarios] = await Promise.all([
      buscarLista<Acomodacao>('/api/acomodacoes'), buscarLista<Hospede>('/api/hospedes'), buscarLista<Reserva>('/api/reservas'), buscarLista<RegraDePreco>('/api/regras-de-preco'), fetch('/api/configuracoes', { cache: 'no-store' }).then((resposta) => resposta.json() as Promise<{ corPrincipal: string; coresRecentes: string[] }>), buscarLista<BloqueioDeAgenda>('/api/bloqueios'), buscarLista<Vistoria>('/api/vistorias'), buscarLista<LancamentoFinanceiro>('/api/financeiro'), sessao.perfil === 'operador' ? Promise.resolve([]) : buscarLista<UsuarioDoSistema>('/api/usuarios'),
    ]);
    definirAcomodacoes(listaDeAcomodacoes);
    definirHospedes(listaDeHospedes);
    definirReservas(listaDeReservas);
    definirRegrasDePreco(listaDeRegras);
    definirCorPrincipal(configuracoes.corPrincipal);
    definirTemaCarregado(true);
    definirCoresRecentes(configuracoes.coresRecentes.slice(0, 5));
    definirBloqueios(listaDeBloqueios);
    definirVistorias(listaDeVistorias);
    definirLancamentos(listaDeLancamentos);
    definirUsuarios(listaDeUsuarios);
    definirCarregando(false);
  }

  useEffect(() => { carregarTudo().catch(() => definirMensagem('Não foi possível carregar os dados.')); }, []);

  useEffect(() => {
    if (!mensagem) return;
    const temporizador = window.setTimeout(() => definirMensagem(''), 4000);
    return () => window.clearTimeout(temporizador);
  }, [mensagem]);

  async function enviarFormulario(rota: string, dados: object, metodo: 'POST' | 'PATCH' = 'POST') {
    const resposta = await fetch(rota, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
    const resultado = await resposta.json();
    if (!resposta.ok) throw new Error(resultado.mensagem ?? 'Não foi possível salvar.');
    return resultado;
  }

  async function salvarAcomodacao(evento: FormEvent) {
    evento.preventDefault();
    try {
      const salva = await enviarFormulario(acomodacaoEmEdicaoId ? `/api/acomodacoes/${acomodacaoEmEdicaoId}` : '/api/acomodacoes', dadosAcomodacao, acomodacaoEmEdicaoId ? 'PATCH' : 'POST') as Acomodacao;
      definirAcomodacoes((atuais) => acomodacaoEmEdicaoId ? atuais.map((item) => item.id === acomodacaoEmEdicaoId ? salva : item) : [...atuais, salva]); definirDadosAcomodacao(novaAcomodacao); definirAcomodacaoEmEdicaoId(null); definirJanela(null); definirMensagem(acomodacaoEmEdicaoId ? 'Acomodação atualizada com sucesso.' : 'Acomodação cadastrada com sucesso.');
    } catch (erro) { definirMensagem((erro as Error).message); }
  }

  async function salvarHospede(evento: FormEvent) {
    evento.preventDefault();
    try {
      const criado = await enviarFormulario('/api/hospedes', dadosHospede);
      definirHospedes((atuais) => [...atuais, criado]); definirDadosHospede(novoHospede); definirJanela(null); definirMensagem('Hóspede cadastrado com sucesso.');
    } catch (erro) { definirMensagem((erro as Error).message); }
  }

  async function salvarReserva(evento: FormEvent) {
    evento.preventDefault();
    try {
      const salva = await enviarFormulario(reservaEmEdicaoId ? `/api/reservas/${reservaEmEdicaoId}` : '/api/reservas', dadosReserva, reservaEmEdicaoId ? 'PATCH' : 'POST') as Reserva;
      definirReservas((atuais) => reservaEmEdicaoId ? atuais.map((item) => item.id === reservaEmEdicaoId ? salva : item) : [salva, ...atuais]);
      definirDadosReserva(novaReserva); definirReservaEmEdicaoId(null); definirJanela(null); definirMensagem(reservaEmEdicaoId ? 'Reserva atualizada com sucesso.' : 'Reserva confirmada com sucesso.');
    } catch (erro) { definirMensagem((erro as Error).message); }
  }

  async function salvarRegraDePreco(evento: FormEvent) {
    evento.preventDefault();
    try {
      const criada = await enviarFormulario('/api/regras-de-preco', { ...dadosRegraDePreco, acomodacaoId: dadosRegraDePreco.acomodacaoId || null }) as RegraDePreco;
      definirRegrasDePreco((atuais) => [criada, ...atuais]); definirDadosRegraDePreco(novaRegraDePreco); definirJanela(null); definirMensagem('Regra de preço cadastrada com sucesso.');
    } catch (erro) { definirMensagem((erro as Error).message); }
  }

  async function alterarCorPrincipal(cor: string) {
    const corNormalizada = cor.toUpperCase();
    const novasCoresRecentes = [corNormalizada, ...coresRecentes.filter((item) => item.toUpperCase() !== corNormalizada)].slice(0, 5);
    definirCorPrincipal(corNormalizada); definirCoresRecentes(novasCoresRecentes); definirTemaCarregado(true);
    try {
      const salva = await enviarFormulario('/api/configuracoes', { corPrincipal: corNormalizada, coresRecentes: novasCoresRecentes }, 'PATCH') as { corPrincipal: string; coresRecentes: string[] };
      definirCorPrincipal(salva.corPrincipal); definirCoresRecentes(salva.coresRecentes); definirMensagem('Cor do sistema atualizada.');
    } catch (erro) { definirMensagem((erro as Error).message); }
  }

  async function salvarBloqueio(evento: FormEvent) {
    evento.preventDefault();
    try {
      const criado = await enviarFormulario('/api/bloqueios', dadosBloqueio) as BloqueioDeAgenda;
      definirBloqueios((atuais) => [...atuais, criado]); definirJanela(null); definirMensagem('Data bloqueada com sucesso.');
    } catch (erro) { definirMensagem((erro as Error).message); }
  }

  async function salvarVistoria(evento: FormEvent) {
    evento.preventDefault();
    try {
      const salva = await enviarFormulario(vistoriaEmEdicaoId ? `/api/vistorias/${vistoriaEmEdicaoId}` : '/api/vistorias', dadosVistoria, vistoriaEmEdicaoId ? 'PATCH' : 'POST') as Vistoria;
      definirVistorias((atuais) => vistoriaEmEdicaoId ? atuais.map((item) => item.id === vistoriaEmEdicaoId ? salva : item) : [salva, ...atuais]);
      definirVistoriaEmEdicaoId(null); definirDadosVistoria(novaVistoria); definirJanela(null); definirMensagem(vistoriaEmEdicaoId ? 'Vistoria atualizada.' : 'Vistoria cadastrada.');
    } catch (erro) { definirMensagem((erro as Error).message); }
  }

  async function salvarLancamento(evento: FormEvent) {
    evento.preventDefault();
    try {
      const envio = { ...dadosLancamento, reservaId: dadosLancamento.reservaId || null, dataDePagamento: dadosLancamento.dataDePagamento || null };
      const salvo = await enviarFormulario(lancamentoEmEdicaoId ? `/api/financeiro/${lancamentoEmEdicaoId}` : '/api/financeiro', envio, lancamentoEmEdicaoId ? 'PATCH' : 'POST') as LancamentoFinanceiro;
      definirLancamentos((atuais) => lancamentoEmEdicaoId ? atuais.map((item) => item.id === lancamentoEmEdicaoId ? salvo : item) : [salvo, ...atuais]);
      definirLancamentoEmEdicaoId(null); definirDadosLancamento(novoLancamento); definirJanela(null); definirMensagem(lancamentoEmEdicaoId ? 'Lançamento atualizado.' : 'Lançamento cadastrado.');
    } catch (erro) { definirMensagem((erro as Error).message); }
  }

  async function salvarUsuario(evento: FormEvent) {
    evento.preventDefault();
    try {
      const salvo = await enviarFormulario(usuarioEmEdicaoId ? `/api/usuarios/${usuarioEmEdicaoId}` : '/api/usuarios', dadosUsuario, usuarioEmEdicaoId ? 'PATCH' : 'POST') as UsuarioDoSistema;
      definirUsuarios((atuais) => usuarioEmEdicaoId ? atuais.map((item) => item.id === usuarioEmEdicaoId ? salvo : item) : [...atuais, salvo].sort((a, b) => a.nome.localeCompare(b.nome)));
      definirUsuarioEmEdicaoId(null); definirDadosUsuario(novoUsuario); definirJanela(null); definirMensagem(usuarioEmEdicaoId ? 'Usuário atualizado com sucesso.' : 'Usuário cadastrado com sucesso.');
    } catch (erro) { definirMensagem((erro as Error).message); }
  }

  function abrirUsuario(usuario?: UsuarioDoSistema) {
    definirUsuarioEmEdicaoId(usuario?.id ?? null);
    definirDadosUsuario(usuario ? { nome: usuario.nome, usuario: usuario.usuario, senha: '', ativo: usuario.ativo, perfil: usuario.perfil } : novoUsuario);
    definirJanela('usuario');
  }

  function abrirCadastro(tipo: Exclude<Janela, null>) {
    if (tipo === 'acomodacao') definirAcomodacaoEmEdicaoId(null);
    if (tipo === 'reserva') {
      definirReservaEmEdicaoId(null);
      const acomodacaoId = acomodacoesDisponiveisNoPeriodo(novaReserva.dataDeEntrada, novaReserva.horaDeEntrada, novaReserva.dataDeSaida, novaReserva.horaDeSaida, null)[0]?.id ?? '';
      definirDadosReserva(atualizarReservaComValor({ ...novaReserva, acomodacaoId, hospedeResponsavelId: hospedes[0]?.id ?? '' }, {}, acomodacoes, regrasDePreco));
    }
    if (tipo === 'vistoria') { definirVistoriaEmEdicaoId(null); const reserva = reservas.find((item) => item.situacao !== 'cancelada'); definirDadosVistoria({ ...novaVistoria, reservaId: reserva?.id ?? '', acomodacaoId: reserva?.acomodacaoId ?? '' }); }
    if (tipo === 'financeiro') { definirLancamentoEmEdicaoId(null); definirDadosLancamento(novoLancamento); }
    definirJanela(tipo);
  }

  function editarVistoria(vistoria: Vistoria) { definirVistoriaEmEdicaoId(vistoria.id); definirDadosVistoria({ reservaId: vistoria.reservaId, acomodacaoId: vistoria.acomodacaoId, tipo: vistoria.tipo, dataDaVistoria: vistoria.dataDaVistoria.slice(0, 10), responsavel: vistoria.responsavel, itens: vistoria.itens, observacoes: vistoria.observacoes, situacao: vistoria.situacao }); definirJanela('vistoria'); }
  function editarLancamento(item: LancamentoFinanceiro) { definirLancamentoEmEdicaoId(item.id); definirDadosLancamento({ tipo: item.tipo, descricao: item.descricao, categoria: item.categoria, valor: item.valor, dataDeVencimento: item.dataDeVencimento.slice(0, 10), dataDePagamento: item.dataDePagamento?.slice(0, 10) ?? '', situacao: item.situacao, reservaId: item.reservaId ?? '', observacoes: item.observacoes }); definirJanela('financeiro'); }

  function editarReserva(reserva: Reserva) {
    definirReservaEmEdicaoId(reserva.id);
    definirDadosReserva({ acomodacaoId: reserva.acomodacaoId, hospedeResponsavelId: reserva.hospedeResponsavelId, dataDeEntrada: reserva.dataDeEntrada.slice(0, 10), horaDeEntrada: reserva.horaDeEntrada ?? '14:00', dataDeSaida: reserva.dataDeSaida.slice(0, 10), horaDeSaida: reserva.horaDeSaida ?? '11:00', quantidadeDeHospedes: reserva.quantidadeDeHospedes, valorCalculado: reserva.valorCalculado ?? reserva.valorTotal, ajusteNoValor: reserva.ajusteNoValor ?? 0, motivoDoAjuste: reserva.motivoDoAjuste ?? '', valorTotal: reserva.valorTotal, tipoDeLocacao: reserva.tipoDeLocacao, situacao: reserva.situacao });
    definirJanela('reserva');
  }

  function abrirHospede(id: string) {
    definirHospedeSelecionado(hospedes.find((item) => item.id === id) ?? null);
    definirJanela('detalhes-hospede');
  }

  function editarAcomodacao(acomodacao: Acomodacao) {
    definirAcomodacaoEmEdicaoId(acomodacao.id);
    definirDadosAcomodacao({ identificacao: acomodacao.identificacao, tipo: acomodacao.tipo, andarOuLocalizacao: acomodacao.andarOuLocalizacao, capacidadeDePessoas: acomodacao.capacidadeDePessoas, numeroDeQuartos: acomodacao.numeroDeQuartos, valorBaseDaDiaria: acomodacao.valorBaseDaDiaria, situacao: acomodacao.situacao, observacoes: acomodacao.observacoes });
    definirJanela('acomodacao');
  }

  async function removerAcomodacaoSelecionada() {
    if (!acomodacaoEmEdicaoId || !window.confirm('Deseja realmente excluir esta acomodação? Esta ação não poderá ser desfeita.')) return;
    try {
      const resposta = await fetch(`/api/acomodacoes/${acomodacaoEmEdicaoId}`, { method: 'DELETE' });
      if (!resposta.ok) throw new Error((await resposta.json()).mensagem ?? 'Não foi possível excluir a acomodação.');
      definirAcomodacoes((atuais) => atuais.filter((item) => item.id !== acomodacaoEmEdicaoId)); definirAcomodacaoEmEdicaoId(null); definirJanela(null); definirMensagem('Acomodação excluída com sucesso.');
    } catch (erro) { definirMensagem((erro as Error).message); definirJanela(null); }
  }

  function abrirReservaNoDia(data: Date) {
    const entrada = chaveDaData(data); const saida = chaveDaData(adicionarDias(data, 1));
    const acomodacaoLivre = acomodacoesDisponiveisNoPeriodo(entrada, novaReserva.horaDeEntrada, saida, novaReserva.horaDeSaida, null)[0];
    if (!acomodacaoLivre) { definirJanela(null); definirMensagem('Não há acomodação disponível nessa data. Escolha outro dia ou libere uma acomodação.'); return; }
    definirReservaEmEdicaoId(null);
    definirDadosReserva(atualizarReservaComValor({ ...novaReserva, acomodacaoId: acomodacaoLivre.id, hospedeResponsavelId: hospedes[0]?.id ?? '', dataDeEntrada: entrada, dataDeSaida: saida }, {}, acomodacoes, regrasDePreco));
    definirJanela('reserva');
  }

  function escolherAcaoDoDia(data: Date) { definirDiaSelecionado(data); definirJanela('acao-dia'); }
  function abrirBloqueioNoDia() { if (!diaSelecionado) return; const data = chaveDaData(diaSelecionado); definirDadosBloqueio({ ...novoBloqueio, acomodacaoId: acomodacoes[0]?.id ?? '', dataInicial: data, dataFinal: data }); definirJanela('bloqueio'); }
  function acomodacoesDisponiveisNoPeriodo(dataDeEntrada: string, horaDeEntrada: string, dataDeSaida: string, horaDeSaida: string, reservaIgnoradaId: string | null = reservaEmEdicaoId) {
    const entrada = combinarDataEHora(dataDeEntrada, horaDeEntrada); const saida = combinarDataEHora(dataDeSaida, horaDeSaida);
    if (saida <= entrada) return [];
    return acomodacoes.filter((acomodacao) => acomodacao.situacao !== 'manutencao' && acomodacao.situacao !== 'inativa' && !reservas.some((reserva) => reserva.id !== reservaIgnoradaId && reserva.acomodacaoId === acomodacao.id && reserva.situacao !== 'cancelada' && entrada < combinarDataEHora(reserva.dataDeSaida, reserva.horaDeSaida ?? '11:00') && saida > combinarDataEHora(reserva.dataDeEntrada, reserva.horaDeEntrada ?? '14:00')) && !bloqueios.some((bloqueio) => acomodacao.id === bloqueio.acomodacaoId && entrada < combinarDataEHora(chaveDaData(adicionarDias(dataLocal(bloqueio.dataFinal), 1)), '00:00') && saida > combinarDataEHora(bloqueio.dataInicial, '00:00')));
  }
  function atualizarPeriodoDaReserva(alteracao: Partial<typeof novaReserva>) { let atualizada = atualizarReservaComValor(dadosReserva, alteracao, acomodacoes, regrasDePreco); const disponiveis = acomodacoesDisponiveisNoPeriodo(atualizada.dataDeEntrada, atualizada.horaDeEntrada, atualizada.dataDeSaida, atualizada.horaDeSaida); if (!disponiveis.some((item) => item.id === atualizada.acomodacaoId)) atualizada = atualizarReservaComValor(atualizada, { acomodacaoId: disponiveis[0]?.id ?? '' }, acomodacoes, regrasDePreco); return atualizada; }
  function atualizarTipoDaReserva(tipo: string) { const atualizada = atualizarTipoDeLocacao(dadosReserva, tipo, acomodacoes, regrasDePreco); const disponiveis = acomodacoesDisponiveisNoPeriodo(atualizada.dataDeEntrada, atualizada.horaDeEntrada, atualizada.dataDeSaida, atualizada.horaDeSaida); return disponiveis.some((item) => item.id === atualizada.acomodacaoId) ? atualizada : atualizarReservaComValor(atualizada, { acomodacaoId: disponiveis[0]?.id ?? '' }, acomodacoes, regrasDePreco); }

  async function sairDoSistema() {
    await fetch('/api/autenticacao/sair', { method: 'POST' });
    window.location.assign('/login');
  }

  const nomes: Record<Secao, string> = { 'visao-geral': 'Visão geral', acomodacoes: 'Acomodações', hospedes: 'Hóspedes', reservas: 'Reservas', agenda: 'Agenda', vistorias: 'Vistorias', financeiro: 'Financeiro', configuracoes: 'Configurações' };
  const disponiveis = acomodacoes.filter((item) => item.situacao === 'disponivel').length;
  const nomeDoHospede = (id: string) => hospedes.find((item) => item.id === id)?.nomeCompleto ?? 'Hóspede removido';
  const nomeDaAcomodacao = (id: string) => acomodacoes.find((item) => item.id === id)?.identificacao ?? '—';
  const quantidadeLivreNoDiaSelecionado = diaSelecionado ? acomodacoesDisponiveisNoPeriodo(chaveDaData(diaSelecionado), novaReserva.horaDeEntrada, chaveDaData(adicionarDias(diaSelecionado, 1)), novaReserva.horaDeSaida).length : 0;
  const acomodacoesDisponiveisParaReserva = acomodacoesDisponiveisNoPeriodo(dadosReserva.dataDeEntrada, dadosReserva.horaDeEntrada, dadosReserva.dataDeSaida, dadosReserva.horaDeSaida);

  const variaveisDoTema = {
    '--verde': corPrincipal,
    '--verde2': escurecerHex(corPrincipal, 18),
    '--tema-clarissimo': misturarComBranco(corPrincipal, 4),
    '--tema-claro': misturarComBranco(corPrincipal, 10),
    '--tema-medio': misturarComBranco(corPrincipal, 24),
    '--tema-hover': misturarComBranco(corPrincipal, 78),
    '--tema-borda': misturarComBranco(corPrincipal, 28),
    '--tema-sombra': `${corPrincipal}2E`,
    '--fundo': misturarComBranco(corPrincipal, 4),
    '--linha': misturarComBranco(corPrincipal, 28),
  } as CSSProperties;
  return <div className="aplicacao" style={temaCarregado ? variaveisDoTema : undefined}>
    <button className="botao-menu-mobile" onClick={() => definirMenuAberto(true)} aria-label="Abrir menu" aria-expanded={menuAberto}>☰</button>
    {menuAberto && <button className="fundo-menu-mobile" onClick={() => definirMenuAberto(false)} aria-label="Fechar menu" />}
    <aside className={`barra-lateral${menuAberto ? ' menu-aberto' : ''}`}><div className="marca"><span>⌂</span> Meus Aptos<button className="fechar-menu-mobile" onClick={() => definirMenuAberto(false)} aria-label="Fechar menu">×</button></div><nav>
      {(['visao-geral', 'acomodacoes', 'hospedes', 'reservas', 'agenda', 'vistorias', 'financeiro', 'configuracoes'] as Secao[]).map((item) => <button key={item} className={secao === item ? 'ativo' : ''} onClick={() => { definirSecao(item); definirMensagem(''); definirMenuAberto(false); }}><span>{item === 'visao-geral' ? '⌂' : item === 'acomodacoes' ? '▦' : item === 'hospedes' ? '♙' : item === 'reservas' ? '▤' : item === 'agenda' ? '▣' : item === 'vistorias' ? '✓' : item === 'financeiro' ? 'R$' : '⚙'} {nomes[item]}</span></button>)}
    </nav><div className="rodape-menu"><button onClick={sairDoSistema}>⇥ Sair</button><small>Dados persistentes • ambiente protegido</small></div></aside>
    <main><header><div><h1>{nomes[secao]}</h1><p>{descricaoDaSecao(secao)}</p></div>{secao === 'configuracoes' ? <button className="botao-principal" onClick={() => definirJanela('regra-preco')}>＋ Nova regra de preço</button> : secao !== 'agenda' && secao !== 'visao-geral' && <button className="botao-principal" onClick={() => abrirCadastro(secao === 'acomodacoes' ? 'acomodacao' : secao === 'hospedes' ? 'hospede' : secao === 'vistorias' ? 'vistoria' : secao === 'financeiro' ? 'financeiro' : 'reserva')}>＋ {secao === 'acomodacoes' ? 'Nova acomodação' : secao === 'hospedes' ? 'Novo hóspede' : secao === 'vistorias' ? 'Nova vistoria' : secao === 'financeiro' ? 'Novo lançamento' : 'Nova reserva'}</button>}</header>
      {mensagem && <div className="mensagem" role="status">{mensagem}<button onClick={() => definirMensagem('')}>×</button></div>}
      {secao === 'visao-geral' && <VisaoGeral acomodacoes={acomodacoes} hospedes={hospedes} reservas={reservas} abrirReserva={() => abrirCadastro('reserva')} abrirAgenda={() => definirSecao('agenda')} editarReserva={editarReserva} />}
      {secao === 'acomodacoes' && <><section className="indicadores"><article><span>Total cadastrado</span><strong>{acomodacoes.length}</strong></article><article><span>Disponíveis agora</span><strong>{disponiveis}</strong></article><article><span>Indisponíveis</span><strong>{acomodacoes.length - disponiveis}</strong></article></section><section className="grade">{carregando ? <Estado texto="Carregando acomodações..." /> : acomodacoes.length === 0 ? <Estado texto="Nenhuma acomodação cadastrada" /> : acomodacoes.map((item) => <button className="cartao cartao-clicavel" key={item.id} onClick={() => editarAcomodacao(item)}><div className="cartao-topo"><span className="numero">{item.identificacao}</span><span className={`situacao ${item.situacao}`}>{item.situacao}</span></div><h2>{item.tipo} {item.identificacao}</h2><p>{item.andarOuLocalizacao || 'Localização não informada'} • {item.numeroDeQuartos} {item.numeroDeQuartos === 1 ? 'quarto' : 'quartos'} • até {item.capacidadeDePessoas} pessoas</p><footer><span>A partir de</span><strong>{item.valorBaseDaDiaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/dia</strong><em>Editar →</em></footer></button>)}</section></>}
      {secao === 'hospedes' && <TabelaVaziaOuConteudo vazia={!hospedes.length} textoVazio="Nenhum hóspede cadastrado"><table><thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>E-mail</th></tr></thead><tbody>{hospedes.map((item) => <tr key={item.id}><td><button className="link-tabela" onClick={() => abrirHospede(item.id)}>{item.nomeCompleto}</button></td><td>{item.cpf || 'Não informado'}</td><td>{item.telefone}</td><td>{item.email || 'Não informado'}</td></tr>)}</tbody></table></TabelaVaziaOuConteudo>}
      {secao === 'reservas' && <TabelaVaziaOuConteudo vazia={!reservas.length} textoVazio="Nenhuma reserva cadastrada"><table><thead><tr><th>Hóspede</th><th>Acomodação</th><th>Entrada</th><th>Saída</th><th>Pessoas</th><th>Valor</th><th>Situação</th><th></th></tr></thead><tbody>{reservas.map((item) => <tr key={item.id}><td><button className="link-tabela" onClick={() => abrirHospede(item.hospedeResponsavelId)}>{nomeDoHospede(item.hospedeResponsavelId)}</button></td><td><button className="link-tabela" onClick={() => { const acomodacao = acomodacoes.find((atual) => atual.id === item.acomodacaoId); if (acomodacao) editarAcomodacao(acomodacao); }}>{nomeDaAcomodacao(item.acomodacaoId)}</button></td><td>{formatarData(item.dataDeEntrada)} às {item.horaDeEntrada ?? '14:00'}</td><td>{formatarData(item.dataDeSaida)} às {item.horaDeSaida ?? '11:00'}</td><td>{item.quantidadeDeHospedes}</td><td>{item.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td><span className={`situacao ${item.situacao}`}>{item.situacao.replace('_', ' ')}</span></td><td><button className="botao-tabela" onClick={() => editarReserva(item)}>Editar</button></td></tr>)}</tbody></table></TabelaVaziaOuConteudo>}
      {secao === 'agenda' && <AgendaDeDisponibilidade acomodacoes={acomodacoes} hospedes={hospedes} reservas={reservas} bloqueios={bloqueios} regrasDePreco={regrasDePreco} inicio={inicioDaAgenda} mudarInicio={definirInicioDaAgenda} editarReserva={editarReserva} escolherAcaoDoDia={escolherAcaoDoDia} />}
      {secao === 'vistorias' && <PainelDeVistorias vistorias={vistorias} reservas={reservas} acomodacoes={acomodacoes} editar={editarVistoria} />}
      {secao === 'financeiro' && <PainelFinanceiro lancamentos={lancamentos} reservas={reservas} editar={editarLancamento} />}
      {secao === 'configuracoes' && <ConfiguracaoDePrecos regras={regrasDePreco} acomodacoes={acomodacoes} corPrincipal={corPrincipal} coresRecentes={coresRecentes} alterarCorPrincipal={alterarCorPrincipal} usuarios={usuarios} abrirUsuario={abrirUsuario} perfilAtual={perfilAtual} />}
    </main>
    {janela && <div className="fundo-modal" onMouseDown={(evento) => evento.target === evento.currentTarget && definirJanela(null)}><section className="modal" role="dialog" aria-modal="true"><header><h2>{janela === 'acomodacao' ? acomodacaoEmEdicaoId ? 'Editar acomodação' : 'Nova acomodação' : janela === 'hospede' ? 'Novo hóspede' : janela === 'regra-preco' ? 'Nova regra de preço' : janela === 'detalhes-hospede' ? 'Ficha do hóspede' : janela === 'acao-dia' ? diaSelecionado ? formatarData(chaveDaData(diaSelecionado)) : 'Agenda' : janela === 'bloqueio' ? 'Bloquear período' : janela === 'vistoria' ? vistoriaEmEdicaoId ? 'Editar vistoria' : 'Nova vistoria' : janela === 'financeiro' ? lancamentoEmEdicaoId ? 'Editar lançamento' : 'Novo lançamento' : janela === 'usuario' ? usuarioEmEdicaoId ? 'Editar usuário' : 'Novo usuário' : reservaEmEdicaoId ? 'Editar reserva' : 'Nova reserva'}</h2><button className="fechar" onClick={() => definirJanela(null)} aria-label="Fechar">×</button></header>
      {janela === 'acomodacao' && <form onSubmit={salvarAcomodacao}><Campo titulo="Identificação"><input required value={dadosAcomodacao.identificacao} onChange={(e) => definirDadosAcomodacao({ ...dadosAcomodacao, identificacao: e.target.value })} /></Campo><Campo titulo="Tipo"><select value={dadosAcomodacao.tipo} onChange={(e) => definirDadosAcomodacao({ ...dadosAcomodacao, tipo: e.target.value })}><option>Apartamento</option><option>Quarto</option><option>Casa</option><option>Chalé</option></select></Campo><Campo titulo="Andar ou localização"><input value={dadosAcomodacao.andarOuLocalizacao} onChange={(e) => definirDadosAcomodacao({ ...dadosAcomodacao, andarOuLocalizacao: e.target.value })} /></Campo><Campo titulo="Capacidade"><input type="number" min="1" required value={dadosAcomodacao.capacidadeDePessoas} onChange={(e) => definirDadosAcomodacao({ ...dadosAcomodacao, capacidadeDePessoas: Number(e.target.value) })} /></Campo><Campo titulo="Número de quartos"><input type="number" min="1" required value={dadosAcomodacao.numeroDeQuartos} onChange={(e) => definirDadosAcomodacao({ ...dadosAcomodacao, numeroDeQuartos: Number(e.target.value) })} /></Campo><Campo titulo="Valor-base da diária"><input type="number" min="0" step="0.01" required value={dadosAcomodacao.valorBaseDaDiaria} onChange={(e) => definirDadosAcomodacao({ ...dadosAcomodacao, valorBaseDaDiaria: Number(e.target.value) })} /></Campo><Campo titulo="Situação"><select value={dadosAcomodacao.situacao} onChange={(e) => definirDadosAcomodacao({ ...dadosAcomodacao, situacao: e.target.value })}><option value="disponivel">Disponível</option><option value="ocupada">Ocupada</option><option value="limpeza">Limpeza</option><option value="manutencao">Manutenção</option><option value="inativa">Inativa</option></select></Campo>{acomodacaoEmEdicaoId && <button type="button" className="botao-perigo" onClick={removerAcomodacaoSelecionada}>Excluir acomodação</button>}<Acoes fechar={() => { definirAcomodacaoEmEdicaoId(null); definirJanela(null); }} texto={acomodacaoEmEdicaoId ? 'Salvar alterações' : 'Salvar acomodação'} /></form>}
      {janela === 'hospede' && <form onSubmit={salvarHospede}><Campo titulo="Nome completo"><input required value={dadosHospede.nomeCompleto} onChange={(e) => definirDadosHospede({ ...dadosHospede, nomeCompleto: e.target.value })} /></Campo><Campo titulo="CPF"><input value={dadosHospede.cpf} onChange={(e) => definirDadosHospede({ ...dadosHospede, cpf: e.target.value })} placeholder="000.000.000-00" /></Campo><Campo titulo="Telefone"><input required value={dadosHospede.telefone} onChange={(e) => definirDadosHospede({ ...dadosHospede, telefone: e.target.value })} /></Campo><Campo titulo="E-mail"><input type="email" value={dadosHospede.email} onChange={(e) => definirDadosHospede({ ...dadosHospede, email: e.target.value })} /></Campo><Acoes fechar={() => definirJanela(null)} texto="Salvar hóspede" /></form>}
      {janela === 'usuario' && <form onSubmit={salvarUsuario}><Campo titulo="Nome"><input required minLength={2} value={dadosUsuario.nome} onChange={(e) => definirDadosUsuario({ ...dadosUsuario, nome: e.target.value })} /></Campo><Campo titulo="Usuário de acesso"><input required minLength={3} pattern="[a-zA-Z0-9._-]+" value={dadosUsuario.usuario} onChange={(e) => definirDadosUsuario({ ...dadosUsuario, usuario: e.target.value })} placeholder="Ex.: marina" /></Campo><Campo titulo={usuarioEmEdicaoId ? 'Nova senha (deixe vazia para manter)' : 'Senha'}><input type="password" required={!usuarioEmEdicaoId} minLength={10} value={dadosUsuario.senha} onChange={(e) => definirDadosUsuario({ ...dadosUsuario, senha: e.target.value })} autoComplete="new-password" /></Campo><Campo titulo="Nível de acesso"><select value={dadosUsuario.perfil} disabled={dadosUsuario.perfil === 'administrador_principal'} onChange={(e) => definirDadosUsuario({ ...dadosUsuario, perfil: e.target.value as UsuarioDoSistema['perfil'] })}><option value="operador">Operador</option><option value="administrador">Administrador</option>{dadosUsuario.perfil === 'administrador_principal' && <option value="administrador_principal">Administrador principal</option>}</select></Campo><Campo titulo="Situação"><select value={dadosUsuario.ativo ? 'ativo' : 'inativo'} onChange={(e) => definirDadosUsuario({ ...dadosUsuario, ativo: e.target.value === 'ativo' })}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></Campo><Acoes fechar={() => { definirUsuarioEmEdicaoId(null); definirJanela(null); }} texto={usuarioEmEdicaoId ? 'Salvar alterações' : 'Cadastrar usuário'} /></form>}
      {janela === 'reserva' && <form onSubmit={salvarReserva}>
        <Campo titulo="Acomodação disponível"><select required value={dadosReserva.acomodacaoId} onChange={(e) => definirDadosReserva(atualizarReservaComValor(dadosReserva, { acomodacaoId: e.target.value }, acomodacoes, regrasDePreco))}><option value="">{acomodacoesDisponiveisParaReserva.length ? 'Selecione' : 'Nenhuma disponível neste período'}</option>{acomodacoesDisponiveisParaReserva.map((item) => <option key={item.id} value={item.id}>{item.identificacao} • até {item.capacidadeDePessoas} pessoas</option>)}</select></Campo>
        <Campo titulo="Hóspede responsável"><select required value={dadosReserva.hospedeResponsavelId} onChange={(e) => definirDadosReserva({ ...dadosReserva, hospedeResponsavelId: e.target.value })}><option value="">Selecione</option>{hospedes.map((item) => <option key={item.id} value={item.id}>{item.nomeCompleto}</option>)}</select></Campo>
        <Campo titulo="Data de entrada"><input type="date" required value={dadosReserva.dataDeEntrada} onChange={(e) => definirDadosReserva(atualizarPeriodoDaReserva({ dataDeEntrada: e.target.value }))} /></Campo>
        <Campo titulo="Hora de entrada"><input type="time" required value={dadosReserva.horaDeEntrada} onChange={(e) => definirDadosReserva(atualizarPeriodoDaReserva({ horaDeEntrada: e.target.value }))} /></Campo>
        <Campo titulo="Data de saída"><input type="date" required value={dadosReserva.dataDeSaida} onChange={(e) => definirDadosReserva(atualizarPeriodoDaReserva({ dataDeSaida: e.target.value }))} /></Campo>
        <Campo titulo="Hora de saída"><input type="time" required value={dadosReserva.horaDeSaida} onChange={(e) => definirDadosReserva(atualizarPeriodoDaReserva({ horaDeSaida: e.target.value }))} /></Campo>
        <Campo titulo="Quantidade de hóspedes"><input type="number" min="1" required value={dadosReserva.quantidadeDeHospedes} onChange={(e) => definirDadosReserva({ ...dadosReserva, quantidadeDeHospedes: Number(e.target.value) })} /></Campo>
        <Campo titulo="Tipo de locação"><select value={dadosReserva.tipoDeLocacao} onChange={(e) => definirDadosReserva(atualizarTipoDaReserva(e.target.value))}><option value="diaria">Diária (1 noite)</option><option value="semanal">Semanal (7 noites)</option><option value="mensal">Mensal (30 noites)</option><option value="personalizada">Personalizada</option></select></Campo>
        <Campo titulo="Valor calculado"><input className="valor-calculado" type="number" readOnly value={dadosReserva.valorCalculado} /></Campo>
        <Campo titulo="Ajuste (+ acréscimo / − desconto)"><input type="number" step="0.01" value={dadosReserva.ajusteNoValor} onChange={(e) => definirDadosReserva(atualizarAjusteNoValor(dadosReserva, Number(e.target.value)))} /></Campo>
        <Campo titulo="Valor negociado (final)"><input type="number" min="0" step="0.01" required value={dadosReserva.valorTotal} onChange={(e) => definirDadosReserva(atualizarValorNegociado(dadosReserva, Number(e.target.value)))} /></Campo>
        <Campo titulo="Situação"><select value={dadosReserva.situacao} onChange={(e) => definirDadosReserva({ ...dadosReserva, situacao: e.target.value })}><option value="orcamento">Orçamento</option><option value="confirmada">Confirmada</option><option value="em_andamento">Em andamento</option><option value="concluida">Concluída</option><option value="cancelada">Cancelada</option></select></Campo>
        <Campo titulo="Motivo do ajuste"><input required={dadosReserva.ajusteNoValor !== 0} maxLength={300} value={dadosReserva.motivoDoAjuste} onChange={(e) => definirDadosReserva({ ...dadosReserva, motivoDoAjuste: e.target.value })} placeholder="Ex.: desconto para cliente recorrente ou taxa por dano" /></Campo>
        <div className={`resumo-negociacao ${dadosReserva.ajusteNoValor < 0 ? 'desconto' : dadosReserva.ajusteNoValor > 0 ? 'acrescimo' : ''}`}><span>Calculado <b>{formatarDinheiro(dadosReserva.valorCalculado)}</b></span><span>{dadosReserva.ajusteNoValor < 0 ? 'Desconto' : dadosReserva.ajusteNoValor > 0 ? 'Acréscimo' : 'Ajuste'} <b>{formatarDinheiro(Math.abs(dadosReserva.ajusteNoValor))}</b></span><strong>Total final {formatarDinheiro(dadosReserva.valorTotal)}</strong></div>
        <p className="explicacao-preco">O valor calculado segue as diárias do período. Você pode aplicar um ajuste positivo ou negativo, ou editar diretamente o valor final negociado.</p>
        <Acoes fechar={() => { definirReservaEmEdicaoId(null); definirJanela(null); }} texto={reservaEmEdicaoId ? 'Salvar alterações' : 'Confirmar reserva'} />
      </form>}
      {janela === 'regra-preco' && <form onSubmit={salvarRegraDePreco}><Campo titulo="Nome do período"><input required placeholder="Ex.: Alta temporada de verão" value={dadosRegraDePreco.nome} onChange={(e) => definirDadosRegraDePreco({ ...dadosRegraDePreco, nome: e.target.value })} /></Campo><Campo titulo="Aplicação"><select value={dadosRegraDePreco.acomodacaoId} onChange={(e) => definirDadosRegraDePreco({ ...dadosRegraDePreco, acomodacaoId: e.target.value })}><option value="">Todas as acomodações (regra geral)</option>{acomodacoes.map((item) => <option key={item.id} value={item.id}>Somente {item.identificacao}</option>)}</select></Campo><Campo titulo="Data inicial"><input type="date" required value={dadosRegraDePreco.dataInicial} onChange={(e) => definirDadosRegraDePreco({ ...dadosRegraDePreco, dataInicial: e.target.value })} /></Campo><Campo titulo="Data final (inclusive)"><input type="date" required value={dadosRegraDePreco.dataFinal} onChange={(e) => definirDadosRegraDePreco({ ...dadosRegraDePreco, dataFinal: e.target.value })} /></Campo><Campo titulo="Valor da diária no período"><input type="number" min="0.01" step="0.01" required value={dadosRegraDePreco.valorDaDiaria} onChange={(e) => definirDadosRegraDePreco({ ...dadosRegraDePreco, valorDaDiaria: Number(e.target.value) })} /></Campo><Acoes fechar={() => definirJanela(null)} texto="Salvar regra" /></form>}
      {janela === 'detalhes-hospede' && hospedeSelecionado && <FichaDoHospede hospede={hospedeSelecionado} reservas={reservas} acomodacoes={acomodacoes} editarReserva={editarReserva} />}
      {janela === 'acao-dia' && diaSelecionado && <div className="acoes-do-dia"><p>O que deseja fazer nesta data?</p><button className="acao-dia-reserva" disabled={quantidadeLivreNoDiaSelecionado === 0} onClick={() => abrirReservaNoDia(diaSelecionado)}><b>＋ Criar reserva</b><span>{quantidadeLivreNoDiaSelecionado > 0 ? `${quantidadeLivreNoDiaSelecionado} acomodação(ões) disponível(is) para reservar.` : 'Nenhuma acomodação disponível nessa data.'}</span></button><button className="acao-dia-bloqueio" onClick={abrirBloqueioNoDia}><b>⊘ Bloquear data</b><span>Marcar indisponibilidade sem criar uma reserva.</span></button></div>}
      {janela === 'bloqueio' && <form onSubmit={salvarBloqueio}><Campo titulo="Acomodação"><select required value={dadosBloqueio.acomodacaoId} onChange={(e) => definirDadosBloqueio({ ...dadosBloqueio, acomodacaoId: e.target.value })}><option value="">Selecione</option>{acomodacoes.map((item) => <option key={item.id} value={item.id}>{item.identificacao}</option>)}</select></Campo><Campo titulo="Motivo"><input required value={dadosBloqueio.motivo} onChange={(e) => definirDadosBloqueio({ ...dadosBloqueio, motivo: e.target.value })} placeholder="Ex.: manutenção ou uso particular" /></Campo><Campo titulo="Data inicial"><input type="date" required value={dadosBloqueio.dataInicial} onChange={(e) => definirDadosBloqueio({ ...dadosBloqueio, dataInicial: e.target.value })} /></Campo><Campo titulo="Data final (inclusive)"><input type="date" required value={dadosBloqueio.dataFinal} onChange={(e) => definirDadosBloqueio({ ...dadosBloqueio, dataFinal: e.target.value })} /></Campo><Acoes fechar={() => definirJanela(null)} texto="Confirmar bloqueio" /></form>}
      {janela === 'vistoria' && <form onSubmit={salvarVistoria}><Campo titulo="Reserva"><select required value={dadosVistoria.reservaId} onChange={(e) => { const reserva = reservas.find((item) => item.id === e.target.value); definirDadosVistoria({ ...dadosVistoria, reservaId: e.target.value, acomodacaoId: reserva?.acomodacaoId ?? '' }); }}><option value="">Selecione</option>{reservas.filter((item) => item.situacao !== 'cancelada').map((item) => <option key={item.id} value={item.id}>{nomeDaAcomodacao(item.acomodacaoId)} • {nomeDoHospede(item.hospedeResponsavelId)} • {formatarData(item.dataDeEntrada)}</option>)}</select></Campo><Campo titulo="Tipo"><select value={dadosVistoria.tipo} onChange={(e) => definirDadosVistoria({ ...dadosVistoria, tipo: e.target.value })}><option value="entrada">Antes da entrada</option><option value="saida">Após a saída</option></select></Campo><Campo titulo="Data da vistoria"><input type="date" required value={dadosVistoria.dataDaVistoria} onChange={(e) => definirDadosVistoria({ ...dadosVistoria, dataDaVistoria: e.target.value })} /></Campo><Campo titulo="Responsável"><input required value={dadosVistoria.responsavel} onChange={(e) => definirDadosVistoria({ ...dadosVistoria, responsavel: e.target.value })} placeholder="Quem realizou a vistoria" /></Campo><div className="checklist-vistoria"><b>Checklist</b>{dadosVistoria.itens.map((item, indice) => <div key={item.nome}><label className="item-conforme"><input type="checkbox" checked={item.conforme} onChange={(e) => definirDadosVistoria({ ...dadosVistoria, itens: dadosVistoria.itens.map((atual, atualIndice) => atualIndice === indice ? { ...atual, conforme: e.target.checked } : atual) })} /><span>{item.nome}</span></label><input value={item.observacao} onChange={(e) => definirDadosVistoria({ ...dadosVistoria, itens: dadosVistoria.itens.map((atual, atualIndice) => atualIndice === indice ? { ...atual, observacao: e.target.value } : atual) })} placeholder="Observação do item" /></div>)}</div><Campo titulo="Situação"><select value={dadosVistoria.situacao} onChange={(e) => definirDadosVistoria({ ...dadosVistoria, situacao: e.target.value })}><option value="pendente">Pendente</option><option value="concluida">Concluída</option></select></Campo><Campo titulo="Observações gerais"><textarea value={dadosVistoria.observacoes} onChange={(e) => definirDadosVistoria({ ...dadosVistoria, observacoes: e.target.value })} /></Campo><Acoes fechar={() => definirJanela(null)} texto={vistoriaEmEdicaoId ? 'Salvar vistoria' : 'Cadastrar vistoria'} /></form>}
      {janela === 'financeiro' && <form onSubmit={salvarLancamento}><Campo titulo="Tipo"><select value={dadosLancamento.tipo} onChange={(e) => definirDadosLancamento({ ...dadosLancamento, tipo: e.target.value, categoria: e.target.value === 'receita' ? 'Hospedagem' : 'Manutenção' })}><option value="receita">Receita</option><option value="despesa">Despesa</option></select></Campo><Campo titulo="Descrição"><input required value={dadosLancamento.descricao} onChange={(e) => definirDadosLancamento({ ...dadosLancamento, descricao: e.target.value })} /></Campo><Campo titulo="Categoria"><input required value={dadosLancamento.categoria} onChange={(e) => definirDadosLancamento({ ...dadosLancamento, categoria: e.target.value })} list="categorias-financeiras" /><datalist id="categorias-financeiras"><option value="Hospedagem" /><option value="Limpeza" /><option value="Manutenção" /><option value="Reposição" /><option value="Impostos" /><option value="Outros" /></datalist></Campo><Campo titulo="Valor"><input type="number" min="0.01" step="0.01" required value={dadosLancamento.valor} onChange={(e) => definirDadosLancamento({ ...dadosLancamento, valor: Number(e.target.value) })} /></Campo><Campo titulo="Vencimento"><input type="date" required value={dadosLancamento.dataDeVencimento} onChange={(e) => definirDadosLancamento({ ...dadosLancamento, dataDeVencimento: e.target.value })} /></Campo><Campo titulo="Situação"><select value={dadosLancamento.situacao} onChange={(e) => definirDadosLancamento({ ...dadosLancamento, situacao: e.target.value, dataDePagamento: e.target.value === 'pago' ? dadosLancamento.dataDePagamento || hoje : '' })}><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="cancelado">Cancelado</option></select></Campo><Campo titulo="Data do pagamento"><input type="date" value={dadosLancamento.dataDePagamento} onChange={(e) => definirDadosLancamento({ ...dadosLancamento, dataDePagamento: e.target.value })} /></Campo><Campo titulo="Reserva vinculada (opcional)"><select value={dadosLancamento.reservaId} onChange={(e) => definirDadosLancamento({ ...dadosLancamento, reservaId: e.target.value })}><option value="">Sem vínculo</option>{reservas.map((item) => <option key={item.id} value={item.id}>{nomeDaAcomodacao(item.acomodacaoId)} • {nomeDoHospede(item.hospedeResponsavelId)}</option>)}</select></Campo><Campo titulo="Observações"><textarea value={dadosLancamento.observacoes} onChange={(e) => definirDadosLancamento({ ...dadosLancamento, observacoes: e.target.value })} /></Campo><Acoes fechar={() => definirJanela(null)} texto={lancamentoEmEdicaoId ? 'Salvar lançamento' : 'Cadastrar lançamento'} /></form>}
    </section></div>}
  </div>;
}

function Campo({ titulo, children }: { titulo: string; children: React.ReactNode }) { return <label>{titulo}{children}</label>; }
function Acoes({ fechar, texto }: { fechar: () => void; texto: string }) { return <div className="acoes"><button type="button" className="botao-secundario" onClick={fechar}>Cancelar</button><button className="botao-principal">{texto}</button></div>; }
function Estado({ texto }: { texto: string }) { return <div className="estado"><b>{texto}</b></div>; }
function TabelaVaziaOuConteudo({ vazia, textoVazio, children }: { vazia: boolean; textoVazio: string; children: React.ReactNode }) { return vazia ? <Estado texto={textoVazio} /> : <section className="tabela">{children}</section>; }
function formatarData(data: string) { return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(data)); }
function formatarDinheiro(valor: number) { return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function minutosDoHorario(horario: string) { const [hora, minuto] = horario.split(':').map(Number); return hora * 60 + minuto; }

function descricaoDaSecao(secao: Secao) {
  const descricoes: Record<Secao, string> = { 'visao-geral': 'Acompanhe ocupação, entradas, saídas e receita.', acomodacoes: 'Controle qualquer quantidade de unidades.', hospedes: 'Cadastre clientes e consulte o histórico.', reservas: 'Controle períodos, capacidade e valores.', agenda: 'Veja quando cada acomodação estará livre ou ocupada.', vistorias: 'Registre o estado da acomodação antes da entrada e após a saída.', financeiro: 'Controle receitas, despesas, vencimentos e pagamentos.', configuracoes: 'Defina preços sazonais gerais ou específicos por acomodação.' };
  return descricoes[secao];
}

function PainelDeVistorias({ vistorias, reservas, acomodacoes, editar }: { vistorias: Vistoria[]; reservas: Reserva[]; acomodacoes: Acomodacao[]; editar: (vistoria: Vistoria) => void }) {
  const pendentes = vistorias.filter((item) => item.situacao === 'pendente').length;
  const comProblemas = vistorias.filter((item) => item.itens.some((check) => !check.conforme)).length;
  const nomeDaAcomodacao = (id: string) => acomodacoes.find((item) => item.id === id)?.identificacao ?? 'Acomodação';
  return <><section className="indicadores"><article><span>Total de vistorias</span><strong>{vistorias.length}</strong></article><article><span>Pendentes</span><strong>{pendentes}</strong></article><article><span>Com apontamentos</span><strong>{comProblemas}</strong></article></section><TabelaVaziaOuConteudo vazia={!vistorias.length} textoVazio="Nenhuma vistoria cadastrada"><table><thead><tr><th>Acomodação</th><th>Tipo</th><th>Data</th><th>Responsável</th><th>Checklist</th><th>Situação</th><th></th></tr></thead><tbody>{vistorias.map((item) => { const reserva = reservas.find((atual) => atual.id === item.reservaId); const conformes = item.itens.filter((check) => check.conforme).length; return <tr key={item.id}><td><b>{nomeDaAcomodacao(item.acomodacaoId)}</b><small className="detalhe-tabela">{reserva ? `${formatarData(reserva.dataDeEntrada)} a ${formatarData(reserva.dataDeSaida)}` : 'Reserva não encontrada'}</small></td><td>{item.tipo === 'entrada' ? 'Antes da entrada' : 'Após a saída'}</td><td>{formatarData(item.dataDaVistoria)}</td><td>{item.responsavel}</td><td><span className={conformes === item.itens.length ? 'check-ok' : 'check-alerta'}>{conformes}/{item.itens.length} conformes</span></td><td><span className={`situacao ${item.situacao}`}>{item.situacao}</span></td><td><button className="botao-tabela" onClick={() => editar(item)}>Abrir</button></td></tr>; })}</tbody></table></TabelaVaziaOuConteudo></>;
}

function PainelFinanceiro({ lancamentos, reservas, editar }: { lancamentos: LancamentoFinanceiro[]; reservas: Reserva[]; editar: (item: LancamentoFinanceiro) => void }) {
  const pagos = lancamentos.filter((item) => item.situacao === 'pago');
  const receitas = pagos.filter((item) => item.tipo === 'receita').reduce((total, item) => total + item.valor, 0);
  const despesas = pagos.filter((item) => item.tipo === 'despesa').reduce((total, item) => total + item.valor, 0);
  const pendente = lancamentos.filter((item) => item.situacao === 'pendente').reduce((total, item) => total + (item.tipo === 'receita' ? item.valor : -item.valor), 0);
  return <><section className="indicadores indicadores-financeiros"><article><span>Receitas pagas</span><strong className="valor-receita">{formatarDinheiro(receitas)}</strong></article><article><span>Despesas pagas</span><strong className="valor-despesa">{formatarDinheiro(despesas)}</strong></article><article><span>Saldo realizado</span><strong>{formatarDinheiro(receitas - despesas)}</strong></article><article><span>Saldo pendente</span><strong>{formatarDinheiro(pendente)}</strong></article></section><TabelaVaziaOuConteudo vazia={!lancamentos.length} textoVazio="Nenhum lançamento financeiro cadastrado"><table><thead><tr><th>Descrição</th><th>Tipo</th><th>Categoria</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th>Vínculo</th><th></th></tr></thead><tbody>{lancamentos.map((item) => <tr key={item.id}><td><b>{item.descricao}</b></td><td><span className={`tipo-financeiro ${item.tipo}`}>{item.tipo}</span></td><td>{item.categoria}</td><td>{formatarData(item.dataDeVencimento)}</td><td className={item.tipo === 'receita' ? 'valor-receita' : 'valor-despesa'}><b>{item.tipo === 'despesa' ? '− ' : '+ '}{formatarDinheiro(item.valor)}</b></td><td><span className={`situacao ${item.situacao}`}>{item.situacao}</span></td><td>{item.reservaId && reservas.some((reserva) => reserva.id === item.reservaId) ? 'Reserva' : 'Avulso'}</td><td><button className="botao-tabela" onClick={() => editar(item)}>Editar</button></td></tr>)}</tbody></table></TabelaVaziaOuConteudo></>;
}

function inicioDoDia(data: Date) { const copia = new Date(data); copia.setHours(0, 0, 0, 0); return copia; }
function adicionarDias(data: Date, dias: number) { const copia = new Date(data); copia.setDate(copia.getDate() + dias); return copia; }
function chaveDaData(data: Date) { return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`; }
function dataLocal(data: string) { return new Date(`${data.slice(0, 10)}T00:00:00`); }
function escurecerHex(cor: string, percentual: number) { const valor = cor.replace('#', ''); const fator = 1 - percentual / 100; const canal = (inicio: number) => Math.max(0, Math.round(parseInt(valor.slice(inicio, inicio + 2), 16) * fator)).toString(16).padStart(2, '0'); return `#${canal(0)}${canal(2)}${canal(4)}`; }
function misturarComBranco(cor: string, percentualDaCor: number) { const valor = cor.replace('#', ''); const proporcao = percentualDaCor / 100; const canal = (inicio: number) => Math.round(parseInt(valor.slice(inicio, inicio + 2), 16) * proporcao + 255 * (1 - proporcao)).toString(16).padStart(2, '0'); return `#${canal(0)}${canal(2)}${canal(4)}`; }
function calcularValorSugerido(acomodacaoId: string, entrada: string, saida: string, acomodacoes: Acomodacao[], regras: RegraDePreco[]) {
  const valorBase = acomodacoes.find((item) => item.id === acomodacaoId)?.valorBaseDaDiaria ?? 0;
  let dia = dataLocal(entrada); const fim = dataLocal(saida); let total = 0;
  while (dia < fim) {
    const regrasDoDia = regras.filter((item) => item.ativa && dataLocal(item.dataInicial) <= dia && dataLocal(item.dataFinal) >= dia);
    const especifica = regrasDoDia.find((item) => item.acomodacaoId === acomodacaoId);
    const geral = regrasDoDia.find((item) => item.acomodacaoId === null);
    total += especifica?.valorDaDiaria ?? geral?.valorDaDiaria ?? valorBase;
    dia = adicionarDias(dia, 1);
  }
  return total;
}
function atualizarReservaComValor(atual: typeof novaReserva, alteracao: Partial<typeof novaReserva>, acomodacoes: Acomodacao[], regras: RegraDePreco[]) { const nova = { ...atual, ...alteracao }; const valorCalculado = calcularValorSugerido(nova.acomodacaoId, nova.dataDeEntrada, nova.dataDeSaida, acomodacoes, regras); return { ...nova, valorCalculado, valorTotal: Math.max(0, valorCalculado + nova.ajusteNoValor) }; }
function atualizarAjusteNoValor(atual: typeof novaReserva, ajusteNoValor: number) { return { ...atual, ajusteNoValor, valorTotal: Math.max(0, atual.valorCalculado + ajusteNoValor) }; }
function atualizarValorNegociado(atual: typeof novaReserva, valorTotal: number) { const totalSeguro = Math.max(0, valorTotal); return { ...atual, valorTotal: totalSeguro, ajusteNoValor: totalSeguro - atual.valorCalculado }; }
function atualizarTipoDeLocacao(atual: typeof novaReserva, tipo: string, acomodacoes: Acomodacao[], regras: RegraDePreco[]) { const duracao = tipo === 'diaria' ? 1 : tipo === 'semanal' ? 7 : tipo === 'mensal' ? 30 : null; const dataDeSaida = duracao ? chaveDaData(adicionarDias(dataLocal(atual.dataDeEntrada), duracao)) : atual.dataDeSaida; return atualizarReservaComValor(atual, { tipoDeLocacao: tipo, dataDeSaida }, acomodacoes, regras); }

function VisaoGeral({ acomodacoes, hospedes, reservas, abrirReserva, abrirAgenda, editarReserva }: { acomodacoes: Acomodacao[]; hospedes: Hospede[]; reservas: Reserva[]; abrirReserva: () => void; abrirAgenda: () => void; editarReserva: (reserva: Reserva) => void }) {
  const hojeLocal = inicioDoDia(new Date());
  const ativas = reservas.filter((item) => item.situacao !== 'cancelada');
  const ocupadasHoje = new Set(ativas.filter((item) => dataLocal(item.dataDeEntrada) <= hojeLocal && dataLocal(item.dataDeSaida) > hojeLocal).map((item) => item.acomodacaoId)).size;
  const entradasHoje = ativas.filter((item) => chaveDaData(dataLocal(item.dataDeEntrada)) === chaveDaData(hojeLocal)).length;
  const saidasHoje = ativas.filter((item) => chaveDaData(dataLocal(item.dataDeSaida)) === chaveDaData(hojeLocal)).length;
  const receita = ativas.filter((item) => { const data = dataLocal(item.dataDeEntrada); return data.getMonth() === hojeLocal.getMonth() && data.getFullYear() === hojeLocal.getFullYear(); }).reduce((total, item) => total + item.valorTotal, 0);
  const proximas = ativas.filter((item) => dataLocal(item.dataDeEntrada) >= hojeLocal).sort((a, b) => a.dataDeEntrada.localeCompare(b.dataDeEntrada)).slice(0, 5);
  return <><section className="indicadores indicadores-painel"><article><span>Ocupação hoje</span><strong>{ocupadasHoje} de {acomodacoes.length}</strong></article><article><span>Entradas hoje</span><strong>{entradasHoje}</strong></article><article><span>Saídas hoje</span><strong>{saidasHoje}</strong></article><article><span>Receita prevista no mês</span><strong>{receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></article></section><section className="painel-acoes"><div><h2>Próximas reservas</h2><p>{proximas.length ? `${proximas.length} reserva(s) chegando` : 'Nenhuma entrada futura cadastrada'}</p></div><div className="botoes-painel"><button className="botao-secundario" onClick={abrirAgenda}>Ver agenda</button><button className="botao-principal" onClick={abrirReserva} disabled={!acomodacoes.length || !hospedes.length}>＋ Nova reserva</button></div></section>{proximas.length > 0 && <section className="lista-proximas">{proximas.map((reserva) => <button key={reserva.id} onClick={() => editarReserva(reserva)}><span className="data-proxima">{formatarData(reserva.dataDeEntrada)}</span><div><b>{hospedes.find((item) => item.id === reserva.hospedeResponsavelId)?.nomeCompleto ?? 'Hóspede'}</b><small>{acomodacoes.find((item) => item.id === reserva.acomodacaoId)?.identificacao ?? 'Acomodação'}</small></div><strong>{reserva.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></button>)}</section>}</>;
}

function AgendaDeDisponibilidade({ acomodacoes, hospedes, reservas, bloqueios, regrasDePreco, inicio, mudarInicio, editarReserva, escolherAcaoDoDia }: { acomodacoes: Acomodacao[]; hospedes: Hospede[]; reservas: Reserva[]; bloqueios: BloqueioDeAgenda[]; regrasDePreco: RegraDePreco[]; inicio: Date; mudarInicio: (data: Date) => void; editarReserva: (reserva: Reserva) => void; escolherAcaoDoDia: (data: Date) => void }) {
  const [visao, definirVisao] = useState<'mes' | 'semana' | 'dia'>('mes');
  const reservasAtivas = reservas.filter((item) => item.situacao !== 'cancelada');
  const primeiroDoMes = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
  const primeiroDaSemana = adicionarDias(inicioDoDia(inicio), -inicio.getDay());
  const diasDoMes = Array.from({ length: 42 }, (_, indice) => adicionarDias(adicionarDias(primeiroDoMes, -primeiroDoMes.getDay()), indice));
  const diasDaSemana = Array.from({ length: 7 }, (_, indice) => adicionarDias(primeiroDaSemana, indice));
  function reservasNoDia(dia: Date) { return reservasAtivas.filter((item) => dataLocal(item.dataDeEntrada) <= dia && dataLocal(item.dataDeSaida) >= dia).sort((a, b) => a.dataDeEntrada.localeCompare(b.dataDeEntrada)); }
  function bloqueiosNoDia(dia: Date) { return bloqueios.filter((item) => dataLocal(item.dataInicial) <= dia && dataLocal(item.dataFinal) >= dia); }
  function nomeDaAcomodacao(id: string) { return acomodacoes.find((item) => item.id === id)?.identificacao ?? 'Unidade'; }
  function nomeDoHospede(id: string) { return hospedes.find((item) => item.id === id)?.nomeCompleto ?? 'Hóspede'; }
  function acomodacoesLivresNoDia(dia: Date) { const entrada = combinarDataEHora(chaveDaData(dia), '14:00'); const saida = combinarDataEHora(chaveDaData(adicionarDias(dia, 1)), '11:00'); const bloqueiosDoDia = bloqueiosNoDia(dia); return acomodacoes.filter((acomodacao) => acomodacao.situacao !== 'manutencao' && acomodacao.situacao !== 'inativa' && !reservasAtivas.some((reserva) => reserva.acomodacaoId === acomodacao.id && entrada < combinarDataEHora(reserva.dataDeSaida, reserva.horaDeSaida ?? '11:00') && saida > combinarDataEHora(reserva.dataDeEntrada, reserva.horaDeEntrada ?? '14:00')) && !bloqueiosDoDia.some((bloqueio) => bloqueio.acomodacaoId === acomodacao.id)); }
  function mudarPeriodo(quantidade: number) { if (visao === 'mes') mudarInicio(new Date(inicio.getFullYear(), inicio.getMonth() + quantidade, 1)); else mudarInicio(adicionarDias(inicio, quantidade * (visao === 'semana' ? 7 : 1))); }
  function tituloDaAgenda() { if (visao === 'mes') return inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); if (visao === 'dia') return inicio.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }); const fim = adicionarDias(primeiroDaSemana, 6); return `${primeiroDaSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${fim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`; }
  function tipoDoEvento(reserva: Reserva, dia: Date) { const chave = chaveDaData(dia); return chave === reserva.dataDeSaida.slice(0, 10) ? 'saida' : chave === reserva.dataDeEntrada.slice(0, 10) ? 'entrada' : 'em-andamento'; }
  function eventoDaReserva(reserva: Reserva, dia: Date) { const tipo = tipoDoEvento(reserva, dia); const descricao = tipo === 'saida' ? `Saída ${reserva.horaDeSaida ?? '11:00'}` : tipo === 'entrada' ? `Entrada ${reserva.horaDeEntrada ?? '14:00'}` : 'Em andamento'; return <button key={reserva.id} className={`evento-reserva ${tipo}`} onClick={() => editarReserva(reserva)} title={`${nomeDoHospede(reserva.hospedeResponsavelId)} • entrada ${formatarData(reserva.dataDeEntrada)} às ${reserva.horaDeEntrada ?? '14:00'} • saída ${formatarData(reserva.dataDeSaida)} às ${reserva.horaDeSaida ?? '11:00'}`}><b>{nomeDaAcomodacao(reserva.acomodacaoId)} • {descricao}</b><span>{nomeDoHospede(reserva.hospedeResponsavelId)}</span></button>; }
  function bloqueiosDoCalendario(dia: Date) { return bloqueiosNoDia(dia).map((bloqueio) => <div key={bloqueio.id} className="evento-bloqueio" title={bloqueio.motivo}><b>⊘ {nomeDaAcomodacao(bloqueio.acomodacaoId)}</b><span>{bloqueio.motivo}</span></div>); }
  const hojeLocal = chaveDaData(new Date());
  return <section className="agenda">
    <header className="cabecalho-agenda"><div><b>{tituloDaAgenda()}</b><small>{reservasAtivas.length} reserva(s) ativa(s) • {bloqueios.length} bloqueio(s)</small></div><div className="controles-agenda"><div className="navegacao-agenda"><button onClick={() => mudarPeriodo(-1)} aria-label="Período anterior">‹</button><button onClick={() => mudarInicio(inicioDoDia(new Date()))}>Hoje</button><button onClick={() => mudarPeriodo(1)} aria-label="Próximo período">›</button></div><div className="seletor-visao" aria-label="Visualização da agenda">{(['mes', 'semana', 'dia'] as const).map((opcao) => <button key={opcao} className={visao === opcao ? 'ativa' : ''} onClick={() => definirVisao(opcao)}>{opcao === 'mes' ? 'Mês' : opcao === 'semana' ? 'Semana' : 'Dia'}</button>)}</div></div></header>
    {!acomodacoes.length ? <Estado texto="Cadastre uma acomodação para montar a agenda" /> : visao === 'mes' ? <div className="calendario"><div className="dias-da-semana">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((nome) => <span key={nome}>{nome}</span>)}</div><div className="mes-calendario">{diasDoMes.map((dia) => { const livres = acomodacoesLivresNoDia(dia); const foraDoMes = dia.getMonth() !== inicio.getMonth(); const menorValor = livres.length ? Math.min(...livres.map((item) => calcularValorSugerido(item.id, chaveDaData(dia), chaveDaData(adicionarDias(dia, 1)), acomodacoes, regrasDePreco))) : null; const passado = inicioDoDia(dia) < inicioDoDia(new Date()); return <article key={chaveDaData(dia)} className={`celula-dia${foraDoMes ? ' fora-do-mes' : ''}${chaveDaData(dia) === hojeLocal ? ' hoje' : ''}${!livres.length ? ' lotado' : ''}`}><button className="botao-dia" disabled={passado} onClick={() => escolherAcaoDoDia(dia)}><span><time>{dia.getDate()}</time>{!foraDoMes && <small>{livres.length} livre(s)</small>}</span>{!foraDoMes && menorValor !== null && !passado && <strong>{formatarDinheiro(menorValor)}</strong>}</button><div className="eventos-do-dia">{reservasNoDia(dia).map((reserva) => eventoDaReserva(reserva, dia))}{bloqueiosDoCalendario(dia)}</div></article>; })}</div></div> : visao === 'semana' ? <div className="grade-semana">{diasDaSemana.map((dia) => { const livres = acomodacoesLivresNoDia(dia); const passado = inicioDoDia(dia) < inicioDoDia(new Date()); return <article key={chaveDaData(dia)} className={chaveDaData(dia) === hojeLocal ? 'hoje' : ''}><button className="cabecalho-dia-semana" disabled={passado} onClick={() => escolherAcaoDoDia(dia)}><span>{dia.toLocaleDateString('pt-BR', { weekday: 'short' })}</span><b>{dia.getDate()}</b><small>{livres.length} livre(s)</small></button><div>{reservasNoDia(dia).map((reserva) => eventoDaReserva(reserva, dia))}{bloqueiosDoCalendario(dia)}</div></article>; })}</div> : <div className="visao-dia"><div className="cabecalho-visao-dia"><div><span>{inicio.toLocaleDateString('pt-BR', { weekday: 'long' })}</span><b>{inicio.getDate()}</b><small>{acomodacoesLivresNoDia(inicio).length} acomodação(ões) livre(s)</small></div><button className="botao-principal" disabled={inicioDoDia(inicio) < inicioDoDia(new Date())} onClick={() => escolherAcaoDoDia(inicio)}>＋ Reserva ou bloqueio</button></div><div className="linha-do-tempo">{Array.from({ length: 18 }, (_, indice) => indice + 6).map((hora) => <div className="hora-agenda" key={hora}><time>{String(hora).padStart(2, '0')}:00</time><span /></div>)}<div className="eventos-linha-do-tempo">{reservasNoDia(inicio).map((reserva) => { const comecaHoje = reserva.dataDeEntrada.slice(0, 10) === chaveDaData(inicio); const terminaHoje = reserva.dataDeSaida.slice(0, 10) === chaveDaData(inicio); const inicioEmMinutos = comecaHoje ? minutosDoHorario(reserva.horaDeEntrada ?? '14:00') : 360; const fimEmMinutos = terminaHoje ? minutosDoHorario(reserva.horaDeSaida ?? '11:00') : 1440; const topo = Math.max(0, (inicioEmMinutos - 360) / 60 * 52); const altura = Math.max(38, (Math.min(1440, fimEmMinutos) - Math.max(360, inicioEmMinutos)) / 60 * 52); const coluna = Math.max(0, acomodacoes.findIndex((item) => item.id === reserva.acomodacaoId)); const largura = 100 / Math.max(1, acomodacoes.length); const periodo = comecaHoje && terminaHoje ? `${reserva.horaDeEntrada ?? '14:00'}–${reserva.horaDeSaida ?? '11:00'}` : comecaHoje ? `A partir de ${reserva.horaDeEntrada ?? '14:00'}` : terminaHoje ? `Até ${reserva.horaDeSaida ?? '11:00'}` : 'Dia inteiro'; return <button key={reserva.id} className={`evento-horario ${tipoDoEvento(reserva, inicio)}`} style={{ top: topo, height: altura, left: `calc(${coluna * largura}% + 4px)`, width: `calc(${largura}% - 8px)` }} onClick={() => editarReserva(reserva)}><b>{periodo} • {nomeDaAcomodacao(reserva.acomodacaoId)}</b><span>{nomeDoHospede(reserva.hospedeResponsavelId)}</span></button>; })}</div></div></div>}
  </section>;
}

function ConfiguracaoDePrecos({ regras, acomodacoes, corPrincipal, coresRecentes, alterarCorPrincipal, usuarios, abrirUsuario, perfilAtual }: { regras: RegraDePreco[]; acomodacoes: Acomodacao[]; corPrincipal: string; coresRecentes: string[]; alterarCorPrincipal: (cor: string) => Promise<void>; usuarios: UsuarioDoSistema[]; abrirUsuario: (usuario?: UsuarioDoSistema) => void; perfilAtual: UsuarioDoSistema['perfil'] }) {
  const [corDigitada, definirCorDigitada] = useState(corPrincipal);
  useEffect(() => definirCorDigitada(corPrincipal), [corPrincipal]);
  const nomeDoPerfil = (perfil: UsuarioDoSistema['perfil']) => perfil === 'administrador_principal' ? 'Administrador principal' : perfil === 'administrador' ? 'Administrador' : 'Operador';
  return <><section className="configuracao-cor"><div><b>Cor do sistema</b><p>Escolha uma cor recente ou informe qualquer cor hexadecimal.</p></div><div className="cores-recentes">{coresRecentes.map((cor) => <button key={cor} className={cor.toUpperCase() === corPrincipal.toUpperCase() ? 'selecionada' : ''} style={{ backgroundColor: cor }} onClick={() => alterarCorPrincipal(cor)} title={`Usar ${cor}`} aria-label={`Usar cor ${cor}`} />)}</div><div className="cor-personalizada"><input type="color" value={corDigitada} onChange={(evento) => definirCorDigitada(evento.target.value.toUpperCase())} aria-label="Selecionar cor" /><input value={corDigitada} maxLength={7} onChange={(evento) => definirCorDigitada(evento.target.value.toUpperCase())} aria-label="Código hexadecimal" /><button className="botao-principal" onClick={() => alterarCorPrincipal(corDigitada)} disabled={!/^#[0-9A-F]{6}$/.test(corDigitada)}>Aplicar cor</button></div></section>{perfilAtual !== 'operador' && <section className="usuarios-configuracao"><div className="titulo-configuracao"><div><b>Usuários e acessos</b><p>Cadastre pessoas autorizadas, defina níveis, redefina senhas ou suspenda acessos.</p></div><button className="botao-principal" onClick={() => abrirUsuario()}>＋ Novo usuário</button></div><TabelaVaziaOuConteudo vazia={!usuarios.length} textoVazio="Nenhum usuário cadastrado"><table><thead><tr><th>Nome</th><th>Usuário</th><th>Nível</th><th>Situação</th><th></th></tr></thead><tbody>{usuarios.map((usuario) => <tr key={usuario.id}><td><b>{usuario.nome}</b></td><td>{usuario.usuario}</td><td>{nomeDoPerfil(usuario.perfil)}</td><td><span className={`situacao ${usuario.ativo ? 'disponivel' : 'inativa'}`}>{usuario.ativo ? 'Ativo' : 'Inativo'}</span></td><td><button className="botao-tabela" onClick={() => abrirUsuario(usuario)}>Editar</button></td></tr>)}</tbody></table></TabelaVaziaOuConteudo></section>}<section className="ordem-precos"><b>Ordem usada no cálculo</b><div><span>1. Regra específica da acomodação</span><span>2. Regra geral do período</span><span>3. Diária-base da acomodação</span></div><p>Semanal, mensal ou personalizada: o total sempre corresponde à quantidade de noites × o valor aplicável em cada noite.</p></section><TabelaVaziaOuConteudo vazia={!regras.length} textoVazio="Nenhuma regra sazonal cadastrada"><table><thead><tr><th>Período</th><th>Vigência</th><th>Aplicação</th><th>Diária</th><th>Situação</th></tr></thead><tbody>{regras.map((regra) => <tr key={regra.id}><td><b>{regra.nome}</b></td><td>{formatarData(regra.dataInicial)} a {formatarData(regra.dataFinal)}</td><td>{regra.acomodacaoId ? acomodacoes.find((item) => item.id === regra.acomodacaoId)?.identificacao ?? 'Acomodação' : 'Todas as acomodações'}</td><td><b>{regra.valorDaDiaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b></td><td><span className="situacao">{regra.ativa ? 'Ativa' : 'Inativa'}</span></td></tr>)}</tbody></table></TabelaVaziaOuConteudo></>;
}

function FichaDoHospede({ hospede, reservas, acomodacoes, editarReserva }: { hospede: Hospede; reservas: Reserva[]; acomodacoes: Acomodacao[]; editarReserva: (reserva: Reserva) => void }) {
  const historico = reservas.filter((item) => item.hospedeResponsavelId === hospede.id).sort((a, b) => b.dataDeEntrada.localeCompare(a.dataDeEntrada));
  return <div className="ficha-hospede"><div className="dados-hospede"><div><small>Nome</small><b>{hospede.nomeCompleto}</b></div><div><small>Telefone</small><b>{hospede.telefone}</b></div><div><small>CPF</small><b>{hospede.cpf || 'Não informado'}</b></div><div><small>E-mail</small><b>{hospede.email || 'Não informado'}</b></div></div><h3>Histórico de reservas ({historico.length})</h3><div className="historico-hospede">{historico.map((reserva) => <button key={reserva.id} onClick={() => editarReserva(reserva)}><span><b>{acomodacoes.find((item) => item.id === reserva.acomodacaoId)?.identificacao ?? 'Acomodação'}</b><small>{formatarData(reserva.dataDeEntrada)} a {formatarData(reserva.dataDeSaida)}</small></span><strong>{reserva.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></button>)}</div></div>;
}
