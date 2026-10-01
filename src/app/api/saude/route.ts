import { NextResponse } from 'next/server';
import {
  conexaoPostgres,
  garantirEstruturaDoBanco,
  obterAmbienteDaAplicacao,
  obterTipoDePersistencia,
} from '@/infraestrutura/banco/conexao';
import { lerBancoLocal } from '@/infraestrutura/banco/arquivo-local';
import { validarConfiguracaoDaAutenticacao } from '@/infraestrutura/autenticacao/sessao';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const ambiente = obterAmbienteDaAplicacao();
  const persistencia = obterTipoDePersistencia();

  try {
    const sql = conexaoPostgres();

    if (sql) {
      try {
        await garantirEstruturaDoBanco(sql);
        await sql`select 1 as conectado`;
      } finally {
        await sql.end();
      }
    } else {
      await lerBancoLocal();
    }

    validarConfiguracaoDaAutenticacao();

    return NextResponse.json({
      situacao: 'saudavel',
      ambiente,
      persistencia,
      verificadoEm: new Date().toISOString(),
    });
  } catch (erro) {
    console.error('Falha na verificação de saúde da aplicação:', erro);
    return NextResponse.json(
      {
        situacao: 'indisponivel',
        ambiente,
        persistencia,
        mensagem: erro instanceof Error ? erro.message : 'Falha desconhecida.',
        verificadoEm: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
