import type { CSSProperties } from 'react';
import { obterConfiguracoes } from '@/infraestrutura/repositorios/repositorio-de-configuracoes';
import { FormularioDeEntrada } from './formulario-de-entrada';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function PaginaDeEntrada() {
  const configuracoes = await obterConfiguracoes();

  return <main className="pagina-login" style={{ '--verde': configuracoes.corPrincipal } as CSSProperties}>
    <section className="cartao-login">
      <div className="marca-login"><span style={{ backgroundColor: configuracoes.corPrincipal }}>⌂</span><div><b>Meus Aptos</b><small>Gestão de locações</small></div></div>
      <h1>Bem-vindo</h1>
      <p>Entre com seu usuário para acessar o sistema.</p>
      <FormularioDeEntrada corPrincipal={configuracoes.corPrincipal} />
    </section>
  </main>;
}
