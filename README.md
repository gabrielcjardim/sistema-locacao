# Meus Aptos

Aplicação de gestão de locações escrita em português, com Next.js e PostgreSQL.

## Ambientes

O projeto possui dois ambientes completamente separados:

| Ambiente | Execução | Banco de dados |
| --- | --- | --- |
| Desenvolvimento | Computador local, porta 3100 | `dados-locais/banco.json` ou PostgreSQL exclusivo de desenvolvimento |
| Produção | Vercel | PostgreSQL gerenciado exclusivo de produção |

Os dados locais nunca são enviados ao GitHub. Em produção, a aplicação recusa funcionar sem `DATABASE_URL`; isso evita gravar informações em armazenamento temporário da Vercel.

## Desenvolvimento local

1. Instale as dependências com `npm install`.
2. Se quiser explicitar as variáveis, copie `.env.example` para `.env.development.local`.
3. Execute `npm run dev`.
4. Acesse `http://127.0.0.1:3100`.

Sem `DATABASE_URL`, os dados ficam em `dados-locais/banco.json`.

## Preparação da produção

1. Crie um PostgreSQL gerenciado exclusivo para produção.
2. Execute nesse banco o arquivo `banco/001_estrutura_inicial.sql`.
3. Na Vercel, cadastre no ambiente **Production**:
   - `AMBIENTE_APLICACAO=producao`
   - `DATABASE_URL` com a conexão protegida por SSL.
   - `AUTENTICACAO_OBRIGATORIA=true`
   - `USUARIO_ADMIN` com o nome usado para entrar.
   - `SENHA_ADMIN_HASH` gerado pelo comando `npm run gerar-senha -- "sua senha forte"`.
   - `SEGREDO_DA_SESSAO` com um valor aleatório de pelo menos 32 caracteres.
4. Conecte o repositório do GitHub ao projeto da Vercel.
5. Faça o deploy e consulte `/api/saude`.

Uma resposta com `"situacao":"saudavel"`, `"ambiente":"producao"` e `"persistencia":"postgresql"` confirma que a aplicação está usando o banco correto.

Em desenvolvimento a autenticação fica desligada por padrão. Em produção ela é obrigatória, protege tanto as páginas quanto as APIs e usa um cookie HTTP-only com duração de 12 horas.

## Validação antes de publicar

```bash
npm run verificar
npm run build
```

Para simular localmente o servidor otimizado de produção, configure antes uma `DATABASE_URL` de teste e execute:

```bash
npm run producao:local
```

Nunca copie a senha real para `.env.production.example` ou para qualquer arquivo versionado.
