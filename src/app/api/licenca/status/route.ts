import { NextRequest, NextResponse } from 'next/server';
import { configuracaoDoLicenciamento, licenciamentoObrigatorio, nomeDoCookieDaLicenca } from '@/infraestrutura/licenciamento/configuracao';
import { validarTokenDaLicenca } from '@/infraestrutura/licenciamento/token';
import { lerEstadoRecebido } from '@/infraestrutura/licenciamento/estado-da-licenca';

export async function GET(requisicao: NextRequest) {
  const configuracao = configuracaoDoLicenciamento();
  if (!licenciamentoObrigatorio()) return NextResponse.json({ obrigatoria: false, situacao: 'desativada', instalacaoId: configuracao.instalacaoId, intervaloDeVerificacaoSegundos: configuracao.intervaloDeVerificacaoSegundos });
  try {
    const estadoRecebido = await lerEstadoRecebido();
    const token = estadoRecebido?.situacao === 'ativa' && estadoRecebido.tokenDaLicenca ? estadoRecebido.tokenDaLicenca : requisicao.cookies.get(nomeDoCookieDaLicenca)?.value;
    if (!token) return NextResponse.json({ obrigatoria: true, situacao: 'ausente', instalacaoId: configuracao.instalacaoId, intervaloDeVerificacaoSegundos: configuracao.intervaloDeVerificacaoSegundos });
    const licenca = await validarTokenDaLicenca(token);
    const situacao = estadoRecebido?.licencaId === licenca.conteudo.licencaId && estadoRecebido.situacao !== 'ativa' ? estadoRecebido.situacao : licenca.situacao;
    return NextResponse.json({ obrigatoria: true, situacao, ultimoSinalEm: estadoRecebido?.atualizadoEm, intervaloDeVerificacaoSegundos: estadoRecebido?.intervaloVerificacaoSegundos ?? configuracao.intervaloDeVerificacaoSegundos, instalacaoId: configuracao.instalacaoId, licenca: licenca.conteudo });
  } catch { return NextResponse.json({ obrigatoria: true, situacao: 'invalida', instalacaoId: configuracao.instalacaoId, intervaloDeVerificacaoSegundos: configuracao.intervaloDeVerificacaoSegundos }); }
}

