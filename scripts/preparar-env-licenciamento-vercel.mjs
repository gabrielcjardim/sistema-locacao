import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

function lerAmbiente(conteudo) {
  return Object.fromEntries(conteudo.split(/\r?\n/).filter((linha) => /^[A-Z_]+=/.test(linha)).map((linha) => {
    const indice = linha.indexOf('=');
    return [linha.slice(0, indice), linha.slice(indice + 1).trim().replace(/^['"]|['"]$/g, '')];
  }));
}

const raiz = process.cwd();
const atual = lerAmbiente(await readFile(path.join(raiz, '.env.development.local'), 'utf8'));
const obrigatorias = ['LICENCA_SISTEMA_ID', 'LICENCA_INSTALACAO_ID', 'LICENCA_CHAVE_PUBLICA'];
for (const nome of obrigatorias) if (!atual[nome]) throw new Error(`${nome} não configurada no desenvolvimento.`);

const variaveis = {
  LICENCIAMENTO_ATIVO: 'true',
  LICENCA_SISTEMA_ID: atual.LICENCA_SISTEMA_ID,
  LICENCA_INSTALACAO_ID: atual.LICENCA_INSTALACAO_ID,
  LICENCA_CHAVE_PUBLICA: atual.LICENCA_CHAVE_PUBLICA,
  LICENCA_VALIDACAO_INICIAL_URL: 'https://central-de-licencas.vercel.app/api/validacao',
  LICENCA_INTERVALO_VERIFICACAO_SEGUNDOS: atual.LICENCA_INTERVALO_VERIFICACAO_SEGUNDOS || '200',
};

await writeFile(path.join(raiz, '.env.vercel.licenciamento'), Object.entries(variaveis).map(([nome, valor]) => `${nome}=${valor}`).join('\n') + '\n', { mode: 0o600 });
console.log('Arquivo protegido de licenciamento preparado sem exibir valores.');

