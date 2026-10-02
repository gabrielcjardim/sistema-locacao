import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { BancoLocal } from './tipos';
import { modeloPadraoDaMensagemWhatsapp, modeloPadraoDaMensagemWhatsappCancelamento, modeloPadraoDaMensagemWhatsappConclusao } from '@/dominio/configuracoes-do-sistema';

const pastaDosDados = path.join(process.cwd(), 'dados-locais');
const caminhoDoBanco = path.join(pastaDosDados, 'banco.json');
const bancoVazio: BancoLocal = { acomodacoes: [], hospedes: [], reservas: [], regrasDePreco: [], configuracoes: { corPrincipal: '#FF5C00', coresRecentes: ['#FF5C00'], modeloDaMensagemWhatsapp: modeloPadraoDaMensagemWhatsapp, modeloDaMensagemWhatsappConclusao: modeloPadraoDaMensagemWhatsappConclusao, modeloDaMensagemWhatsappCancelamento: modeloPadraoDaMensagemWhatsappCancelamento }, bloqueiosDeAgenda: [], vistorias: [], lancamentosFinanceiros: [], usuariosDoSistema: [] };

let filaDeGravacao = Promise.resolve();

export async function lerBancoLocal(): Promise<BancoLocal> {
  try {
    const banco = JSON.parse(await readFile(caminhoDoBanco, 'utf8')) as BancoLocal;
    banco.regrasDePreco ??= [];
    banco.configuracoes ??= { corPrincipal: '#FF5C00', coresRecentes: ['#FF5C00'], modeloDaMensagemWhatsapp: modeloPadraoDaMensagemWhatsapp, modeloDaMensagemWhatsappConclusao: modeloPadraoDaMensagemWhatsappConclusao, modeloDaMensagemWhatsappCancelamento: modeloPadraoDaMensagemWhatsappCancelamento };
    banco.configuracoes.coresRecentes ??= [banco.configuracoes.corPrincipal];
    banco.configuracoes.coresRecentes = banco.configuracoes.coresRecentes.slice(0, 5);
    banco.configuracoes.modeloDaMensagemWhatsapp ??= modeloPadraoDaMensagemWhatsapp;
    banco.configuracoes.modeloDaMensagemWhatsappConclusao ??= modeloPadraoDaMensagemWhatsappConclusao;
    banco.configuracoes.modeloDaMensagemWhatsappCancelamento ??= modeloPadraoDaMensagemWhatsappCancelamento;
    banco.bloqueiosDeAgenda ??= [];
    banco.vistorias ??= [];
    banco.lancamentosFinanceiros ??= [];
    banco.usuariosDoSistema ??= [];
    banco.usuariosDoSistema = banco.usuariosDoSistema.map((usuario) => ({ ...usuario, perfil: usuario.perfil ?? (usuario.usuario.toLowerCase() === process.env.USUARIO_ADMIN?.trim().toLowerCase() ? 'administrador_principal' : 'operador') }));
    banco.acomodacoes = banco.acomodacoes.map((acomodacao) => ({ ...acomodacao, numeroDeQuartos: acomodacao.numeroDeQuartos ?? 1 }));
    banco.reservas = banco.reservas.map((reserva) => ({ ...reserva, horaDeEntrada: reserva.horaDeEntrada ?? '14:00', horaDeSaida: reserva.horaDeSaida ?? '11:00', valorCalculado: reserva.valorCalculado ?? reserva.valorTotal, ajusteNoValor: reserva.ajusteNoValor ?? 0, motivoDoAjuste: reserva.motivoDoAjuste ?? '', ultimaAcao: reserva.ultimaAcao ?? (reserva.situacao === 'cancelada' ? 'cancelada' : reserva.situacao === 'concluida' ? 'concluida' : 'confirmada'), resumoDaUltimaAlteracao: reserva.resumoDaUltimaAlteracao ?? '' }));
    return banco;
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code !== 'ENOENT') throw erro;
    await mkdir(pastaDosDados, { recursive: true });
    await writeFile(caminhoDoBanco, JSON.stringify(bancoVazio, null, 2), 'utf8');
    return structuredClone(bancoVazio);
  }
}

export async function gravarBancoLocal(banco: BancoLocal): Promise<void> {
  filaDeGravacao = filaDeGravacao.then(async () => {
    await mkdir(pastaDosDados, { recursive: true });
    await writeFile(caminhoDoBanco, JSON.stringify(banco, null, 2), 'utf8');
  });
  return filaDeGravacao;
}
