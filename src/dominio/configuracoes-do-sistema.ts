export const modeloPadraoDaMensagemWhatsapp = `Olá, {{nome_hospede}}!

Sua reserva foi {{acao_reserva}}.

{{alteracoes_reserva}}

Acomodação: {{acomodacao}}
Entrada: {{data_entrada}} às {{hora_entrada}}
Saída: {{data_saida}} às {{hora_saida}}
Hóspedes: {{quantidade_hospedes}}
Valor total: {{valor_total}}

Aguardamos você!`;

export const modeloPadraoDaMensagemWhatsappConclusao = `Olá, {{nome_hospede}}!

Esperamos que tenha aproveitado sua hospedagem na acomodação {{acomodacao}}.
Foi um prazer receber você. Agradecemos pela preferência e esperamos vê-lo novamente em breve!`;

export const modeloPadraoDaMensagemWhatsappCancelamento = `Olá, {{nome_hospede}}!

Sua hospedagem foi cancelada.

*Acomodação:* {{acomodacao}}
*Entrada:* {{data_entrada}} às {{hora_entrada}}
*Saída:* {{data_saida}} às {{hora_saida}}
*Hóspedes:* {{quantidade_hospedes}}
*Valor total:* {{valor_total}}`;

export interface ConfiguracoesDoSistema {
  corPrincipal: string;
  coresRecentes: string[];
  modeloDaMensagemWhatsapp: string;
  modeloDaMensagemWhatsappConclusao: string;
  modeloDaMensagemWhatsappCancelamento: string;
}

export const camposDaMensagemWhatsapp = [
  ['{{nome_hospede}}', 'Nome completo do hóspede'],
  ['{{telefone_hospede}}', 'Telefone do hóspede'],
  ['{{email_hospede}}', 'E-mail do hóspede'],
  ['{{cpf_hospede}}', 'CPF do hóspede'],
  ['{{codigo_reserva}}', 'Código da reserva'],
  ['{{acomodacao}}', 'Identificação da acomodação'],
  ['{{data_entrada}}', 'Data de entrada'],
  ['{{hora_entrada}}', 'Hora de entrada'],
  ['{{data_saida}}', 'Data de saída'],
  ['{{hora_saida}}', 'Hora de saída'],
  ['{{quantidade_hospedes}}', 'Quantidade de hóspedes'],
  ['{{valor_total}}', 'Valor total negociado'],
  ['{{valor_calculado}}', 'Valor calculado antes do ajuste'],
  ['{{ajuste_valor}}', 'Desconto ou acréscimo aplicado'],
  ['{{motivo_ajuste}}', 'Motivo do ajuste'],
  ['{{tipo_locacao}}', 'Tipo de locação'],
  ['{{situacao_reserva}}', 'Situação da reserva'],
  ['{{acao_reserva}}', 'Confirmação, alteração ou cancelamento'],
  ['{{alteracoes_reserva}}', 'Resumo automático do que foi alterado'],
] as const;
