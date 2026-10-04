# Licenciamento em produção

## Integração

- Central: `https://central-de-licencas.vercel.app`.
- Validação inicial: `POST /api/validacao` na Central.
- Recebimento de sinais: `POST /api/licenca/sinal` no sistema de locação.
- Assinatura dos tokens: Ed25519; somente a chave pública é instalada no sistema de locação.
- Assinatura dos sinais: HMAC SHA-256 com segredo individual gerado automaticamente na primeira ativação.

## Regras

1. A primeira ativação sempre exige internet.
2. O token é aceito somente para o produto e a instalação configurados.
3. O prazo normal e os sete dias de tolerância vêm assinados no token.
4. Reaplicar o mesmo token não prolonga nenhuma data.
5. Uma licença cancelada ou revogada não é reaberta; deve ser emitida uma nova.
6. Suspensão e reativação podem ser entregues imediatamente pelo endereço de sinal registrado na ativação.
7. Sem acesso à Central, o uso continua somente até o limite já assinado.

## Variáveis

O ambiente de produção utiliza `LICENCIAMENTO_ATIVO`, `LICENCA_SISTEMA_ID`, `LICENCA_INSTALACAO_ID`, `LICENCA_CHAVE_PUBLICA`, `LICENCA_VALIDACAO_INICIAL_URL` e `LICENCA_INTERVALO_VERIFICACAO_SEGUNDOS`.

Os valores reais ficam no cofre da Vercel. Tokens completos, segredos e chaves privadas não devem ser incluídos no GitHub nem na documentação.

O comando `node scripts/preparar-env-licenciamento-vercel.mjs` sincroniza automaticamente a chave pública com a chave privada da Central quando os dois repositórios estão lado a lado. Somente a chave pública é copiada; a chave privada nunca sai da Central.

## Auditoria

A Central registra emissão, mudança de situação, validação e entrega ou falha de sinais. O sistema de locação mantém no PostgreSQL o estado recebido e o horário da última atualização para aplicar a licença mesmo entre verificações. Em desenvolvimento sem `DATABASE_URL`, esse estado permanece em arquivo local.

