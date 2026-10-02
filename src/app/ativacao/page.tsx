import type { CSSProperties } from 'react';
import { obterConfiguracoes } from '@/infraestrutura/repositorios/repositorio-de-configuracoes';
import { configuracaoDoLicenciamento } from '@/infraestrutura/licenciamento/configuracao';
import { FormularioDeAtivacao } from './formulario-de-ativacao';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function PaginaDeAtivacao() {
  const configuracoes = await obterConfiguracoes();
  const licenciamento = configuracaoDoLicenciamento();
  return <main className="pagina-login" style={{ '--verde': configuracoes.corPrincipal } as CSSProperties}>
    <section className="cartao-login cartao-ativacao">
      <div className="marca-login"><span>⌂</span><div><b>Meus Aptos</b><small>Licenciamento da instalação</small></div></div>
      <h1>Ativar sistema</h1>
      <p>Informe um token válido para liberar esta instalação.</p>
      <FormularioDeAtivacao instalacaoId={licenciamento.instalacaoId} />
    </section>
  </main>;
}
