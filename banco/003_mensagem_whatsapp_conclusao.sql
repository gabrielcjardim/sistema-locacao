alter table configuracoes_sistema
  add column if not exists modelo_mensagem_whatsapp_conclusao text not null default $$Olá, {{nome_hospede}}!

Esperamos que tenha aproveitado sua hospedagem na acomodação {{acomodacao}}.
Foi um prazer receber você. Agradecemos pela preferência e esperamos vê-lo novamente em breve!$$;
