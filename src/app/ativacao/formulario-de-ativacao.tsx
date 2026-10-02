'use client';

import { FormEvent, useState } from 'react';

export function FormularioDeAtivacao({ instalacaoId }: { instalacaoId: string }) {
  const [mensagem, definirMensagem] = useState('');
  const [enviando, definirEnviando] = useState(false);

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
    <button className="botao-principal" disabled={enviando}>{enviando ? 'Validando...' : 'Ativar sistema'}</button>
  </form>;
}
