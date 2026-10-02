alter table configuracoes_sistema
  add column if not exists modelo_mensagem_whatsapp text not null default $$Olá, {{nome_hospede}}! Sua reserva foi confirmada.

Acomodação: {{acomodacao}}
Entrada: {{data_entrada}} às {{hora_entrada}}
Saída: {{data_saida}} às {{hora_saida}}
Hóspedes: {{quantidade_hospedes}}
Valor total: {{valor_total}}

Aguardamos você!$$;
