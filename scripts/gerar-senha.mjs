import { randomBytes, scryptSync } from 'node:crypto';

const senha = process.argv[2];
if (!senha || senha.length < 10) {
  console.error('Informe uma senha com pelo menos 10 caracteres: npm run gerar-senha -- "sua senha"');
  process.exit(1);
}

const sal = randomBytes(16).toString('hex');
const hash = scryptSync(senha, sal, 64).toString('hex');
console.log(`${sal}:${hash}`);
