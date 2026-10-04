# Registro de implantação — 03/10/2026

## Componentes publicados

- Sistema de locação: `https://sistema-locacao-pi.vercel.app`.
- Central de Licenças: `https://central-de-licencas.vercel.app`.
- Repositórios privados separados: `gabrielcjardim/sistema-locacao` e `gabrielcjardim/central-de-licencas`.
- Persistência: PostgreSQL Neon compartilhado, com tabelas próprias para cada aplicação.

## Validações executadas

1. Verificação TypeScript e build de produção dos dois projetos concluídos sem erro.
2. Endpoint de saúde do sistema de locação respondeu HTTP 200.
3. Endpoint de saúde da Central respondeu HTTP 200.
4. Token Ed25519 válido foi aceito somente para o sistema e a instalação configurados.
5. A validação inicial na Central respondeu com licença ativa e intervalo de atualização.
6. A ativação do sistema respondeu HTTP 200, conferiu o identificador da licença e emitiu cookie seguro.
7. O estado recebido da licença passou a ser persistido na tabela `licenciamento_estado`, não no sistema de arquivos temporário da Vercel.
8. A Central registra `ativacao_validada` ou `ativacao_recusada` para tentativas de instalações conhecidas, sem armazenar o token completo.

## Ocorrências e correções

- A Central inicialmente não possuía conexão com o banco em produção. A integração Neon foi vinculada com prefixo `CENTRAL_`.
- A gravação do estado da licença inicialmente dependia de arquivo local, incompatível com a Vercel. Em produção, ela agora utiliza PostgreSQL; o arquivo permanece apenas como alternativa de desenvolvimento.
- A sincronização da chave pública foi automatizada. A chave privada permanece exclusivamente na Central.

## Segurança e rastreabilidade

- Senhas, tokens completos, segredos HMAC, conexão do banco e chave privada não são versionados nem registrados neste documento.
- Tokens emitidos aparecem na auditoria somente por hash SHA-256.
- Alterações de situação, validações e entrega de sinais possuem eventos datados na Central.
- A primeira ativação exige internet; depois dela, o sistema respeita o prazo e a tolerância assinados no token.

## Próxima evolução planejada

Preparar operação híbrida do sistema web com PostgreSQL instalado na rede local. O código já aceita `DATABASE_URL` para selecionar PostgreSQL e mantém alternativa por arquivo apenas no desenvolvimento. A etapa futura deverá incluir conexão segura entre a aplicação web e a rede local, backup automatizado, monitoramento e procedimento de contingência.

## Validação complementar — 04/10/2026

- A renovação passou a contar os dias exclusivamente a partir da nova emissão, sem acumular o saldo da licença anterior.
- A licença incorreta foi substituída pela vigência de 04/10/2026 a 03/11/2026, com tolerância até 10/11/2026.
- Emissão e reativação enviam o token no sinal HMAC; o destino também valida a assinatura Ed25519 antes de persistir e liberar o acesso.
- O estado remoto suspenso ou revogado prevalece sobre cookies e tokens anteriores da instalação.
- A interface da Central apresenta processamento, sucesso e falha de entrega do sinal.
- Teste em produção concluído: suspensão bloqueou um novo acesso e reativação liberou automaticamente a tela de ativação, mantendo 30 dias de vigência.
- A revogação não foi executada sobre a licença vigente por ser irreversível; sua transição foi validada por regra e build.
- Evolução futura registrada: isolamento multicliente usando o `clienteId` já assinado no token, sem expor o código na URL.

