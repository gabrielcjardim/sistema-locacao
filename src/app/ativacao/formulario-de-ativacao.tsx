'use client';

import { FormEvent, useEffect, useState } from 'react';

export function FormularioDeAtivacao({ instalacaoId, corPrincipal }: { instalacaoId: string; corPrincipal: string }) {
  const [mensagem, definirMensagem] = useState('');
  const [enviando, definirEnviando] = useState(false);

  useEffect(() => {
    let ativo = true;
    async function verificarReativacao() {
      try {
        const resposta = await fetch('/api/licenca/status', { cache: 'no-store' });
        const estado = await resposta.json();
        if (ativo && (estado.situacao === 'ativa' || estado.situacao === 'tolerancia')) {
          const destino = new URLSearchParams(window.location.search).get('destino') ?? '/';
          window.location.assign(destino);
        }
      } catch { /* A tela permanece disponível para ativação manual. */ }
    }
    verificarReativacao();
    const temporizador = window.setInterval(verificarReativacao, 5000);
    return () => { ativo = false; window.clearInterval(temporizador); };
  }, []);

  async function ativar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault(); definirEnviando(true); definirMensagem('');
    const formulario = new FormData(evento.currentTarget);
    const resposta = await fetch('/api/licenca/ativar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: formulario.get('token') }) });
    const resultado = await resposta.json();
    if (!resposta.ok) { definirMensagem(resultado.mensagem ?? 'Não foi possível ativar esta instalação.'); definirEnviando(false); return; }
    const destino = new URLSearchParams(window.location.search).get('destino') ?? '/';
    window.location.assign(destino);
  }

  return <form onSubmit={ativar}>
    <label>Código desta instalação<input value={instalacaoId || 'Não configurado'} readOnly /></label>
    <label>Token de liberação<textarea name="token" required rows={6} placeholder="Cole aqui o token fornecido pelo licenciador" /></label>
    {mensagem && <div className="erro-login" role="alert">{mensagem}</div>}
    <button className="botao-principal" style={{ backgroundColor: corPrincipal }} disabled={enviando}>{enviando ? 'Validando...' : 'Ativar sistema'}</button>
  </form>;
}

