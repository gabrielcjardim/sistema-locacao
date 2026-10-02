import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { BancoLocal } from './tipos';

const pastaDosDados = path.join(process.cwd(), 'dados-locais');
const caminhoDoBanco = path.join(pastaDosDados, 'banco.json');
const bancoVazio: BancoLocal = { acomodacoes: [], hospedes: [], reservas: [], regrasDePreco: [], configuracoes: { corPrincipal: '#FF5C00', coresRecentes: ['#FF5C00'] }, bloqueiosDeAgenda: [], vistorias: [], lancamentosFinanceiros: [], usuariosDoSistema: [] };

let filaDeGravacao = Promise.resolve();

export async function lerBancoLocal(): Promise<BancoLocal> {
  try {
    const banco = JSON.parse(await readFile(caminhoDoBanco, 'utf8')) as BancoLocal;
    banco.regrasDePreco ??= [];
    banco.configuracoes ??= { corPrincipal: '#FF5C00', coresRecentes: ['#FF5C00'] };
    banco.configuracoes.coresRecentes ??= [banco.configuracoes.corPrincipal];
    banco.configuracoes.coresRecentes = banco.configuracoes.coresRecentes.slice(0, 5);
    banco.bloqueiosDeAgenda ??= [];
    banco.vistorias ??= [];
    banco.lancamentosFinanceiros ??= [];
    banco.usuariosDoSistema ??= [];
    banco.acomodacoes = banco.acomodacoes.map((acomodacao) => ({ ...acomodacao, numeroDeQuartos: acomodacao.numeroDeQuartos ?? 1 }));
    banco.reservas = banco.reservas.map((reserva) => ({ ...reserva, horaDeEntrada: reserva.horaDeEntrada ?? '14:00', horaDeSaida: reserva.horaDeSaida ?? '11:00', valorCalculado: reserva.valorCalculado ?? reserva.valorTotal, ajusteNoValor: reserva.ajusteNoValor ?? 0, motivoDoAjuste: reserva.motivoDoAjuste ?? '' }));
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
