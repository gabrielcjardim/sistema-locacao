'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function FormularioDeEntrada() {
  const roteador = useRouter();
  const [mensagem, definirMensagem] = useState('');
  const [enviando, definirEnviando] = useState(false);

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault(); definirEnviando(true); definirMensagem('');
    const formulario = new FormData(evento.currentTarget);
    const resposta = await fetch('/api/autenticacao/entrar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario: formulario.get('usuario'), senha: formulario.get('senha') }) });
    const resultado = await resposta.json();
    if (!resposta.ok) { definirMensagem(resultado.mensagem ?? 'Não foi possível entrar.'); definirEnviando(false); return; }
    roteador.replace('/'); roteador.refresh();
  }

  return <form onSubmit={entrar}>
    <label><span>Usuário</span><input name="usuario" autoComplete="username" required autoFocus /></label>
    <label><span>Senha</span><input name="senha" type="password" autoComplete="current-password" required /></label>
    {mensagem && <div className="erro-login" role="alert">{mensagem}</div>}
    <button className="botao-principal" disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}</button>
  </form>;
}
